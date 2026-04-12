import { redirect } from "next/navigation";

// /tracker → redirect to /tracker/dashboard, forwarding the upgraded query param
// if present so the dashboard can show the post-payment success banner.
export default async function TrackerIndex({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const params = await searchParams;
  if (params.upgraded === "true") {
    redirect("/tracker/dashboard?upgraded=true");
  }
  redirect("/tracker/dashboard");
}
