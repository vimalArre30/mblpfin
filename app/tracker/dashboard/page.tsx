import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import type { MonthlyDataPoint } from "@/components/tracker/MonthlyChart";
import type { NeedWantData } from "@/components/tracker/NeedWantRatio";
import { getUserPlan, isProActive, isOnboarded } from "@/lib/tracker/plan";
import { getTotals } from "@/lib/tracker/totals";
import { monthLabel } from "@/lib/tracker/totals-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard — MBL PFin",
};

export default async function DashboardPage() {
  console.log("[Dashboard] rendering at", new Date().toISOString());
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  console.log("[Dashboard] user.id:", user.id);

  // Fetch profile for paywall pill + banners
  const profile = await getUserPlan(supabase, user.id);

  // Onboarding gate — if name + username not yet set, force the user
  // through /tracker/onboarding before showing the dashboard.
  if (!isOnboarded(profile)) {
    redirect("/tracker/onboarding");
  }

  const proActive = profile ? isProActive(profile) : false;
  const isHalted = profile?.subscription_status === "halted";
  // "Welcome back" expired banner: previously had Pro (plan_expires_at set) but it lapsed
  const showExpiredBanner =
    !!profile?.plan_expires_at &&
    new Date(profile.plan_expires_at) <= new Date() &&
    !proActive &&
    !isHalted;

  // Fetch wallets for AddEntryModal + transfer destination lookup
  const { data: wallets } = await supabase
    .from("wallets")
    .select("id, name, emoji, color, created_at")
    .order("created_at", { ascending: true });

  // All-time stat cards, the 6-month chart and Need/Want come from SQL
  // (migration 008). The browser never sums transactions; if the totals can't
  // be computed we fail loudly rather than render partial numbers.
  const totals = await getTotals(supabase, { include: ["labels", "monthly"], monthly: "last6" });

  const monthlyData: MonthlyDataPoint[] = (totals.monthly ?? [])
    .filter((m) => m.expense > 0)
    .map((m) => ({ month: monthLabel(m.month), total: m.expense }));

  const labelTotal = (n: string) => totals.labels?.find((l) => l.name === n)?.total ?? 0;
  const needWant: NeedWantData = { needTotal: labelTotal("Need"), wantTotal: labelTotal("Want") };
  const walletCount = wallets?.length ?? 0;

  return (
    <DashboardClient
      stats={{
        totalIncome: totals.income,
        totalExpense: totals.expense,
        netBalance: totals.net,
        walletCount,
      }}
      monthlyData={monthlyData}
      needWant={needWant}
      wallets={wallets ?? []}
      paywall={{
        entryCount: profile?.entry_count ?? 0,
        proActive,
        isHalted,
        showExpiredBanner,
        planExpiresAt: profile?.plan_expires_at ?? null,
      }}
    />
  );
}
