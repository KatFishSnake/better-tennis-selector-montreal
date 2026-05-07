"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEFAULT_SITE_ID,
  dateForIC3,
  type InitResponse,
  PICKLEBALL_TYPE_ID,
  type SearchResponse,
  type SearchResult,
  TENNIS_INDOOR_TYPE_ID,
  TENNIS_OUTDOOR_TYPE_ID,
} from "@/lib/ic3";

type Init = InitResponse["result"];

type SportOption = { id: string; label: string; typeIds: string };

const TENNIS_OUTDOOR: SportOption = {
  id: "tennis-out",
  label: "Tennis (outdoor)",
  typeIds: String(TENNIS_OUTDOOR_TYPE_ID),
};

const SPORT_OPTIONS: readonly SportOption[] = [
  TENNIS_OUTDOOR,
  { id: "tennis-in", label: "Tennis (indoor)", typeIds: String(TENNIS_INDOOR_TYPE_ID) },
  {
    id: "tennis-all",
    label: "Tennis (all)",
    typeIds: `${TENNIS_OUTDOOR_TYPE_ID},${TENNIS_INDOOR_TYPE_ID}`,
  },
  { id: "pickleball", label: "Pickleball", typeIds: String(PICKLEBALL_TYPE_ID) },
];

type TimeFilter = { id: string; label: string; start: number; end: number };

const TIME_FILTER_ALL: TimeFilter = { id: "all", label: "All", start: 0, end: 24 };

const TIME_FILTERS: readonly TimeFilter[] = [
  TIME_FILTER_ALL,
  { id: "morning", label: "Morning (before 12pm)", start: 0, end: 12 },
  { id: "afternoon", label: "Afternoon (12–5pm)", start: 12, end: 17 },
  { id: "evening", label: "Evening (5pm+)", start: 17, end: 24 },
];

function bucketKey(iso: string): string {
  const d = new Date(iso);
  const day = d
    .toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "America/Toronto",
    })
    .toLowerCase();
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Toronto",
  });
  return `${day}-${time}`;
}

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
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const hour = get("hour") === "24" ? "00" : get("hour");
    // Determine offset by comparing TZ-formatted to UTC. EDT=-04:00, EST=-05:00.
    const tzName =
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Toronto",
        timeZoneName: "shortOffset",
      })
        .formatToParts(d)
        .find((p) => p.type === "timeZoneName")?.value ?? "GMT-04";
    const m = tzName.match(/GMT([+-])(\d{1,2})/);
    const sign = m?.[1] ?? "-";
    const digits = (m?.[2] ?? "04").padStart(2, "0");
    const offset = `${sign}${digits}:00`;
    return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}:${get("second")}.000${offset}`;
  }

  function ic3DeepLink(slot?: SearchResult): string {
    if (!searchedContext) return "https://loisirs.montreal.ca/IC3/#/U6510/search/";
    const value: Record<string, unknown> = {
      siteId: searchedContext.siteId,
      facilityTypeIds: searchedContext.facilityTypeIds,
      dates: [searchedContext.date],
    };
    if (slot) {
      value.startTime = toMontrealOffset(slot.startDateTime);
      value.endTime = toMontrealOffset(slot.endDateTime);
    }
    const param: Record<string, unknown> = {
      filter: { isCollapsed: false, value },
      sortable: { isOrderAsc: true, column: "facility.name" },
    };
    if (slot) {
      // Use the full court name as the IC3 textbox filter — uniquely
      // identifies the court, robust to inconsistent naming (some
      // courts have "#N", others just "N").
      param.search = slot.facility.name;
    }
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

  const sport: SportOption = useMemo(
    () => SPORT_OPTIONS.find((s) => s.id === sportId) ?? TENNIS_OUTDOOR,
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
    const tf = TIME_FILTERS.find((t) => t.id === timeFilter) ?? TIME_FILTER_ALL;
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

  // Preferences: keyed by "<dayOfWeek>-<HH:MM>" (local Montreal time).
  // Captures the "I usually book Friday at 7pm" pattern.
  const PREF_KEY = "tennismtl.preferences.v1";
  const [preferences, setPreferences] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) setPreferences(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function persistPreferences(next: Record<string, number>) {
    setPreferences(next);
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }

  function recordPreference(iso: string) {
    const k = bucketKey(iso);
    persistPreferences({ ...preferences, [k]: (preferences[k] ?? 0) + 1 });
  }

  function removePreference(iso: string) {
    const k = bucketKey(iso);
    const next = { ...preferences };
    delete next[k];
    persistPreferences(next);
  }

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
      map.get(key)?.slots.push(r);
    }
    for (const v of map.values()) {
      v.slots.sort((a, b) =>
        a.facility.name.localeCompare(b.facility.name, "fr", { numeric: true }),
      );
    }
    const buckets = [...map.values()].map((b) => ({
      ...b,
      preferred: preferences[bucketKey(b.startIso)] ?? 0,
    }));
    return buckets.sort((a, b) => {
      if (a.preferred !== b.preferred) return b.preferred - a.preferred;
      return a.startIso.localeCompare(b.startIso);
    });
  }, [filteredResults, preferences]);

  function shortCourtName(name: string): string {
    // "Terrain de tennis #11, La Fontaine" → "#11"
    // "Terrain de tennis 14, La Fontaine"  → "#14"  (city data is inconsistent)
    const m = name.match(/tennis\s*#?\s*(\d+)/i);
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
  const selectedSiteName = init?.sites.find((s) => s.id === siteId)?.name ?? "…";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-16 w-full">
      <header className="mb-8 sm:mb-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Montréal · Loisirs
        </p>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
          Tennis MTL
          <span className="block text-muted-foreground font-medium">
            better tennis booking for Montreal
          </span>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-xl">
          A faster, cleaner way to find open courts on{" "}
          <span className="font-medium text-foreground">loisirs.montreal.ca</span>. Availability is
          queried live; one click jumps straight to the booking page.
        </p>
      </header>

      <Card className="mb-6 border-primary/20 bg-primary/5 shadow-none">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-start gap-3 flex-1">
            <div
              aria-hidden="true"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold"
            >
              1
            </div>
            <div>
              <p className="font-semibold leading-tight">
                <span className="sr-only">Step 1: </span>
                Sign in to Loisirs Montréal
              </p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Once. After that, clicking any slot here goes straight to the booking page.
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
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold"
            >
              2
            </span>
            <span className="sr-only">Step 2: </span>
            Find your slot
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label id="day-label">Day</Label>
            <div
              role="group"
              aria-labelledby="day-label"
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
            >
              {dayButtons.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={dayOffset === n ? "default" : "outline"}
                  onClick={() => setDayOffset(n)}
                  className="w-full sm:w-auto sm:min-w-32"
                >
                  {formatDayLabel(dateNDaysOut(n))}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sport-trigger">Sport</Label>
              <Select value={sportId} onValueChange={(v) => v && setSportId(v)}>
                <SelectTrigger id="sport-trigger" className="w-full">
                  <SelectValue>
                    {(v) => SPORT_OPTIONS.find((s) => s.id === v)?.label ?? ""}
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
              <Label htmlFor="location-trigger">Location</Label>
              <Select value={String(siteId)} onValueChange={(v) => v && setSiteId(parseInt(v, 10))}>
                <SelectTrigger id="location-trigger" className="w-full">
                  <SelectValue placeholder={selectedSiteName}>
                    {(v) => sites.find((s) => String(s.id) === v)?.name ?? selectedSiteName}
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
            aria-busy={loading}
            className="w-full sm:w-auto sm:self-start disabled:opacity-100 disabled:bg-primary/70"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"
                />
                Searching…
              </span>
            ) : (
              "See available slots"
            )}
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
            <Button variant="outline" size="sm" className="mt-3" onClick={search}>
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
                <span>
                  {" "}
                  · {filteredResults?.length} of {recordCount} slots
                </span>
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
              <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                <p className="text-sm font-medium">No slots match this combination.</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Try a different day, switch sport to{" "}
                  <span className="font-medium text-foreground">Tennis (all)</span>, or clear the
                  time filter — then run the search again.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {timeFilter !== "all" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTimeFilter("all")}
                    >
                      Clear time filter
                    </Button>
                  )}
                  {dayOffset !== 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDayOffset(1)}
                    >
                      Try tomorrow
                    </Button>
                  )}
                  {sportId !== "tennis-all" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSportId("tennis-all")}
                    >
                      Try Tennis (all)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {byTime.map((bucket) => {
            const minPrice = Math.min(...bucket.slots.map((s) => s.totalPrice));
            const isPreferred = bucket.preferred > 0;
            return (
              <Card
                key={bucket.startIso}
                className={
                  "shadow-none transition-colors " +
                  (isPreferred ? "border-foreground/30 bg-foreground/[0.02]" : "")
                }
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xl font-bold tracking-tight tabular-nums">
                        {formatTime(bucket.startIso)}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        – {formatTime(bucket.endIso)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {bucket.slots.length} court
                        {bucket.slots.length === 1 ? "" : "s"}
                        {minPrice > 0 ? ` · from $${minPrice.toFixed(0)}` : ""}
                      </span>
                    </div>
                    {isPreferred && (
                      <button
                        type="button"
                        onClick={() => removePreference(bucket.startIso)}
                        aria-label={`Remove ${formatTime(bucket.startIso)} from your usual times`}
                        title="Remove from your usual times"
                        className="-my-1 -mr-1 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider text-muted-foreground/80 hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <span>your usual</span>
                        <span
                          aria-hidden="true"
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-muted-foreground/30 leading-none"
                        >
                          ×
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {bucket.slots.map((s) => (
                      <a
                        key={s.facilityScheduleId}
                        href={ic3DeepLink(s)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => recordPreference(s.startDateTime)}
                        title={s.facility.name}
                        className={`${buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })} h-auto py-1 tabular-nums`}
                      >
                        <span className="font-semibold">{shortCourtName(s.facility.name)}</span>
                        <span className="ml-1.5 text-xs opacity-70">
                          {s.totalPrice === 0 ? "Free" : `$${s.totalPrice.toFixed(0)}`}
                        </span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <section id="how-it-works" className="mt-16 text-sm">
        <h2 className="font-semibold mb-2 text-base">How Tennis MTL works</h2>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Tennis MTL queries the City of Montreal&apos;s public reservation system
          (loisirs.montreal.ca) directly and shows only what matters: which time slots are open, at
          which park, and at what price. Booking happens on the City&apos;s site — sign in once and
          every slot click jumps you straight to checkout.
        </p>
      </section>

      <section id="faq" className="mt-10 text-sm">
        <h2 className="font-semibold mb-4 text-base">Montreal tennis booking — quick answers</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="font-medium text-foreground mb-1">
              When does the Montreal tennis booking window open?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Bookings on loisirs.montreal.ca open 2 days in advance. Slots become reservable 48
              hours before play time and fill quickly during peak evening hours.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">
              Are there free tennis courts in Montreal?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Yes — outdoor public courts are often free for late-night slots, typically after 10
              PM. Daytime and prime-time slots are paid, with prices varying by borough. Indoor
              courts (e.g. Complexe sportif Claude-Robillard) are paid year-round.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">
              Which Montreal parks have the most tennis courts?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Parc La Fontaine (14 outdoor courts), Parc Jeanne-Mance, and Complexe sportif
              Claude-Robillard have the largest concentration of bookable courts on
              loisirs.montreal.ca. La Fontaine and Jeanne-Mance are outdoor public courts;
              Claude-Robillard has 4 indoor courts year-round plus 10 outdoor in summer.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">
              Do I need a Loisirs Montréal account?
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Yes. All bookings are processed on loisirs.montreal.ca and require a free Loisirs
              Montréal account. Sign in once on the City&apos;s site, then any slot click here goes
              straight to checkout.
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          See the{" "}
          <a href="/faq" className="underline-offset-4 hover:underline hover:text-foreground">
            full FAQ
          </a>
          , the{" "}
          <a href="/courts" className="underline-offset-4 hover:underline hover:text-foreground">
            Montreal courts directory
          </a>
          , or read{" "}
          <a href="/about" className="underline-offset-4 hover:underline hover:text-foreground">
            about this project
          </a>
          .
        </p>
      </section>

      <footer className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground space-y-3">
        <p>
          Availability is refreshed live from loisirs.montreal.ca on every search. Site last updated{" "}
          <time dateTime="2026-05-07">May 7, 2026</time>.
        </p>
        <p>
          Clicking a slot opens loisirs.montreal.ca filtered to that exact time. Click the green{" "}
          <span className="font-mono">+</span> next to your row to add it to your cart and book. If
          you&apos;re not signed in yet, use the Sign in button at the top.
        </p>
        <p>
          Not affiliated with the City of Montreal. All bookings are processed on{" "}
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
            href="https://github.com/KatFishSnake/tennismtl.com"
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
