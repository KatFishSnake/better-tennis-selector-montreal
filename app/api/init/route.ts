import { NextResponse } from "next/server";
import { IC3_BASE, IC3_HEADERS, type InitResponse } from "@/lib/ic3";

export const revalidate = 3600;

export async function GET() {
  const res = await fetch(`${IC3_BASE}/api/U6510/public/search/init/`, {
    headers: IC3_HEADERS,
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `IC3 returned ${res.status}` }, { status: 502 });
  }

  const data = (await res.json()) as InitResponse;
  return NextResponse.json(data.result, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
