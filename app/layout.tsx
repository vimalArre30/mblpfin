import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/constants";

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
        url: "/images/og-image.png",
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
    images: ["/images/og-image.png"],
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
      </head>
      <body>{children}</body>
    </html>
  );
}
