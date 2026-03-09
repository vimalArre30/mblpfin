import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/tracker/dashboard/SignOutButton";
import TrackerNav from "@/components/tracker/TrackerNav";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings — MrBottomLine Tracker",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  const [{ data: categories }, { data: labels }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, icon, user_id")
      .order("name", { ascending: true }),
    supabase
      .from("labels")
      .select("id, name, color, user_id")
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-playfair text-lg font-semibold text-white tracking-tight">
            Mr. Bottom Line
          </span>
          <span className="text-white/25 text-sm">/</span>
          <span className="text-white/60 text-sm">Tracker</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/35 hidden sm:block">
            {user.email ?? user.phone ?? "Your account"}
          </span>
          <SignOutButton />
        </div>
      </header>

      <TrackerNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h1 className="font-playfair text-2xl font-bold text-white">
            Settings
          </h1>
          <p className="mt-1 text-white/40 text-sm">
            Manage your categories and labels.
          </p>
        </div>

        <SettingsClient
          initialCategories={categories ?? []}
          initialLabels={labels ?? []}
          userId={user.id}
        />
      </main>
    </div>
  );
}
