import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

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
      {children}
    </div>
  );
}
