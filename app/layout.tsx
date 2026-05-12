import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/constants";
import {
  organizationSchema,
  personSchema,
  schemaToJson,
} from "@/lib/seo/schema";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mr. Bottom Line — Product Builder. Systems Thinker. Capital Allocator.",
  description:
    "Vimal is a product builder turned capital allocator. Chief of Product at ARRÊ Voice. Building Serene Windsor, Mr. Bottom Line on YouTube, and backing high-agency founders.",
  metadataBase: new URL(BRAND.url),
  alternates: {
    canonical: BRAND.url,
    types: {
      "application/rss+xml": `${BRAND.url}/feed.xml`,
    },
  },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
  openGraph: {
    title: "Mr. Bottom Line — Product Builder. Systems Thinker. Capital Allocator.",
    description:
      "Vimal is a product builder turned capital allocator. Chief of Product at ARRÊ Voice. Building Serene Windsor, Mr. Bottom Line on YouTube, and backing high-agency founders.",
    url: BRAND.url,
    siteName: BRAND.name,
    type: "website",
    images: [
      {
        url: "https://www.mrbottomline.club/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mr. Bottom Line",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mr. Bottom Line — Product Builder. Systems Thinker. Capital Allocator.",
    description:
      "Vimal is a product builder turned capital allocator. Chief of Product at ARRÊ Voice. Building Serene Windsor, Mr. Bottom Line on YouTube, and backing high-agency founders.",
    images: ["https://www.mrbottomline.club/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        {/* Note: per-page canonicals are injected automatically by Next.js
            via metadata.alternates.canonical on each page. Do NOT add a
            site-wide <link rel="canonical"> here — it would override every
            page's canonical with the homepage URL. */}

        {/* Site-wide structured data: Organization + Person (Vimal).
            Article / WebApplication / FAQ schemas are injected per-page. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: schemaToJson(organizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: schemaToJson(personSchema()),
          }}
        />

        {/* Plausible Analytics — privacy-friendly visitor counter.
            Uses the default plausible.io hosted script. The data-domain
            attribute MUST match the domain you registered in your Plausible
            dashboard. The "outbound-links" extension tracks clicks on
            external links (useful for measuring CTA performance).
            Docs: https://plausible.io/docs/plausible-script */}
        <script
          defer
          data-domain="mrbottomline.club"
          src="https://plausible.io/js/script.outbound-links.js"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
