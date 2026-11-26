import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, isProActive } from "@/lib/tracker/plan";
import SettingsClient from "./SettingsClient";
import ProfileSection from "./ProfileSection";
import ExportSection from "@/components/tracker/ExportSection";

export const metadata = {
  title: "Settings — MBL PFin",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  const [profile, { data: categories }, { data: labels }, { data: wallets }] = await Promise.all([
    getUserPlan(supabase, user.id),
    supabase
      .from("categories")
      .select("id, name, icon, type, user_id")
      .order("name", { ascending: true }),
    supabase
      .from("labels")
      .select("id, name, color, user_id")
      .order("name", { ascending: true }),
    supabase
      .from("wallets")
      .select("id, name, emoji")
      .order("created_at", { ascending: true }),
  ]);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-7">
        <h1 className="font-playfair text-2xl font-bold text-white">
          Settings
        </h1>
        <p className="mt-1 text-white/40 text-sm">
          Manage your profile, categories, and labels.
        </p>
      </div>

      <ProfileSection
        initialName={profile?.name ?? ""}
        initialUsername={profile?.username ?? ""}
      />

      <ExportSection
        isPro={!!profile && isProActive(profile)}
        wallets={wallets ?? []}
      />

      <SettingsClient
        initialCategories={categories ?? []}
        initialLabels={labels ?? []}
        userId={user.id}
      />
    </main>
  );
}
