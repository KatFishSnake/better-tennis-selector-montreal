const SITE_URL = "https://tennismtl.com";

const BODY = `# Tennis MTL

> Tennis MTL is an independent, free tool that finds open tennis and pickleball courts across the City of Montreal by querying the public loisirs.montreal.ca reservation system in real time. One click on any slot opens the City's site filtered to that exact time and court.

## What it does

- Searches outdoor tennis, indoor tennis, and pickleball availability at every Montreal site that publishes courts on loisirs.montreal.ca.
- Filters by day (today through 2 days out — the City's booking horizon), park, and time of day.
- Deep-links each slot directly to the City's checkout, so no copy-pasting times or court numbers.
- Stores no user data on the server. Personal "usual times" preferences are kept only in the user's browser.

## Quick facts about Montreal public tennis

- Bookings open 2 days in advance on loisirs.montreal.ca.
- Outdoor courts are often free after 10 PM. Daytime and prime-time slots are paid.
- Largest court counts on loisirs.montreal.ca: Parc La Fontaine (14 outdoor), Parc Jeanne-Mance, Complexe sportif Claude-Robillard (4 indoor + 10 outdoor).
- Stade IGA / IGA Stadium (Parc Jarry) is operated by Tennis Canada and is NOT bookable through loisirs.montreal.ca.
- A free Loisirs Montréal account is required to confirm any booking.

## Key pages

- [Homepage — search open courts](${SITE_URL}/): live availability search and FAQ.
- [Montreal courts directory](${SITE_URL}/courts): every site available on loisirs.montreal.ca, by name.
- [FAQ](${SITE_URL}/faq): booking window, pricing, residency, indoor vs outdoor.
- [About](${SITE_URL}/about): who built Tennis MTL and why.

## Source

Open source at https://github.com/KatFishSnake/tennismtl.com.
Built by André (https://heyandre.so). Not affiliated with the City of Montreal.
`;

export const dynamic = "force-static";

export function GET() {
  return new Response(BODY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
