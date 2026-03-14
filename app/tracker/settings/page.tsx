import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  );
}
