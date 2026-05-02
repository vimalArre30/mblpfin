"use client";

import Link from "next/link";
import { FREE_ENTRY_LIMIT } from "@/lib/tracker/plan";

/**
 * Soft trigger before the hard 250-entry gate.
 * Only renders for free users (parent decides via `plan === 'free' && !isProActive`).
 */
export default function EntryCountPill({ entryCount }: { entryCount: number }) {
  const remaining = FREE_ENTRY_LIMIT - entryCount;

  let tone: "neutral" | "warn" | "alert" = "neutral";
  if (entryCount >= 240) tone = "alert";
  else if (entryCount >= 200) tone = "warn";

  if (tone === "neutral" && entryCount < 200) {
    // Render a quiet usage pill with no upgrade nudge yet
    return (
      <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/45">
        {entryCount} / {FREE_ENTRY_LIMIT} entries
      </div>
    );
  }

  const styles = {
    warn:
      "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15",
    alert: "bg-red-500/10 border-red-500/35 text-red-300 hover:bg-red-500/15",
    neutral: "",
  };

  const label =
    tone === "alert"
      ? `Only ${remaining} ${remaining === 1 ? "entry" : "entries"} left`
      : `${entryCount} / ${FREE_ENTRY_LIMIT} entries used`;

  return (
    <Link
      href="/pro"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition ${styles[tone]}`}
    >
      {label}
      <span className="opacity-70">· Upgrade →</span>
    </Link>
  );
}
