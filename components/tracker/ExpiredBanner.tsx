"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "expired_banner_dismissed_at";
const DISMISS_DAYS = 7;

/**
 * One-time-per-week banner shown when a previously-Pro user has lapsed to Free.
 * Dismiss persists for 7 days via localStorage.
 */
export default function ExpiredBanner({
  planExpiresAt,
}: {
  planExpiresAt: string | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!planExpiresAt) return;
    const dismissedAt = window.localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const ageDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (ageDays < DISMISS_DAYS) return;
    }
    setVisible(true);
  }, [planExpiresAt]);

  if (!visible || !planExpiresAt) return null;

  const expiredOn = new Date(planExpiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 flex items-start gap-3">
      <span className="text-lg shrink-0 leading-none mt-0.5">👋</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          Welcome back! Your Pro subscription ended on {expiredOn}.
        </p>
        <Link
          href="/pro"
          className="inline-block mt-1 text-xs font-semibold text-amber-300 hover:text-amber-200 transition"
        >
          Renew Pro →
        </Link>
      </div>
      <button
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
          setVisible(false);
        }}
        aria-label="Dismiss"
        className="text-white/40 hover:text-white/70 text-sm shrink-0 -mr-1"
      >
        ✕
      </button>
    </div>
  );
}
