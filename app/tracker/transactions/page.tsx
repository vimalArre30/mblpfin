import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransactionsClient from "./TransactionsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transactions — MBL PFin",
};

export default async function TransactionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  // The list itself is fetched (50 at a time) by the client from
  // /api/tracker/transactions once the period is known.
  const { data: wallets } = await supabase.from("wallets").select("*").order("created_at");

  return <TransactionsClient wallets={wallets ?? []} />;
}
