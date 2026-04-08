import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/tracker/dashboard/SignOutButton";
import TrackerNav from "@/components/tracker/TrackerNav";
import { getUserPlan, isProActive } from "@/lib/tracker/plan";

export default async function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login page — no chrome
  if (!user) {
    return <div className="overflow-x-hidden">{children}</div>;
  }

  const profile = await getUserPlan(supabase, user.id);
  const showUpgradeLink = !profile || !isProActive(profile);

  return (
    <div className="min-h-screen bg-navy-dark font-inter overflow-x-hidden">
      <div className="sticky top-0 z-50 bg-[#0F1E40]">
        <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-playfair text-lg font-semibold text-white tracking-tight">
              Mr. Bottom Line
            </span>
            <span className="text-white/25 text-sm">/</span>
            <span className="text-white/60 text-sm">Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            {showUpgradeLink && (
              <Link
                href="/pricing"
                className="hidden sm:inline-flex items-center text-xs font-medium text-amber-400 border border-amber-500/40 hover:border-amber-400/70 hover:bg-amber-500/10 rounded-full px-3 py-1 transition"
              >
                Upgrade
              </Link>
            )}
            <span className="text-xs text-white/35 hidden sm:block">
              {user.email ?? user.phone ?? "Your account"}
            </span>
            <SignOutButton />
          </div>
        </header>
        <TrackerNav />
      </div>
      {children}
    </div>
  );
}
