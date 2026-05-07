"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_SITE_ID,
  TENNIS_OUTDOOR_TYPE_ID,
  TENNIS_INDOOR_TYPE_ID,
  PICKLEBALL_TYPE_ID,
  dateForIC3,
  type InitResponse,
  type SearchResult,
  type SearchResponse,
} from "@/lib/ic3";

type Init = InitResponse["result"];

const SPORT_OPTIONS: { id: string; label: string; typeIds: string }[] = [
  { id: "tennis-out", label: "Tennis (outdoor)", typeIds: String(TENNIS_OUTDOOR_TYPE_ID) },
  { id: "tennis-in", label: "Tennis (indoor)", typeIds: String(TENNIS_INDOOR_TYPE_ID) },
  { id: "tennis-all", label: "Tennis (all)", typeIds: `${TENNIS_OUTDOOR_TYPE_ID},${TENNIS_INDOOR_TYPE_ID}` },
  { id: "pickleball", label: "Pickleball", typeIds: String(PICKLEBALL_TYPE_ID) },
];

const TIME_FILTERS = [
  { id: "all", label: "All", start: 0, end: 24 },
  { id: "morning", label: "Morning (before 12pm)", start: 0, end: 12 },
  { id: "afternoon", label: "Afternoon (12–5pm)", start: 12, end: 17 },
  { id: "evening", label: "Evening (5pm+)", start: 17, end: 24 },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });
}

function formatDayLabel(d: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diff === 0) return `Today · ${dateStr}`;
  if (diff === 1) return `Tomorrow · ${dateStr}`;
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  return `${weekday} · ${dateStr}`;
}

function dateNDaysOut(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

export default function Home() {
  const [init, setInit] = useState<Init | null>(null);
  const [siteId, setSiteId] = useState<number>(DEFAULT_SITE_ID);
  const [sportId, setSportId] = useState<string>("tennis-out");
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [timeFilter, setTimeFilter] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [searchedAt, setSearchedAt] = useState<Date | null>(null);
  const [searchedContext, setSearchedContext] = useState<{
    siteId: number;
    facilityTypeIds: string;
    date: string;
  } | null>(null);

  function toMontrealOffset(iso: string): string {
    // Convert UTC ISO (e.g. 2026-05-08T19:00:00.000Z) to "...-04:00" / "...-05:00"
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)!.value;
    const hour = get("hour") === "24" ? "00" : get("hour");
    // Determine offset by comparing TZ-formatted to UTC. EDT=-04:00, EST=-05:00.
    const tzName = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Toronto",
      timeZoneName: "shortOffset",
    })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")!.value;
    const m = tzName.match(/GMT([+-])(\d{1,2})/);
    const sign = m ? m[1] : "-";
    const digits = m ? m[2].padStart(2, "0") : "04";
    const offset = `${sign}${digits}:00`;
    return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}.000${offset}`;
  }

  function ic3DeepLink(slot?: SearchResult): string {
    if (!searchedContext)
      return "https://loisirs.montreal.ca/IC3/#/U6510/search/";
    const value: Record<string, unknown> = {
      siteId: searchedContext.siteId,
      facilityTypeIds: searchedContext.facilityTypeIds,
      dates: [searchedContext.date],
    };
    if (slot) {
      value.startTime = toMontrealOffset(slot.startDateTime);
      value.endTime = toMontrealOffset(slot.endDateTime);
    }
    const param = {
      filter: { isCollapsed: false, value },
      sortable: { isOrderAsc: true, column: "facility.name" },
    };
    return `https://loisirs.montreal.ca/IC3/#/U6510/search/?searchParam=${encodeURIComponent(
      JSON.stringify(param),
    )}`;
  }

  useEffect(() => {
    fetch("/api/init")
      .then((r) => r.json())
      .then((d: Init) => setInit(d))
      .catch(() => setError("Couldn't load options"));
  }, []);

  const sport = useMemo(
    () => SPORT_OPTIONS.find((s) => s.id === sportId) ?? SPORT_OPTIONS[0],
    [sportId],
  );

  const sites = useMemo(() => {
    if (!init) return [];
    return [...init.sites].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [init]);

  async function search() {
    setLoading(true);
    setError(null);
    setResults(null);
    setSearchedAt(null);

    const date = dateForIC3(dateNDaysOut(dayOffset));
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          limit: 200,
          offset: 0,
          facilityTypeIds: sport.typeIds,
          siteId,
          dates: [date],
        }),
      });
      const data = (await res.json()) as SearchResponse | { error: string };
      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : `Erreur ${res.status}`);
        return;
      }
      setResults(data.results);
      setRecordCount(data.recordCount);
      setSearchedAt(new Date());
      setSearchedContext({
        siteId,
        facilityTypeIds: sport.typeIds,
        date,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const filteredResults = useMemo(() => {
    if (!results) return null;
    const tf = TIME_FILTERS.find((t) => t.id === timeFilter)!;
    return results.filter((r) => {
      const h = new Date(r.startDateTime).toLocaleString("en-US", {
        hour: "2-digit",
        hour12: false,
        timeZone: "America/Toronto",
      });
      const hour = parseInt(h, 10);
      return hour >= tf.start && hour < tf.end;
    });
  }, [results, timeFilter]);

  const byTime = useMemo(() => {
    if (!filteredResults) return null;
    const map = new Map<
      string,
      {
        startIso: string;
        endIso: string;
        slots: SearchResult[];
      }
    >();
    for (const r of filteredResults) {
      const key = `${r.startDateTime}|${r.endDateTime}`;
      if (!map.has(key)) {
        map.set(key, {
          startIso: r.startDateTime,
          endIso: r.endDateTime,
          slots: [],
        });
      }
      map.get(key)!.slots.push(r);
    }
    for (const v of map.values()) {
      v.slots.sort((a, b) =>
        a.facility.name.localeCompare(b.facility.name, "fr", { numeric: true }),
      );
    }
    return [...map.values()].sort((a, b) =>
      a.startIso.localeCompare(b.startIso),
    );
  }, [filteredResults]);

  function shortCourtName(name: string): string {
    // "Terrain de tennis #11, La Fontaine" → "#11"
    const m = name.match(/#\s*(\d+)/);
    return m ? `#${m[1]}` : name;
  }

  // Auto-refresh stale tab on focus (>24h since last fetch).
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      if (!searchedAt) return;
      const ageMs = Date.now() - searchedAt.getTime();
      if (ageMs > 24 * 60 * 60 * 1000) {
        window.location.reload();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [searchedAt]);

  const dayButtons = [0, 1, 2, 3];
  const selectedSiteName =
    init?.sites.find((s) => s.id === siteId)?.name ?? "…";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-16 w-full">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Montréal · Loisirs
        </p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
          Better tennis booking
          <span className="block text-muted-foreground font-medium">
            for Montreal
          </span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          A faster, cleaner way to find open courts on{" "}
          <span className="font-medium text-foreground">
            loisirs.montreal.ca
          </span>
          . One click jumps straight to the booking page.
        </p>
      </header>

      <Card className="mb-6 border-primary/30 bg-primary/[0.04] shadow-none">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </div>
            <div>
              <p className="font-semibold leading-tight">
                Sign in to Loisirs Montréal
              </p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Once. After that, clicking any slot here goes straight to the
                booking page.
              </p>
            </div>
          </div>
          <a
            href="https://loisirs.montreal.ca/IC3/"
            target="_blank"
            rel="noreferrer"
            className={
              buttonVariants({ variant: "default", size: "lg" }) +
              " w-full sm:w-auto whitespace-normal text-center"
            }
          >
            Sign in →
          </a>
        </CardContent>
      </Card>

      <Card className="mb-6 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold">
              2
            </span>
            Find your slot
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label>Day</Label>
            <div className="flex flex-wrap gap-2">
              {dayButtons.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={dayOffset === n ? "default" : "outline"}
                  onClick={() => setDayOffset(n)}
                  className="min-w-32"
                >
                  {formatDayLabel(dateNDaysOut(n))}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Sport</Label>
              <Select value={sportId} onValueChange={(v) => v && setSportId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v) =>
                      SPORT_OPTIONS.find((s) => s.id === v)?.label ?? ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SPORT_OPTIONS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Select
                value={String(siteId)}
                onValueChange={(v) => v && setSiteId(parseInt(v, 10))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedSiteName}>
                    {(v) =>
                      sites.find((s) => String(s.id) === v)?.name ??
                      selectedSiteName
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            size="lg"
            onClick={search}
            disabled={loading}
            className="w-full sm:w-auto sm:self-start"
          >
            {loading ? "Searching…" : "See available slots"}
          </Button>
        </CardContent>
      </Card>

      {(loading || results) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {TIME_FILTERS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant={timeFilter === t.id ? "default" : "outline"}
              onClick={() => setTimeFilter(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      )}

      {loading && (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            The City&apos;s site is slow (sometimes 30–60s). Hang tight…
          </p>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {error && !loading && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-destructive">Oops · {error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={search}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {byTime && !loading && (
        <div className="grid gap-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted-foreground">
              {byTime.length} time
              {byTime.length === 1 ? "" : "s"} available
              {recordCount > (filteredResults?.length ?? 0) && (
                <span> · {filteredResults?.length} of {recordCount} slots</span>
              )}
            </p>
            {searchedAt && (
              <p className="text-xs text-muted-foreground">
                {searchedAt.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          {byTime.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No slots found for this combination.
              </CardContent>
            </Card>
          )}

          {byTime.map((bucket) => {
            const freeCount = bucket.slots.filter((s) => s.totalPrice === 0).length;
            const minPrice = Math.min(...bucket.slots.map((s) => s.totalPrice));
            return (
              <Card key={bucket.startIso} className="shadow-none">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 mb-3">
                    <div className="flex items-baseline gap-2 sm:min-w-[140px]">
                      <span className="text-2xl font-bold tracking-tight tabular-nums">
                        {formatTime(bucket.startIso)}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        – {formatTime(bucket.endIso)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {bucket.slots.length} court
                        {bucket.slots.length === 1 ? "" : "s"}
                      </span>
                      {freeCount > 0 ? (
                        <span className="font-semibold text-foreground">
                          · {freeCount} free
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          · from ${minPrice.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {bucket.slots.map((s) => {
                      const free = s.totalPrice === 0;
                      return (
                        <a
                          key={s.facilityScheduleId}
                          href={ic3DeepLink(s)}
                          target="_blank"
                          rel="noreferrer"
                          title={s.facility.name}
                          className={
                            buttonVariants({
                              variant: free ? "default" : "outline",
                              size: "sm",
                            }) + " h-auto py-1.5 tabular-nums"
                          }
                        >
                          <span className="font-semibold">
                            {shortCourtName(s.facility.name)}
                          </span>
                          <span className="ml-1.5 text-xs opacity-70">
                            {free ? "Free" : `$${s.totalPrice.toFixed(0)}`}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <section className="mt-16 grid gap-6 sm:grid-cols-2 text-sm">
        <div>
          <h2 className="font-semibold mb-2">How this works</h2>
          <p className="text-muted-foreground leading-relaxed">
            This site queries the City of Montreal&apos;s public reservation
            system (loisirs.montreal.ca) directly and shows only what matters:
            what time slots are open, at which park, and at what price.
            Booking happens on the City&apos;s site — sign in once and every
            slot click jumps you straight to checkout.
          </p>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Tips</h2>
          <ul className="text-muted-foreground leading-relaxed list-disc pl-4 space-y-1">
            <li>Bookings open 2 days in advance.</li>
            <li>
              Late-night slots (after 10 PM) are often free at outdoor courts.
            </li>
            <li>
              Parc La Fontaine, Jeanne-Mance, and IGA Stadium have the most
              courts.
            </li>
          </ul>
        </div>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground space-y-3">
        <p>
          Clicking a slot opens loisirs.montreal.ca filtered to that exact
          time. Click the green <span className="font-mono">+</span> next to
          your row to add it to your cart and book. If you&apos;re not signed
          in yet, use the Sign in button at the top.
        </p>
        <p>
          Not affiliated with the City of Montreal. All bookings are processed
          on{" "}
          <a
            href="https://loisirs.montreal.ca/IC3/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            loisirs.montreal.ca
          </a>
          .
        </p>
        <p className="pt-2">
          Made with love of tennis by{" "}
          <a
            href="https://heyandre.so"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            heyandre.so
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/KatFishSnake/better-tennis-selector-montreal"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Source on GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
