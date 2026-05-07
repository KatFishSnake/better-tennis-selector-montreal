import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Booking tennis courts in Montreal",
  description:
    "Answers to the most common questions about booking public tennis courts in Montreal: when reservations open, free vs paid courts, indoor options, residency, and how Tennis MTL fits in.",
  alternates: { canonical: "https://tennismtl.com/faq" },
};

const QA: { q: string; a: string }[] = [
  {
    q: "Why does this site exist?",
    a: "Because loisirs.montreal.ca is slow, breaks often, and is genuinely painful to use. When you call 311 to make a reservation, the operator just sends you back to the same broken site. Tennis MTL is a thin, fast layer on top of the City's public data so booking takes seconds instead of minutes — built by a frustrated player after watching their partner give up on the City's UX one too many times.",
  },
  {
    q: "When does the Montreal tennis booking window open?",
    a: "Bookings on loisirs.montreal.ca open exactly 2 days in advance. Slots become reservable 48 hours before play time and fill quickly during peak evening hours (roughly 5–9 PM in summer).",
  },
  {
    q: "Are there free tennis courts in Montreal?",
    a: "Yes. Most outdoor public courts have free slots — typically late at night, often after 10 PM. Daytime and prime-time slots are paid, with prices varying by borough (usually $5–12 per hour). Indoor facilities such as Stade IGA are paid year-round.",
  },
  {
    q: "Which Montreal parks have the most tennis courts?",
    a: "Parc La Fontaine, Parc Jeanne-Mance, and Stade IGA have the largest concentration of bookable courts. La Fontaine and Jeanne-Mance are outdoor public courts; Stade IGA has both indoor and outdoor options.",
  },
  {
    q: "Where can I play tennis indoors in Montreal?",
    a: "Stade IGA (in Parc Jarry) is the main public indoor option bookable through loisirs.montreal.ca. Filter by Tennis (indoor) on Tennis MTL or directly on the City's site to see availability.",
  },
  {
    q: "Do I need a Loisirs Montréal account to book?",
    a: "Yes. All bookings are processed on loisirs.montreal.ca and require a free Loisirs Montréal account. Sign in once on the City's site, then any slot click on Tennis MTL takes you straight to checkout.",
  },
  {
    q: "Do I need to be a Montreal resident to book a court?",
    a: "No — non-residents can book public courts on loisirs.montreal.ca, though some pricing tiers and discounts are reserved for Montreal residents with a valid Accès Montréal card.",
  },
  {
    q: "How does Tennis MTL differ from loisirs.montreal.ca?",
    a: "Tennis MTL queries the same public data the City's site uses, then renders it in a single fast page filtered by day, sport, park, and time of day. Tennis MTL never processes payments — every booking is completed on loisirs.montreal.ca.",
  },
  {
    q: "Does Tennis MTL store any personal data?",
    a: "No data is stored on the server. The only personal information recorded is your 'usual times' (e.g. Friday 7 PM), which lives entirely in your browser's localStorage and is used to surface those slots first.",
  },
  {
    q: "Why does a search sometimes take 30–60 seconds?",
    a: "Tennis MTL forwards your search to the City's reservation API, which can be slow. The site doesn't cache availability so every result reflects the latest state on loisirs.montreal.ca.",
  },
  {
    q: "How do I cancel a booking?",
    a: "Cancellations are handled entirely on loisirs.montreal.ca through your Loisirs Montréal account. Tennis MTL has no booking history of its own.",
  },
];

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: QA.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-16 w-full">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
        FAQ
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] mb-3">
        Booking tennis in Montreal — questions and answers
      </h1>
      <p className="text-sm text-muted-foreground mb-10 max-w-xl leading-relaxed">
        Everything you need to know about reserving a public tennis court in Montreal through
        loisirs.montreal.ca.
      </p>

      <div className="space-y-6 text-sm">
        {QA.map(({ q, a }) => (
          <div key={q}>
            <h2 className="font-semibold text-foreground mb-1.5 text-base">{q}</h2>
            <p className="text-muted-foreground leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      <aside className="mt-12 rounded-xl border border-border bg-muted/40 p-5 text-sm">
        <h2 className="font-semibold text-foreground mb-2">
          Do you know who builds loisirs.montreal.ca?
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          If you work at the City of Montreal or know someone on the team behind loisirs.montreal.ca
          / IC3, please put them in touch. With official API access this site could be much better —
          proper auth, real-time availability, server-side reservations, push notifications when a
          favourite slot opens up. Right now Tennis MTL is reverse-engineered against the public
          endpoints; that&apos;s fragile and slow. Happy to collaborate on a better experience for
          every Montrealer who plays.
        </p>
        <p className="mt-3">
          <a
            href="mailto:hello@heyandre.so?subject=Tennis%20MTL%20%C2%B7%20Loisirs%20Montr%C3%A9al"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            hello@heyandre.so
          </a>
          <span className="text-muted-foreground"> · </span>
          <a
            href="https://heyandre.so"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
          >
            heyandre.so
          </a>
        </p>
      </aside>

      <p className="mt-12 text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline hover:text-foreground">
          ← Back to court search
        </Link>
        {" · "}
        <Link href="/courts" className="underline-offset-4 hover:underline hover:text-foreground">
          Montreal courts directory →
        </Link>
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />
    </main>
  );
}
