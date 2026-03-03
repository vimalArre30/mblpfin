import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export const metadata = {
  title: "Dashboard — MrBottomLine Tracker",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Belt-and-suspenders check (middleware is the primary guard)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  // Fetch this user's categories so we can show a count
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", user.id);

  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-playfair text-lg font-semibold text-white tracking-tight">
            Mr. Bottom Line
          </span>
          <span className="text-white/25 text-sm">/</span>
          <span className="text-white/60 text-sm">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/35 hidden sm:block">
            {user.email ?? user.phone ?? "Your account"}
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* Body */}
      <main className="max-w-content mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="font-playfair text-3xl font-bold text-white">
            Your Tracker
          </h1>
          <p className="mt-2 text-white/45 text-base">
            Session active for{" "}
            <span className="text-white/70">
              {user.email ?? user.phone ?? "your account"}
            </span>
          </p>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <StatusCard
            label="Auth"
            value="Active"
            detail="Session via Supabase"
            ok
          />
          <StatusCard
            label="Categories"
            value={String(categories?.length ?? 0)}
            detail="Seeded on sign-up"
            ok={(categories?.length ?? 0) > 0}
          />
          <StatusCard
            label="UI"
            value="Coming Day 3"
            detail="Transaction entry + wallet list"
            ok={false}
            pending
          />
        </div>

        {/* Coming soon placeholder */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">🏗️</div>
          <h2 className="font-playfair text-xl font-semibold text-white mb-2">
            Dashboard shell is live
          </h2>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Authentication, RLS, and seeding are all wired up. Transaction UI
            and wallet management start next.
          </p>
        </div>
      </main>
    </div>
  );
}

function StatusCard({
  label,
  value,
  detail,
  ok,
  pending,
}: {
  label: string;
  value: string;
  detail: string;
  ok: boolean;
  pending?: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`w-2 h-2 rounded-full ${
            pending
              ? "bg-yellow-400/60"
              : ok
              ? "bg-green-400"
              : "bg-red-400/60"
          }`}
        />
      </div>
      <p className="text-white font-semibold text-lg">{value}</p>
      <p className="text-white/35 text-xs mt-0.5">{detail}</p>
    </div>
  );
}
