"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/auth/AuthProvider";

/**
 * Right-side auth element for the global Navbar.
 *
 * Two states:
 *   - Signed out: a "Sign in" text link that routes to /tracker/login.
 *     We don't render this when there's no user *and* there's no auth-aware
 *     surface to send them to. Keeping it as a low-key text link (not a
 *     button) avoids competing with the primary "Watch on YouTube" CTA the
 *     Navbar already shows for marketing visitors.
 *   - Signed in: avatar (initials) + first name + chevron, opening a dropdown
 *     with Dashboard / Pro / Settings / Sign out.
 *
 * Click-outside is handled with a `mousedown` listener on document so the
 * dropdown closes when the user taps elsewhere.
 */
export default function UserMenu() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Signed out ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <Link
        href="/tracker/login"
        className="font-inter text-sm font-medium text-body hover:text-navy transition-colors"
      >
        Sign in
      </Link>
    );
  }

  // ── Signed in ───────────────────────────────────────────────────────────
  const name = (user.user_metadata?.name as string | undefined) ?? "Account";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const firstName = name.split(" ")[0];
  const subtitle = user.email ?? user.phone ?? "";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-surface-gray transition-colors"
        aria-label="Open user menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full bg-navy text-white text-xs font-semibold"
          aria-hidden
        >
          {initials || "A"}
        </span>
        <span className="hidden sm:inline font-inter text-sm font-medium text-ink">
          {firstName}
        </span>
        <svg
          className={`hidden sm:block w-3.5 h-3.5 text-body transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-border py-2 z-50"
        >
          {/* Identity header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="font-inter text-sm font-semibold text-ink truncate">
              {name}
            </p>
            {subtitle && (
              <p className="font-inter text-xs text-body/75 truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Menu items */}
          <Link
            href="/tracker/dashboard"
            className="block px-4 py-2 font-inter text-sm text-body hover:bg-surface-gray hover:text-navy transition-colors"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Tracker dashboard
          </Link>
          <Link
            href="/pro"
            className="block px-4 py-2 font-inter text-sm text-body hover:bg-surface-gray hover:text-navy transition-colors"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Pro subscription
          </Link>
          <Link
            href="/tracker/settings"
            className="block px-4 py-2 font-inter text-sm text-body hover:bg-surface-gray hover:text-navy transition-colors"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            Settings
          </Link>

          <div className="my-1 border-t border-border" />

          <button
            type="button"
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 font-inter text-sm text-body hover:bg-surface-gray hover:text-navy transition-colors"
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
