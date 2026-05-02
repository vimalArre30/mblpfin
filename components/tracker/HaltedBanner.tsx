"use client";

import Link from "next/link";

/**
 * Persistent red banner shown when subscription_status === 'halted'.
 * Renders only when explicitly mounted by parent — no internal state.
 */
export default function HaltedBanner() {
  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 flex items-start gap-3">
      <span className="text-lg shrink-0 leading-none mt-0.5">🔴</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-200">
          Your last payment failed.
        </p>
        <p className="text-xs text-red-200/75 mt-0.5">
          Update your payment method to keep Pro access. Your subscription will
          reactivate automatically once payment succeeds.
        </p>
        <Link
          href="/pro"
          className="inline-block mt-1.5 text-xs font-semibold text-red-200 hover:text-white transition"
        >
          Update payment method →
        </Link>
      </div>
    </div>
  );
}
