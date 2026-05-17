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
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Navbar from "@/components/sections/Navbar";
import SiteFooter from "@/components/SiteFooter";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the Supabase session server-side from cookies. We pass the resulting
  // user (or null) into AuthProvider as initialUser, so the Navbar and any
  // other client component can call useUser() and get the correct identity
  // on the very first paint — no client-side flicker between "anonymous" and
  // "signed in". The provider then subscribes to onAuthStateChange to stay
  // in sync with future sign-ins / sign-outs / token refreshes.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

        {/* Global app shell:
            - AuthProvider exposes useUser() to every client component below.
            - Navbar is sticky and present on every route (marketing + tracker).
            - SiteFooter renders the marketing Footer on content pages and
              hides itself inside /tracker/* (logged-in product chrome).
            Individual pages should no longer render their own Navbar/Footer. */}
        <AuthProvider initialUser={user}>
          <Navbar />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
