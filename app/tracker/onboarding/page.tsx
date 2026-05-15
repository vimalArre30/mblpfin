import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, isOnboarded } from "@/lib/tracker/plan";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Welcome — MBL PFin",
  description: "Set up your profile to start tracking expenses.",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  // If already onboarded, send them straight to the dashboard.
  const profile = await getUserPlan(supabase, user.id);
  if (isOnboarded(profile)) {
    redirect("/tracker/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0F1E40] font-inter text-white flex items-center justify-center px-4">
      <OnboardingClient
        userPhone={user.phone ?? user.email ?? ""}
        initialName={profile?.name ?? ""}
        initialUsername={profile?.username ?? ""}
      />
    </div>
  );
}
