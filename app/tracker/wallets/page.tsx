import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WalletsClient from "./WalletsClient";

export const metadata = {
  title: "Wallets — MrBottomLine Tracker",
};

export default async function WalletsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  const { data: wallets } = await supabase
    .from("wallets")
    .select("*")
    .order("created_at");

  return (
    <WalletsClient
      initialWallets={wallets ?? []}
    />
  );
}
