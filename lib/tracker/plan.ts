import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_ENTRY_LIMIT = 250;

export type UserProfile = {
  plan: string;
  plan_expires_at: string | null;
  entry_count: number;
};

export async function getUserPlan(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data } = await supabase
    .from("user_profiles")
    .select("plan, plan_expires_at, entry_count")
    .eq("user_id", userId)
    .single();
  return (data as UserProfile) ?? null;
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
