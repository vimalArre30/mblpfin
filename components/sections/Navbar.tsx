"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BRAND, NAV_LINKS, LINKS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import SmartLink from "@/components/SmartLink";
import UserMenu from "@/components/auth/UserMenu";
import { useUser } from "@/components/auth/AuthProvider";

/**
 * Global Navbar — rendered by the root layout, present on every route.
 *
 * Two right-side states:
 *   - Signed out: "Sign in" text link (via UserMenu) + "Watch on YouTube"
 *     primary CTA. Marketing visitors get the YouTube discovery push; tracker
 *     visitors get an obvious way in.
 *   - Signed in: UserMenu only (avatar + name + dropdown). The YouTube CTA is
 *     hidden once you're a member — the surface shifts from discovery to
 *     account state, and the dropdown handles tracker / pro / settings / sign
 *     out.
 *
 * Active link state highlights the section/route the user is currently on.
 * For route-based links (/writing, /tracker) we match the pathname; for hash
 * anchors (#about, #pursuits, etc.) we leave it inactive because scroll-spy
 * for those would require an IntersectionObserver — out of scope for this
 * pass, can be added later if useful.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const { user } = useUser();

  // A link is "active" when its href matches the current pathname prefix.
  // Hash anchors (#foo) never match — they're not routes, just scroll targets.
  const isActive = (href: string) => {
    if (href.startsWith("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-content mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link
          href="/"
          className="font-playfair text-xl font-bold text-ink tracking-tight hover:text-navy transition-colors"
        >
          {BRAND.name}
        </Link>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.label}>
                <SmartLink
                  href={link.href}
                  className={`font-inter text-sm transition-colors font-medium ${
                    active
                      ? "text-navy"
                      : "text-body hover:text-navy"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </SmartLink>
              </li>
            );
          })}
        </ul>

        {/* Desktop right cluster */}
        <div className="hidden lg:flex items-center gap-5">
          <UserMenu />
          {/* "Watch on YouTube" — discovery CTA for visitors only. Hidden once
              the user is signed in; the UserMenu becomes the dominant action. */}
          {!user && (
            <Button href={LINKS.youtube} variant="primary" external>
              Watch on YouTube
            </Button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-surface-gray transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span
            className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${
              open ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-ink transition-all duration-300 ${
              open ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border bg-white">
          <div className="max-w-content mx-auto px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <SmartLink
                  key={link.label}
                  href={link.href}
                  className={`font-inter text-base transition-colors font-medium py-1 ${
                    active ? "text-navy" : "text-body hover:text-navy"
                  }`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </SmartLink>
              );
            })}

            {/* Identity / sign-in block — pushed to the bottom of the mobile
                drawer so it visually anchors the menu. */}
            <div className="pt-3 mt-1 border-t border-border flex flex-col gap-3">
              {user ? (
                <MobileUserBlock onNavigate={() => setOpen(false)} />
              ) : (
                <>
                  <Link
                    href="/tracker/login"
                    onClick={() => setOpen(false)}
                    className="font-inter text-sm font-medium text-body hover:text-navy transition-colors py-1"
                  >
                    Sign in
                  </Link>
                  <Button
                    href={LINKS.youtube}
                    variant="primary"
                    external
                    className="w-full"
                  >
                    Watch on YouTube
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * Signed-in identity block for the mobile drawer.
 *
 * Mirrors the desktop UserMenu dropdown contents inline (no nested dropdown
 * on mobile — the drawer is already a menu). Keeps the Navbar component file
 * self-contained rather than building a separate MobileUserMenu component.
 */
function MobileUserBlock({ onNavigate }: { onNavigate: () => void }) {
  const { user } = useUser();
  if (!user) return null;

  const name = (user.user_metadata?.name as string | undefined) ?? "Account";
  const subtitle = user.email ?? user.phone ?? "";

  return (
    <>
      <div className="pb-1">
        <p className="font-inter text-sm font-semibold text-ink truncate">
          {name}
        </p>
        {subtitle && (
          <p className="font-inter text-xs text-body/75 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <Link
        href="/tracker/dashboard"
        onClick={onNavigate}
        className="font-inter text-sm text-body hover:text-navy transition-colors py-1"
      >
        Tracker dashboard
      </Link>
      <Link
        href="/pro"
        onClick={onNavigate}
        className="font-inter text-sm text-body hover:text-navy transition-colors py-1"
      >
        Pro subscription
      </Link>
      <Link
        href="/tracker/settings"
        onClick={onNavigate}
        className="font-inter text-sm text-body hover:text-navy transition-colors py-1"
      >
        Settings
      </Link>
      <MobileSignOut onSignedOut={onNavigate} />
    </>
  );
}

function MobileSignOut({ onSignedOut }: { onSignedOut: () => void }) {
  const router = useRouter();

  // Sign out, close the drawer, route home, and refresh so server components
  // re-read the now-empty session cookie (and the Navbar re-renders without
  // the user menu).
  const handle = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onSignedOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handle}
      className="text-left font-inter text-sm text-body hover:text-navy transition-colors py-1"
    >
      Sign out
    </button>
  );
}
