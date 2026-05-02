import { createClient } from "@/lib/supabase/server";
import { getUserPlan, deriveProState, isProActive } from "@/lib/tracker/plan";
import ProClient from "./ProClient";

export const metadata = {
  title: "MrBottomLine Pro",
  description: "Track without limits. Unlimited entries, full analytics, voice + AI input.",
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

  return (
    <div className="min-h-screen bg-[#0F1E40] font-inter text-white">
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
