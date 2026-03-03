import { redirect } from "next/navigation";

// /tracker → permanent redirect to /tracker/dashboard
// Middleware handles the auth check before this runs.
export default function TrackerIndex() {
  redirect("/tracker/dashboard");
}
