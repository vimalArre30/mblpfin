export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Analytics — MBL PFin",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  const { data: wallets } = await supabase
    .from("wallets")
    .select("id, name, emoji, color, created_at");

  return <AnalyticsClient wallets={wallets ?? []} />;
}
