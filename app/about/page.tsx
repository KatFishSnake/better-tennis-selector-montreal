import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Tennis MTL is an independent tool that finds open tennis courts in Montreal by querying loisirs.montreal.ca live. Built by André.",
  alternates: { canonical: "https://tennismtl.com/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-16 w-full">
      <p className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground mb-3">
        About
      </p>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-display-sm mb-6">
        Tennis MTL
      </h1>

      <article className="prose prose-neutral text-sm leading-relaxed text-muted-foreground space-y-5 max-w-none">
        <p>
          Tennis MTL is an independent, open-source tool for finding open tennis and pickleball
          courts in Montreal. It queries the City&apos;s public reservation system
          (loisirs.montreal.ca) directly and surfaces only what matters: which time slots are open,
          at which park, and at what price.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-8 mb-2">Why this exists</h2>
        <p>
          The City&apos;s booking site works, but every search takes 30–60 seconds and the interface
          buries availability behind several layers of filters. As a regular Montreal tennis player,
          I found myself re-running the same searches every evening to find an open court for the
          next day. Tennis MTL is the version of that workflow I wished existed: one screen, two
          filters, every open slot at a glance, and a one-click jump straight to the City&apos;s
          checkout.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-8 mb-2">How it works</h2>
        <p>
          The site is a small Next.js application hosted on Vercel. When you search, it calls the
          same public API that loisirs.montreal.ca uses, groups the results by start time, and
          renders them. Clicking a slot opens the City&apos;s site filtered to that exact court and
          time — you complete the booking on loisirs.montreal.ca with your existing Loisirs Montréal
          account.
        </p>
        <p>
          Nothing about you is stored on the server. The only personal data ever recorded is your
          &quot;usual times&quot; (e.g. Friday 7 PM), which lives entirely in your browser&apos;s
          localStorage to bubble those slots to the top.
        </p>

        <h2 className="text-base font-semibold text-foreground mt-8 mb-2">Built by</h2>
        <p>
          André — software engineer in Montreal. More at{" "}
          <a
            href="https://heyandre.so"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            heyandre.so
          </a>
          . Source code at{" "}
          <a
            href="https://github.com/KatFishSnake/tennismtl.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            github.com/KatFishSnake/tennismtl.com
          </a>
          .
        </p>

        <h2 className="text-base font-semibold text-foreground mt-8 mb-2">
          Not affiliated with the City of Montreal
        </h2>
        <p>
          Tennis MTL is not affiliated with, endorsed by, or operated by the Ville de Montréal. All
          bookings are processed on{" "}
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
      </article>

      <p className="mt-12 text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline hover:text-foreground">
          ← Back to court search
        </Link>
      </p>
    </main>
  );
}
