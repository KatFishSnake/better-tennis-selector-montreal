"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseUrlSafePayload, saveBookings } from "@/lib/bookings";

type State =
  | { kind: "loading" }
  | { kind: "ok"; count: number }
  | { kind: "empty" }
  | { kind: "authExpired"; detail: string | null }
  | { kind: "fetchError"; detail: string | null }
  | { kind: "error"; message: string };

function readHashParam(hash: string, name: string): string | null {
  const re = new RegExp(`[#&]${name}=([^&]+)`);
  const m = hash.match(re);
  return m?.[1] ?? null;
}

export default function MePage() {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const hash = window.location.hash || "";

    const err = readHashParam(hash, "err");
    if (err === "auth") {
      const msgRaw = readHashParam(hash, "msg");
      let detail: string | null = null;
      try {
        detail = msgRaw ? decodeURIComponent(msgRaw) : null;
      } catch {
        detail = null;
      }
      history.replaceState(null, "", "/me");
      setState({ kind: "authExpired", detail });
      return;
    }
    if (err === "fetch") {
      const msgRaw = readHashParam(hash, "msg");
      let detail: string | null = null;
      try {
        detail = msgRaw ? decodeURIComponent(msgRaw) : null;
      } catch {
        detail = null;
      }
      history.replaceState(null, "", "/me");
      setState({ kind: "fetchError", detail });
      return;
    }

    const b64 = readHashParam(hash, "b");
    if (!b64) {
      setState({
        kind: "error",
        message: "No booking data in the URL. Run the bookmarklet from loisirs.montreal.ca.",
      });
      return;
    }
    const payload = parseUrlSafePayload(b64);
    if (!payload) {
      setState({
        kind: "error",
        message: "Could not read booking data. Try the bookmarklet again.",
      });
      return;
    }
    saveBookings(payload);
    if (payload.items.length === 0) {
      setState({ kind: "empty" });
    } else {
      setState({ kind: "ok", count: payload.items.length });
    }
    history.replaceState(null, "", "/me");

    const t = setTimeout(() => {
      window.location.href = "/";
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="mx-auto max-w-md px-4 py-16 w-full">
      <Card className="shadow-none">
        <CardContent className="p-8 text-center">
          {state.kind === "loading" && (
            <p className="text-sm text-muted-foreground">Reading your bookings…</p>
          )}

          {state.kind === "ok" && (
            <>
              <p className="text-2xl font-extrabold tracking-tight mb-1">
                Got {state.count} booking{state.count === 1 ? "" : "s"}
              </p>
              <p className="text-sm text-muted-foreground">Taking you back to Tennis MTL…</p>
            </>
          )}

          {state.kind === "empty" && (
            <>
              <p className="text-lg font-semibold mb-1">No upcoming reservations</p>
              <p className="text-sm text-muted-foreground">
                Nothing on file under your Loisirs Montréal account.
              </p>
              <Link href="/" className="inline-block mt-4">
                <Button variant="outline" size="sm">
                  Back to court search
                </Button>
              </Link>
            </>
          )}

          {state.kind === "authExpired" && (
            <>
              <p className="text-lg font-semibold mb-2">Loisirs didn&apos;t recognize you</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sign in to loisirs.montreal.ca, then{" "}
                <strong>navigate to the home page or your profile</strong> before clicking the
                bookmarklet — the IC3 site sometimes only activates the session after you visit a
                logged-in page.
              </p>
              {state.detail && (
                <pre className="mt-3 text-[10px] text-muted-foreground font-mono whitespace-pre-wrap break-all text-left bg-muted/40 rounded p-2">
                  {state.detail}
                </pre>
              )}
              <div className="mt-5 flex flex-col gap-2">
                <a
                  href="https://loisirs.montreal.ca/IC3/"
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "default", size: "default" })}
                >
                  Sign in to Loisirs Montréal →
                </a>
                <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Back to court search
                </Link>
              </div>
            </>
          )}

          {state.kind === "fetchError" && (
            <>
              <p className="text-lg font-semibold mb-2">Couldn&apos;t reach loisirs.montreal.ca</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The City&apos;s site didn&apos;t respond. This usually means a brief outage or a
                blocked request — try the bookmarklet again in a minute.
              </p>
              {state.detail && (
                <p className="mt-3 text-xs text-muted-foreground font-mono">{state.detail}</p>
              )}
              <div className="mt-5 flex flex-col gap-2">
                <a
                  href="https://loisirs.montreal.ca/IC3/"
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Open loisirs.montreal.ca
                </a>
                <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Back to court search
                </Link>
              </div>
            </>
          )}

          {state.kind === "error" && (
            <>
              <p className="text-base font-semibold text-destructive mb-2">{state.message}</p>
              <Link href="/" className="inline-block mt-2">
                <Button variant="outline" size="sm">
                  Back home
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
