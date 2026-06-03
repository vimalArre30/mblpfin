import type { Metadata } from "next";
import { BRAND } from "@/lib/constants";
import { breadcrumbSchema, schemaToJson } from "@/lib/seo/schema";
import FireCalculator from "./FireCalculator";

const TITLE = "FIRE Calculator India — Financial Independence Retire Early Number (2026)";
const DESCRIPTION =
  "Calculate your Financial Independence number with India-specific assumptions: 6% inflation, 3.5% safe withdrawal rate, and real ₹ values. Free FIRE calculator for Indian investors.";
const CANONICAL = `${BRAND.url}/tools/fire-calculator`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL(BRAND.url),
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const breadcrumbs = breadcrumbSchema([
  { name: "Home", url: BRAND.url },
  { name: "Tools", url: `${BRAND.url}/tools` },
  { name: "FIRE Calculator", url: CANONICAL },
]);

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "FIRE Calculator India",
  description: DESCRIPTION,
  url: CANONICAL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
  },
};

export default function FIRECalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: schemaToJson(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <FireCalculator />
    </>
  );
}
