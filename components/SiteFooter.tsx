"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/sections/Footer";

/**
 * Conditional wrapper around the global Footer.
 *
 * The Footer is part of the marketing chrome (brand description, social
 * links, copyright). It belongs at the bottom of "content" pages — homepage,
 * /writing, /writing/[slug], /pro, /pricing, /privacy, /delete-account.
 *
 * Inside the tracker app (`/tracker/*`) the user is mid-task on a logged-in
 * surface. A marketing footer there is jarring and steals scroll real estate
 * from app content. So we hide it.
 */
export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/tracker")) return null;
  return <Footer />;
}
