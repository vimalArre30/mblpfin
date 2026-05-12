import type { Metadata } from "next";
import Script from "next/script";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/constants";
import {
  organizationSchema,
  personSchema,
  schemaToJson,
} from "@/lib/seo/schema";

// Google Analytics 4 measurement ID — set NEXT_PUBLIC_GA_ID in Vercel + .env.local.
// Falsy means GA is disabled (e.g. local dev without the env var set).
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

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

      </head>
      <body>
        {/* Google Analytics 4 — gtag.js.
            Loads only when NEXT_PUBLIC_GA_ID is set (production + preview).
            next/script with strategy="afterInteractive" ensures it doesn't
            block initial render. Same GA4 property powers the Flutter app
            via Firebase Analytics — one dashboard, web + Android. */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true });
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
