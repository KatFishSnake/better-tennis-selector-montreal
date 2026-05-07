import { NextRequest, NextResponse } from "next/server";
import {
  IC3_BASE,
  IC3_HEADERS,
  type SearchPayload,
  type SearchResponse,
} from "@/lib/ic3";

export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as Partial<SearchPayload>;

  const body: SearchPayload = {
    limit: payload.limit ?? 100,
    offset: payload.offset ?? 0,
    sortColumn: payload.sortColumn ?? "facility.name",
    isSortOrderAsc: payload.isSortOrderAsc ?? true,
    facilityTypeIds: payload.facilityTypeIds ?? null,
    boroughIds: payload.boroughIds ?? null,
    siteId: payload.siteId ?? null,
    dates: payload.dates ?? [],
    startTime: payload.startTime ?? null,
    endTime: payload.endTime ?? null,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 80_000);

  try {
    const res = await fetch(`${IC3_BASE}/api/U6510/public/search/`, {
      method: "POST",
      headers: { ...IC3_HEADERS, "content-type": "application/json;charset=UTF-8" },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `IC3 returned ${res.status}`, details: text.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = (await res.json()) as SearchResponse;
    return NextResponse.json(data);
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error ? err.message : "Unknown error";
    const aborted = msg.includes("aborted") || msg.includes("AbortError");
    return NextResponse.json(
      {
        error: aborted
          ? "IC3 took too long to respond. The site is probably overloaded — try again."
          : msg,
      },
      { status: aborted ? 504 : 500 },
    );
  }
}
