import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://fer-tennis-booking.vercel.app";
const TITLE = "Better Tennis Booking · Montreal";
const DESCRIPTION =
  "Find open tennis courts in Montreal faster than loisirs.montreal.ca. Search by day, park, and time — one click jumps you straight to the City booking page.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Better Tennis Booking Montreal",
  },
  description: DESCRIPTION,
  applicationName: "Better Tennis Montreal",
  authors: [{ name: "André", url: "https://heyandre.so" }],
  creator: "André",
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
    alternateLocale: "fr_CA",
    siteName: "Better Tennis Booking · Montreal",
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

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: TITLE,
  description: DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "SportsApplication",
  operatingSystem: "Any",
  inLanguage: ["en", "fr"],
  about: {
    "@type": "SportsActivityLocation",
    name: "Tennis courts in Montreal",
    address: { "@type": "PostalAddress", addressLocality: "Montreal", addressRegion: "QC", addressCountry: "CA" },
  },
  offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
      </body>
    </html>
  );
}
