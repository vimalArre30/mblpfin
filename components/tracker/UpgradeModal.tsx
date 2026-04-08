"use client";

export default function UpgradeModal({ open }: { open: boolean }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop — intentionally not clickable to dismiss */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Bottom sheet on mobile, centred card on desktop */}
      <div className="relative w-full sm:w-[480px] bg-[#0F1E40] border border-white/12 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Drag handle — visual only, no dismiss */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-6 pt-4 sm:pt-8 pb-8">
          {/* Heading */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🚀</div>
            <h2 className="font-playfair text-xl font-bold text-white mb-1.5">
              You&apos;ve used all 250 free entries
            </h2>
            <p className="text-sm text-white/50">Upgrade to keep tracking</p>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Monthly */}
            <div className="bg-white/5 border border-white/12 rounded-xl p-4">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                Monthly
              </p>
              <p className="text-2xl font-bold text-white leading-none">₹199</p>
              <p className="text-xs text-white/40 mt-1">/month</p>
            </div>

            {/* Annual — highlighted */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap tracking-wide">
                BEST VALUE
              </span>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">
                Annual
              </p>
              <p className="text-2xl font-bold text-white leading-none">₹899</p>
              <p className="text-xs text-white/40 mt-1">₹75/month</p>
            </div>
          </div>

          {/* Feature list */}
          <ul className="space-y-2.5 mb-7">
            {[
              "Unlimited entries",
              "Voice + AI input",
              "Full analytics",
              "Multi-wallet",
              "Export (coming soon)",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-sm text-white/70">
                <span className="text-amber-400 font-bold shrink-0">✓</span>
                {feat}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={() => {
              window.location.href = "/pricing";
            }}
            className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold text-sm rounded-xl py-3 transition"
          >
            Upgrade Now →
          </button>

          <p className="mt-3 text-center text-xs text-white/30 leading-relaxed">
            Your 250 existing entries are safe. You can always view them.
          </p>
        </div>
      </div>
    </div>
  );
}
