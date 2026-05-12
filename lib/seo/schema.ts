// =============================================================================
// SEO SCHEMA HELPERS — JSON-LD generators for Schema.org structured data
// =============================================================================
//
// Each function returns a plain object ready to be embedded in a page via
// <script type="application/ld+json"> { JSON.stringify(...) } </script>.
//
// Validate any output with https://search.google.com/test/rich-results before
// deploying changes.
//
// Spec refs:
// - Article: https://schema.org/Article
// - BreadcrumbList: https://schema.org/BreadcrumbList
// - FAQPage: https://schema.org/FAQPage
// - WebApplication: https://schema.org/WebApplication
// - Organization: https://schema.org/Organization
// - Person: https://schema.org/Person
// =============================================================================

import { BRAND } from "@/lib/constants";

// -------------------------------------------------------------------- types ---

export interface ArticleSchemaInput {
  title: string;
  description: string;
  datePublished: string; // ISO date
  dateModified?: string; // ISO date
  slug: string; // e.g. "the-long-game"
  coverImage?: string; // absolute or path-relative URL
  authorName?: string; // defaults to "Vimal"
}

export interface FAQItem {
  question: string;
  answer: string; // plain text or simple HTML — Google parses both
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

// ------------------------------------------------------ shared sub-schemas ---

const PERSON_VIMAL = {
  "@type": "Person",
  name: "Vimal",
  url: BRAND.url,
  sameAs: [
    "https://www.linkedin.com/in/rvimalkumar/",
    "https://www.youtube.com/@mrbottomline",
    "https://mrbottomline.substack.com",
  ],
};

const ORGANIZATION_MBL = {
  "@type": "Organization",
  name: BRAND.name,
  url: BRAND.url,
  logo: `${BRAND.url}/favicon.svg`,
};

// ---------------------------------------------------------------- helpers ---

/**
 * Returns Person schema for Vimal. Used in root layout via `personSchema()`.
 */
export function personSchema() {
  return {
    "@context": "https://schema.org",
    ...PERSON_VIMAL,
    jobTitle: "Product Builder, Capital Allocator",
    description: BRAND.description,
  };
}

/**
 * Returns Organization schema for MrBottomLine. Used in root layout.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    ...ORGANIZATION_MBL,
    description: BRAND.description,
  };
}

/**
 * Returns WebApplication schema for MBL PFin (the expense tracker product).
 * Use on `/`, `/pro`, and the tracker landing. This tells Google the site
 * is a web app — eligible for app-install rich cards and SoftwareApplication
 * SERP enhancements.
 */
export function webApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MBL PFin",
    alternateName: "MrBottomLine Tracker",
    url: `${BRAND.url}/tracker`,
    description:
      "Voice-powered expense tracker for India. Log expenses by speaking, get AI insights, manage budgets across wallets — free for 250 entries.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web, Android",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "INR",
        description: "Up to 250 entries with full feature access",
      },
      {
        "@type": "Offer",
        name: "Pro Monthly",
        price: "199",
        priceCurrency: "INR",
        description: "Unlimited entries, voice + AI insights",
        url: `${BRAND.url}/pro`,
      },
      {
        "@type": "Offer",
        name: "Pro Annual",
        price: "1499",
        priceCurrency: "INR",
        description: "Unlimited entries + 37% annual savings",
        url: `${BRAND.url}/pro`,
      },
    ],
    publisher: ORGANIZATION_MBL,
    author: PERSON_VIMAL,
  };
}

/**
 * Returns Article schema for a single blog post.
 * Used on /writing/[slug].
 */
export function articleSchema(input: ArticleSchemaInput) {
  const {
    title,
    description,
    datePublished,
    dateModified,
    slug,
    coverImage,
    authorName = "Vimal",
  } = input;

  const url = `${BRAND.url}/writing/${slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished,
    ...(dateModified && { dateModified }),
    url,
    mainEntityOfPage: url,
    author: {
      "@type": "Person",
      name: authorName,
      url: BRAND.url,
    },
    publisher: ORGANIZATION_MBL,
    ...(coverImage && {
      image: coverImage.startsWith("http") ? coverImage : `${BRAND.url}${coverImage}`,
    }),
  };
}

/**
 * Returns BreadcrumbList schema. Pass crumbs from root to leaf.
 *
 * Example:
 *   breadcrumbSchema([
 *     { name: "Home", url: BRAND.url },
 *     { name: "Writing", url: `${BRAND.url}/writing` },
 *     { name: post.title, url: `${BRAND.url}/writing/${post.slug}` },
 *   ])
 */
export function breadcrumbSchema(crumbs: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * Returns FAQPage schema for articles or doc pages with a Q&A section.
 * Enables rich FAQ accordions in Google SERPs.
 */
export function faqSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

// ------------------------------------------------------ embedding helper ---

/**
 * Serialises a schema object to a string ready for dangerouslySetInnerHTML.
 * Escapes < to prevent breaking out of the <script> tag.
 */
export function schemaToJson(schema: object): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
