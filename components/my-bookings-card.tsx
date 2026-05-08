"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type BookingPayload,
  bookingCourtName,
  clearBookings,
  getBookmarkletHref,
  loadBookings,
  parseBookingStart,
  type StoredBooking,
} from "@/lib/bookings";

function formatBookingTime(b: StoredBooking): string {
  const d = parseBookingStart(b);
  if (!d) return b.d;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });
}

function isUpcoming(b: StoredBooking, now: number): boolean {
  const d = parseBookingStart(b);
  if (!d) return false;
  // Keep visible until end of the booked hour.
  return d.getTime() + 60 * 60 * 1000 > now;
}

export function MyBookingsCard({
  onChange,
}: {
  onChange?: (payload: BookingPayload | null) => void;
}) {
  const [payload, setPayload] = useState<BookingPayload | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bookmarkletHref = useMemo(() => getBookmarkletHref(), []);

  useEffect(() => {
    const p = loadBookings();
    setPayload(p);
    setHydrated(true);
    onChange?.(p);
  }, [onChange]);

  const upcoming = useMemo(() => {
    if (!payload) return [];
    const now = Date.now();
    return payload.items
      .filter((b) => isUpcoming(b, now))
      .sort((a, b) => {
        const da = parseBookingStart(a)?.getTime() ?? 0;
        const db = parseBookingStart(b)?.getTime() ?? 0;
        return da - db;
      });
  }, [payload]);

  if (!hydrated) return null;

  if (!payload || payload.items.length === 0) {
    return (
      <Card className="mb-6 border-dashed shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-eyebrow text-muted-foreground mb-1.5">
                Optional · Power user
              </p>
              <p className="font-semibold leading-tight">See your existing reservations here</p>
              <p className="text-sm text-muted-foreground mt-1.5">
                One-time setup pulls your upcoming bookings from loisirs.montreal.ca so they show up
                next to search results.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowInstall((s) => !s)}
            >
              {showInstall ? "Hide" : "Set it up"}
            </Button>
          </div>
          {showInstall && <InstallSteps href={bookmarkletHref} />}
        </CardContent>
      </Card>
    );
  }

  const updated = new Date(payload.ts);

  return (
    <Card className="mb-6 border-court/30 bg-court/[0.04] shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-court mb-1">
              Your bookings
            </p>
            <p className="text-sm text-muted-foreground">
              {upcoming.length} upcoming · synced{" "}
              <time dateTime={updated.toISOString()}>
                {updated.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </time>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowInstall((s) => !s)}
            >
              Re-sync
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                clearBookings();
                setPayload(null);
                onChange?.(null);
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing upcoming. Your past reservations have been removed from this view.
          </p>
        ) : (
          <ul className="grid gap-2">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-md border border-court/20 bg-background/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{bookingCourtName(b)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatBookingTime(b)}
                    {b.t > 0 ? ` · $${b.t.toFixed(2)}` : " · Free"}
                    {b.x ? ` · ${b.x}` : ""}
                  </p>
                </div>
                <a
                  href="https://loisirs.montreal.ca/IC3/#/U3100/member/view/?scrollTo=%23u3100_saleItemsHeader"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline shrink-0"
                >
                  Manage →
                </a>
              </li>
            ))}
          </ul>
        )}

        {showInstall && <InstallSteps href={bookmarkletHref} />}
      </CardContent>
    </Card>
  );
}

// React 19 blocks `javascript:` URLs in `href` attributes during render. We
// need the real href on the element so the user can drag it to their bookmarks
// bar — set it imperatively after mount via `setAttribute`, which bypasses
// React's attribute-setter guard.
function BookmarkletAnchor({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ref.current?.setAttribute("href", href);
  }, [href]);
  return (
    // biome-ignore lint/a11y/useValidAnchor: anchor is required so the user can drag it to the bookmarks bar; a button can't be bookmarked.
    // biome-ignore lint/a11y/noStaticElementInteractions: onClick is a click-blocker, the real action is the drag-to-bookmarks-bar gesture.
    <a ref={ref} draggable="true" onClick={(e) => e.preventDefault()} className={className}>
      {children}
    </a>
  );
}

function InstallSteps({ href }: { href: string }) {
  return (
    <div className="mt-5 rounded-md border border-border bg-background p-4 text-sm">
      <ol className="list-decimal pl-5 space-y-2 text-muted-foreground leading-relaxed">
        <li>
          Show your bookmarks bar (View → Show Bookmarks Bar, or{" "}
          <kbd className="px-1 rounded bg-muted text-foreground">⌘⇧B</kbd>).
        </li>
        <li>
          Drag this button up to your bookmarks bar:{" "}
          <BookmarkletAnchor
            href={href}
            className="ml-1 inline-flex items-center rounded-md border border-court/40 bg-court/10 px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-court/20"
          >
            🎾 Sync to Tennis MTL
          </BookmarkletAnchor>
        </li>
        <li>
          Open{" "}
          <a
            href="https://loisirs.montreal.ca/IC3/"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            loisirs.montreal.ca
          </a>{" "}
          and sign in.
        </li>
        <li>
          Click the bookmark you just made. You&apos;ll bounce back here with your reservations.
        </li>
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        Nothing leaves your browser except the redirect URL — your bookings live in localStorage
        only.
      </p>
    </div>
  );
}
