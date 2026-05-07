import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://tennismtl.com";
const BRAND = "Tennis MTL";
const TITLE = "Tennis MTL — Find Open Tennis Courts in Montreal";
const DESCRIPTION =
  "Find open tennis courts in Montreal faster than loisirs.montreal.ca. Search by day, park, and time — one click jumps you straight to the City booking page.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Tennis MTL",
  },
  description: DESCRIPTION,
  applicationName: BRAND,
  appleWebApp: {
    capable: true,
    title: BRAND,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  authors: [{ name: "André", url: "https://heyandre.so" }],
  creator: "André",
  publisher: BRAND,
  keywords: [
    "tennis Montreal",
    "tennis courts Montreal",
    "book tennis Montreal",
    "Montreal tennis reservation",
    "loisirs Montreal tennis",
    "Parc La Fontaine tennis",
    "Jeanne-Mance tennis",
    "réservation tennis Montréal",
    "terrain de tennis Montréal",
    "pickleball Montreal",
    "outdoor tennis Montreal",
    "free tennis courts Montreal",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: BRAND,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

const ORG_ID = `${SITE_URL}/#org`;
const PERSON_ID = `${SITE_URL}/#creator`;
const WEBAPP_ID = `${SITE_URL}/#webapp`;

const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: BRAND,
  url: SITE_URL,
  logo: `${SITE_URL}/icon1`,
  description:
    "Independent tool that finds open tennis courts in Montreal by querying the City's public reservation system.",
  founder: { "@id": PERSON_ID },
  sameAs: ["https://github.com/KatFishSnake/tennismtl.com", "https://heyandre.so"],
};

const PERSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: "André",
  url: "https://heyandre.so",
  jobTitle: "Software Engineer",
  knowsAbout: [
    "Tennis",
    "Montreal public sports facilities",
    "loisirs.montreal.ca booking",
    "Web development",
  ],
  sameAs: ["https://heyandre.so", "https://github.com/KatFishSnake"],
};

const WEBAPP_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "@id": WEBAPP_ID,
  name: BRAND,
  alternateName: "Better Tennis Booking · Montreal",
  description: DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "SportsApplication",
  operatingSystem: "Any",
  inLanguage: ["en", "fr"],
  publisher: { "@id": ORG_ID },
  creator: { "@id": PERSON_ID },
  about: {
    "@type": "SportsActivityLocation",
    name: "Tennis courts in Montreal",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Montreal",
      addressRegion: "QC",
      addressCountry: "CA",
    },
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "CAD",
    availability: "https://schema.org/InStock",
  },
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["#how-it-works", "#faq"],
  },
  mainEntity: [
    {
      "@type": "Question",
      name: "How does Tennis MTL work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Tennis MTL queries the City of Montreal's public reservation system (loisirs.montreal.ca) directly and shows only what matters: which time slots are open, at which park, and at what price. Booking happens on the City's site — sign in once and every slot click jumps you straight to checkout.",
      },
    },
    {
      "@type": "Question",
      name: "When does the Montreal tennis booking window open?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Bookings on loisirs.montreal.ca open 2 days in advance. Slots become reservable 48 hours before play time and fill quickly during peak evening hours.",
      },
    },
    {
      "@type": "Question",
      name: "Are there free tennis courts in Montreal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Outdoor public courts are often free for late-night slots — typically after 10 PM. Daytime and prime-time slots are paid, with prices varying by borough. Indoor courts (e.g. Stade IGA) are paid year-round.",
      },
    },
    {
      "@type": "Question",
      name: "Which Montreal parks have the most tennis courts?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Parc La Fontaine, Parc Jeanne-Mance, and Stade IGA have the largest concentration of bookable courts. La Fontaine and Jeanne-Mance are outdoor public courts; Stade IGA has both indoor and outdoor options.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need a Loisirs Montréal account to book?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All bookings are processed on loisirs.montreal.ca and require a free Loisirs Montréal account. Sign in once on the City's site, then clicking any slot in Tennis MTL takes you straight to checkout.",
      },
    },
  ],
};

const STRUCTURED_DATA = [ORG_LD, PERSON_LD, WEBAPP_LD, FAQ_LD];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${figtree.variable} h-full antialiased font-sans`}>
      <body className="min-h-full flex flex-col bg-background text-foreground [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]">
        {children}
        {STRUCTURED_DATA.map((node) => (
          <script
            key={node["@type"]}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
          />
        ))}
      </body>
    </html>
  );
}
