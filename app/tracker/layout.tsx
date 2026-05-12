import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/app/tracker/dashboard/SignOutButton";
import TrackerNav from "@/components/tracker/TrackerNav";

// Private app routes — keep out of search indexes (belt + braces with robots.txt).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
