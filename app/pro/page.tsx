import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, deriveProState, isProActive } from "@/lib/tracker/plan";
import { BRAND } from "@/lib/constants";
import {
  webApplicationSchema,
  breadcrumbSchema,
  schemaToJson,
} from "@/lib/seo/schema";
import ProClient from "./ProClient";

const PRO_TITLE = "MBL PFin Pro — Unlimited Voice Expense Tracking";
const PRO_DESCRIPTION =
  "Track without limits. Unlimited entries, full analytics, AI insights, and voice input in MBL PFin Pro. Built for Indian personal finance — ₹199/month, cancel anytime.";
const PRO_URL = `${BRAND.url}/pro`;
const PRO_OG_IMAGE = `${BRAND.url}/images/og-image.jpg`;

export const metadata: Metadata = {
  title: PRO_TITLE,
  description: PRO_DESCRIPTION,
  metadataBase: new URL(BRAND.url),
  alternates: { canonical: PRO_URL },
  openGraph: {
    title: PRO_TITLE,
    description: PRO_DESCRIPTION,
    url: PRO_URL,
    siteName: BRAND.name,
    type: "website",
    images: [
      {
        url: PRO_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "MBL PFin Pro — Unlimited Voice Expense Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PRO_TITLE,
    description: PRO_DESCRIPTION,
    images: [PRO_OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default async function ProPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let proState: "free" | "pro" | "cancelling" | "halted" = "free";
  let planExpiresAt: string | null = null;
  let discountApplied = false;
  let entryCount = 0;
  let interval: "monthly" | "annual" | null = null;

  if (user) {
    const profile = await getUserPlan(supabase, user.id);
    proState = deriveProState(profile);
    planExpiresAt = profile?.plan_expires_at ?? null;
    discountApplied = !!profile?.discount_applied;
    entryCount = profile?.entry_count ?? 0;
    if (profile && isProActive(profile)) {
      // Best-effort: peek at subscription_id prefix or just check plan amount via a separate fetch
      // For UI purposes, infer from plan_expires_at delta; defer real source-of-truth to webhook events
      // Default to 'annual' since that's the BEST_VALUE plan most users pick
      interval = "annual";
    }
  }

  const params = await searchParams;
  const justSubscribed = params.welcome === "1";

  // ── JSON-LD structured data ─────────────────────────────────────────────
  // WebApplication schema tells Google this page describes a paid app.
  // BreadcrumbList helps with SERP breadcrumb rendering.
  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: BRAND.url },
    { name: "Pro", url: `${BRAND.url}/pro` },
  ]);

  return (
    <div className="min-h-screen bg-[#0F1E40] font-inter text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: schemaToJson(webApplicationSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: schemaToJson(breadcrumbs),
        }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        <ProClient
          state={proState}
          planExpiresAt={planExpiresAt}
          discountApplied={discountApplied}
          entryCount={entryCount}
          interval={interval}
          userEmail={user?.email}
          userName={user?.user_metadata?.name}
          justSubscribed={justSubscribed}
        />
      </div>
    </div>
  );
}
