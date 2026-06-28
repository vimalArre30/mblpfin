"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LINKS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/auth/AuthProvider";

/**
 * Unified Global Navbar — single shell across marketing + tracker.
 *
 * Marketing:  MBL PFin | Blog · Pricing · mrbottomline.club ↗ | Log in
 * Tracker:    MBL PFin | Dashboard · Transactions · Wallets · Analytics · Settings | [avatar ▾]
 */

const TRACKER_NAV = [
  { href: "/tracker/dashboard",     label: "Dashboard" },
  { href: "/tracker/transactions",  label: "Transactions" },
  { href: "/tracker/wallets",       label: "Wallets" },
  { href: "/tracker/analytics",     label: "Analytics" },
  { href: "/tracker/settings",      label: "Settings" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const router   = useRouter();
  const { user } = useUser();
  const avatarRef = useRef<HTMLDivElement>(null);

  // Onboarding is a walled-garden step — treat it like a non-tracker route
  // so no Dashboard/Transactions/etc links appear and users can't escape.
  const isOnboarding = pathname === "/tracker/onboarding";
  const isTracker = pathname.startsWith("/tracker") && !isOnboarding;

  // Close avatar dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAvatarOpen(false);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  // Avatar initial — phone number or email first char
  const avatarInitial = user
    ? (user.phone ?? user.email ?? "U").replace(/^\+\d+/, "").charAt(0).toUpperCase() || "U"
    : "U";

  return (
    <header className="sticky top-0 z-50 bg-[#0A1628] border-b border-white/[0.08]">
      <nav className="max-w-content mx-auto px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        {/* Logo — always links home */}
        <Link
          href="/"
          className="font-playfair text-base font-bold text-white tracking-tight hover:text-white/75 transition-colors flex-shrink-0"
        >
          MBL PFin
        </Link>

        {/* ── Desktop center links ── */}
        {isTracker ? (
          <ul className="hidden lg:flex items-center h-14 overflow-x-auto">
            {TRACKER_NAV.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`relative flex items-center h-14 px-3 font-inter text-sm font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "text-white after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-white"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/pro"
                className={`relative flex items-center h-14 px-3 font-inter text-sm font-semibold whitespace-nowrap transition-colors ${
                  pathname === "/pro"
                    ? "text-amber-300 after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-amber-400"
                    : "text-amber-400/80 hover:text-amber-300"
                }`}
              >
                ★ Pro
              </Link>
            </li>
          </ul>
        ) : (
          <ul className="hidden lg:flex items-center gap-6">
            <li>
              <Link
                href="/writing"
                className={`font-inter text-sm transition-colors ${
                  pathname.startsWith("/writing") ? "text-white" : "text-white/50 hover:text-white"
                }`}
              >
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="/pro"
                className={`font-inter text-sm transition-colors ${
                  pathname === "/pro" ? "text-white" : "text-white/50 hover:text-white"
                }`}
              >
                Pricing
              </Link>
            </li>
            <li>
              <a
                href={LINKS.mrbottomlineClub}
                target="_blank"
                rel="noopener noreferrer"
                className="font-inter text-sm text-white/50 hover:text-white transition-colors"
              >
                mrbottomline.club ↗
              </a>
            </li>
          </ul>
        )}

        {/* ── Desktop right ── */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {isOnboarding ? null : isTracker && user ? (
            /* Avatar dropdown */
            <div ref={avatarRef} className="relative">
              <button
                onClick={() => setAvatarOpen((v) => !v)}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/15 transition-colors"
                aria-label="Account menu"
              >
                <span className="font-inter text-xs font-semibold text-white">
                  {avatarInitial}
                </span>
              </button>

              {avatarOpen && (
                <div className="absolute right-0 top-11 w-52 bg-[#0F1E40] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.07]">
                    <p className="font-inter text-[11px] text-white/40 truncate">
                      {user.email ?? user.phone ?? "Your account"}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 font-inter text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : user ? (
            <Link
              href="/tracker/dashboard"
              className="font-inter text-sm font-semibold bg-white text-[#0A1628] px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
            >
              Open tracker →
            </Link>
          ) : (
            <Link
              href="/tracker/login"
              className="font-inter text-sm font-semibold bg-white text-[#0A1628] px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
            >
              Log in
            </Link>
          )}
        </div>

        {/* Mobile hamburger — hidden on onboarding (no nav destinations available) */}
        <button
          className={`lg:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-white/10 transition-colors ml-auto ${isOnboarding ? "invisible" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#0A1628]">
          <div className="max-w-content mx-auto px-6 py-4 flex flex-col gap-1">
            {isTracker ? (
              <>
                {TRACKER_NAV.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`font-inter text-sm py-2.5 transition-colors ${
                      pathname === href ? "text-white font-medium" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href="/pro"
                  onClick={() => setMenuOpen(false)}
                  className="font-inter text-sm font-semibold text-amber-400 py-2.5"
                >
                  ★ Pro
                </Link>
                <div className="pt-3 mt-2 border-t border-white/[0.08] flex flex-col gap-2">
                  <p className="font-inter text-[11px] text-white/30 truncate">
                    {user?.email ?? user?.phone ?? ""}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="text-left font-inter text-sm text-white/50 hover:text-white transition-colors py-1"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/writing" onClick={() => setMenuOpen(false)} className="font-inter text-sm text-white/60 hover:text-white transition-colors py-2.5">Blog</Link>
                <Link href="/pro"     onClick={() => setMenuOpen(false)} className="font-inter text-sm text-white/60 hover:text-white transition-colors py-2.5">Pricing</Link>
                <a href={LINKS.mrbottomlineClub} target="_blank" rel="noopener noreferrer" className="font-inter text-sm text-white/60 hover:text-white transition-colors py-2.5">
                  mrbottomline.club ↗
                </a>
                <div className="pt-3 mt-2 border-t border-white/[0.08]">
                  {user ? (
                    <Link href="/tracker/dashboard" onClick={() => setMenuOpen(false)} className="font-inter text-sm font-semibold bg-white text-[#0A1628] px-4 py-2 rounded-lg inline-block">
                      Open tracker →
                    </Link>
                  ) : (
                    <Link href="/tracker/login" onClick={() => setMenuOpen(false)} className="font-inter text-sm font-semibold bg-white text-[#0A1628] px-4 py-2 rounded-lg inline-block">
                      Log in
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
