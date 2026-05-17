"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { type AnchorHTMLAttributes, type ReactNode } from "react";

type SmartLinkProps = Omit<LinkProps, "href"> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    href: string;
    children?: ReactNode;
  };

/**
 * Drop-in replacement for `next/link` that fixes cross-page hash-anchor
 * navigation.
 *
 * The problem this solves:
 *   The Navbar and Footer use bare hash hrefs like "#pursuits", "#community",
 *   "#about" — these are sections of the homepage. They scroll correctly when
 *   the user is already on "/", but on "/writing", "/writing/[slug]", "/pro",
 *   etc., clicking them appends the hash to the current path (e.g.
 *   "/writing#pursuits") which has no matching anchor and silently fails.
 *
 * The fix:
 *   When the current pathname is NOT "/", any bare hash href ("#pursuits") is
 *   rewritten to a homepage-anchored href ("/#pursuits"). Next.js then routes
 *   home AND scrolls to the section.
 *
 *   When the user IS on "/", the hash is passed through unchanged so the
 *   browser's native in-page scroll fires (a Next.js Link navigation to the
 *   same route would be a no-op).
 *
 * Non-hash hrefs (absolute URLs, routes, mailto:, etc.) are passed through
 * untouched. Safe to use as a Link replacement everywhere in the app shell.
 */
export default function SmartLink({ href, ...rest }: SmartLinkProps) {
  const pathname = usePathname();
  const isHashOnly = typeof href === "string" && href.startsWith("#");
  const finalHref = isHashOnly && pathname !== "/" ? `/${href}` : href;

  return <Link href={finalHref} {...rest} />;
}
