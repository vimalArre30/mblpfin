"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LINKS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/auth/AuthProvider";

/**
 * Global Navbar — rendered by root layout on every route.
 *
 * Dark navy theme matching mblpfin.com brand.
 * Hidden on /tracker/* routes (tracker has its own chrome).
 *
 * States:
 *   - Signed out: Blog | Pricing | mrbottomline.club ↗ | Log in
 *   - Signed in:  Blog | Pricing | mrbottomline.club ↗ | Open tracker
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const { user } = useUser();

  // Hide entirely inside the tracker app — it has its own chrome
  if (pathname.startsWith("/tracker")) return null;

  return (
    <header className="sticky top-0 z-50 bg-[#0A1628] border-b border-white/[0.08]">
      <nav className="max-w-content mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">

        {/* Wordmark */}
        <Link
          href="/"
          className="font-playfair text-base font-bold text-white tracking-tight hover:text-white/80 transition-colors"
        >
          MBL PFin
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden lg:flex items-center gap-6">
          <li>
            <Link
              href="/blog"
              className={`font-inter text-sm transition-colors ${
                pathname.startsWith("/blog") ? "text-white" : "text-white/50 hover:text-white"
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

        {/* Desktop right CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
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

        {/* Mobile hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-white/10 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-white/[0.08] bg-[#0A1628]">
          <div className="max-w-content mx-auto px-6 py-4 flex flex-col gap-4">
            <Link
              href="/blog"
              onClick={() => setOpen(false)}
              className="font-inter text-sm text-white/60 hover:text-white transition-colors py-1"
            >
              Blog
            </Link>
            <Link
              href="/pro"
              onClick={() => setOpen(false)}
              className="font-inter text-sm text-white/60 hover:text-white transition-colors py-1"
            >
              Pricing
            </Link>
            <a
              href={LINKS.mrbottomlineClub}
              target="_blank"
              rel="noopener noreferrer"
              className="font-inter text-sm text-white/60 hover:text-white transition-colors py-1"
            >
              mrbottomline.club ↗
            </a>
            <div className="pt-3 mt-1 border-t border-white/[0.08]">
              {user ? (
                <MobileSignOut onSignedOut={() => setOpen(false)} />
              ) : (
                <Link
                  href="/tracker/login"
                  onClick={() => setOpen(false)}
                  className="font-inter text-sm font-semibold bg-white text-[#0A1628] px-4 py-2 rounded-lg inline-block"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileSignOut({ onSignedOut }: { onSignedOut: () => void }) {
  const router = useRouter();

  const handle = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    onSignedOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/tracker/dashboard"
        className="font-inter text-sm text-white/60 hover:text-white transition-colors py-1"
      >
        Open tracker
      </Link>
      <button
        type="button"
        onClick={handle}
        className="text-left font-inter text-sm text-white/40 hover:text-white/60 transition-colors py-1"
      >
        Sign out
      </button>
    </div>
  );
}
