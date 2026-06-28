import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/tracker/plan";
import SettingsClient from "./SettingsClient";
import ProfileSection from "./ProfileSection";

export const metadata = {
  title: "Settings — MBL PFin",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  const [profile, { data: categories }, { data: labels }] = await Promise.all([
    getUserPlan(supabase, user.id),
    supabase
      .from("categories")
      .select("id, name, icon, type, user_id")
      .order("name", { ascending: true }),
    supabase
      .from("labels")
      .select("id, name, color, user_id")
      .order("name", { ascending: true }),
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

      <SettingsClient
        initialCategories={categories ?? []}
        initialLabels={labels ?? []}
        userId={user.id}
      />
    </main>
  );
}
