import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_ENTRY_LIMIT = 250;

export type SubscriptionStatus = "none" | "active" | "cancelling" | "halted" | "expired";

export type UserProfile = {
  plan: string;
  plan_expires_at: string | null;
  entry_count: number;
  subscription_id?: string | null;
  cancel_requested_at?: string | null;
  discount_applied?: boolean | null;
  subscription_status?: SubscriptionStatus | null;
  // Onboarding identity (migration 005). NULL → user has not completed
  // onboarding yet; show /tracker/onboarding before /tracker/dashboard.
  name?: string | null;
  username?: string | null;
};

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select(
      "plan, plan_expires_at, entry_count, subscription_id, cancel_requested_at, discount_applied, subscription_status, name, username"
    )
    .eq("user_id", userId)
    .single();
  return (data as UserProfile) ?? null;
}

/** True if onboarding v1 is complete (name + username present + non-empty). */
export function isOnboarded(profile: UserProfile | null): boolean {
  if (!profile) return false;
  const hasName = !!profile.name && profile.name.trim().length > 0;
  const hasUsername =
    !!profile.username && profile.username.trim().length > 0;
  return hasName && hasUsername;
}

export function isProActive(profile: UserProfile): boolean {
  if (profile.plan !== "pro") return false;
  if (!profile.plan_expires_at) return true;
  return new Date(profile.plan_expires_at) > new Date();
}

export function isAtFreeLimit(profile: UserProfile): boolean {
  return !isProActive(profile) && profile.entry_count >= FREE_ENTRY_LIMIT;
}

export async function incrementEntryCount(
  supabase: SupabaseClient,
  userId: string,
  currentCount: number
): Promise<void> {
  await supabase
    .from("user_profiles")
    .update({
      entry_count: currentCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

/**
 * Derived UI state for the Pro page / Profile screen.
 * Computed on the server from a UserProfile row.
 */
export function deriveProState(
  profile: UserProfile | null
): "free" | "pro" | "cancelling" | "halted" {
  if (!profile) return "free";
  if (profile.subscription_status === "halted") return "halted";
  if (!isProActive(profile)) return "free";
  if (profile.cancel_requested_at) return "cancelling";
  return "pro";
}
