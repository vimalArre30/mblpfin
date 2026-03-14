import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TransactionsClient from "./TransactionsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transactions — MrBottomLine Tracker",
};

export default async function TransactionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  const [{ data: wallets }, { data: transactions }] = await Promise.all([
    supabase.from("wallets").select("*").order("created_at"),
    supabase
      .from("transactions")
      .select("*, categories(name), wallet:wallets!transactions_wallet_id_fkey(name, emoji, color), transaction_labels(label_id, labels(name))")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <TransactionsClient
      initialTransactions={transactions ?? []}
      wallets={wallets ?? []}
    />
  );
}
