import type { Metadata } from "next";
import Link from "next/link";
import { IC3_BASE, IC3_HEADERS, type InitResponse, type Site } from "@/lib/ic3";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Montreal tennis courts directory",
  description:
    "Every Montreal park and facility that publishes tennis or pickleball courts on loisirs.montreal.ca, with a deep link to live availability for each one.",
  alternates: { canonical: "https://tennismtl.com/courts" },
};

const FALLBACK_SITES: Site[] = [
  { id: 1734, name: "Parc La Fontaine" },
  { id: 1, name: "Parc Jeanne-Mance" },
  { id: 2, name: "Stade IGA — Parc Jarry" },
];

const VENUE_NOTES: Record<string, string> = {
  "Parc La Fontaine":
    "One of the largest outdoor concentrations in Montreal. Mostly hard courts; lit for evening play.",
  "Parc Jeanne-Mance":
    "Outdoor courts at the foot of Mont-Royal. Heavy use during summer evenings — book early.",
  "Stade IGA":
    "Home of the National Bank Open. Indoor and outdoor courts; the only major bookable indoor public option in the city.",
  "Parc Jarry": "Adjacent to Stade IGA. Outdoor courts with light evening traffic.",
  "Parc Sir-Wilfrid-Laurier": "Plateau-Mont-Royal outdoor courts; popular with locals.",
};

function noteFor(name: string): string | null {
  const key = Object.keys(VENUE_NOTES).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  return key ? (VENUE_NOTES[key] ?? null) : null;
}

async function loadSites(): Promise<Site[]> {
  try {
    const res = await fetch(`${IC3_BASE}/api/U6510/public/search/init/`, {
      headers: IC3_HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return FALLBACK_SITES;
    const data = (await res.json()) as InitResponse;
    return data.result.sites;
  } catch {
    return FALLBACK_SITES;
  }
}

export default async function CourtsPage() {
  const rawSites = await loadSites();
  const sites = [...rawSites].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-16 w-full">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
        Directory
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] mb-3">
        Montreal tennis courts on loisirs.montreal.ca
      </h1>
      <p className="text-sm text-muted-foreground mb-10 max-w-xl leading-relaxed">
        Every park and facility that publishes bookable tennis or pickleball courts through the City
        of Montreal&apos;s public reservation system. The list is pulled directly from the
        City&apos;s API and refreshed daily. Click any venue to jump to live availability.
      </p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Venue</th>
              <th className="text-left font-medium px-4 py-3 hidden sm:table-cell">Notes</th>
              <th className="text-right font-medium px-4 py-3">Availability</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site, i) => {
              const note = noteFor(site.name);
              return (
                <tr key={site.id} className={i > 0 ? "border-t border-border" : ""}>
                  <td className="px-4 py-3 align-top">
                    <span className="font-medium text-foreground">{site.name}</span>
                  </td>
                  <td className="px-4 py-3 align-top hidden sm:table-cell text-muted-foreground">
                    {note ?? "—"}
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <Link
                      href={`/?siteId=${site.id}`}
                      className="text-foreground underline-offset-4 hover:underline whitespace-nowrap"
                    >
                      Check slots →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        {sites.length} venue{sites.length === 1 ? "" : "s"}. List sourced from{" "}
        <a
          href="https://loisirs.montreal.ca/IC3/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          loisirs.montreal.ca
        </a>{" "}
        and refreshed every 24 hours.
      </p>

      <p className="mt-12 text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline hover:text-foreground">
          ← Back to court search
        </Link>
        {" · "}
        <Link href="/faq" className="underline-offset-4 hover:underline hover:text-foreground">
          FAQ →
        </Link>
      </p>
    </main>
  );
}
