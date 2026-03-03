"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/tracker/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-white/50 hover:text-white border border-white/15 hover:border-white/30 rounded-lg px-4 py-2 transition"
    >
      Sign out
    </button>
  );
}
