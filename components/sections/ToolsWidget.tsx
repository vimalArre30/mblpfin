import Link from "next/link";

const tools = [
  {
    emoji: "🔥",
    name: "FIRE Calculator",
    description: "Find your Financial Independence number with India-specific assumptions — 6% inflation, 3.5% SWR, real ₹ values.",
    href: "/tools/fire-calculator",
    live: true,
    tag: "Live",
  },
  {
    emoji: "🪙",
    name: "Gold Investment Calculator",
    description: "Calculate returns on Sovereign Gold Bonds, digital gold, and physical gold over any time horizon.",
    href: null,
    live: false,
    tag: "Coming Soon",
  },
  {
    emoji: "📈",
    name: "SWP Calculator",
    description: "Plan your Systematic Withdrawal Plan — how long will your corpus last at your chosen withdrawal rate?",
    href: null,
    live: false,
    tag: "Coming Soon",
  },
  {
    emoji: "🏢",
    name: "Gratuity Calculator",
    description: "Calculate your gratuity entitlement based on years of service and last drawn salary under the Payment of Gratuity Act.",
    href: null,
    live: false,
    tag: "Coming Soon",
  },
  {
    emoji: "🏠",
    name: "Home Loan Repayment Calculator",
    description: "Break down your EMI, total interest paid, and amortisation schedule for any home loan amount and tenure.",
    href: null,
    live: false,
    tag: "Coming Soon",
  },
];

export default function ToolsWidget() {
  return (
    <section id="tools" className="bg-white py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="font-inter text-xs font-semibold uppercase tracking-[0.18em] text-navy/50 mb-3">
              Financial Tools
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight">
              Tools that do the math.
            </h2>
            <p className="font-inter text-body text-[16px] leading-relaxed mt-3 max-w-xl">
              Free calculators built for Indian personal finance — real rupee values, India-specific assumptions, no sign-up required.
            </p>
          </div>
          <Link
            href="/tools/fire-calculator"
            className="shrink-0 font-inter text-sm font-semibold text-navy hover:text-navy-dark transition-colors"
          >
            Try the FIRE Calculator →
          </Link>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) =>
            tool.live ? (
              /* Live tool — full clickable card */
              <Link
                key={tool.name}
                href={tool.href!}
                className="group relative bg-navy rounded-2xl p-7 flex flex-col min-h-[200px] hover:bg-navy-dark transition-colors duration-200"
              >
                {/* Live badge */}
                <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 bg-emerald-400/15 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>

                <div className="text-3xl mb-4">{tool.emoji}</div>
                <h3 className="font-playfair text-xl font-bold text-white mb-2">
                  {tool.name}
                </h3>
                <p className="font-inter text-blue-200/80 text-[14px] leading-relaxed flex-1">
                  {tool.description}
                </p>
                <span className="mt-5 font-inter text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                  Open Calculator →
                </span>
              </Link>
            ) : (
              /* Coming soon — muted non-clickable card */
              <div
                key={tool.name}
                className="relative bg-surface-gray rounded-2xl p-7 flex flex-col min-h-[200px] opacity-75"
              >
                {/* Coming soon badge */}
                <span className="absolute top-5 right-5 inline-flex items-center bg-border text-body/50 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Coming Soon
                </span>

                <div className="text-3xl mb-4 grayscale">{tool.emoji}</div>
                <h3 className="font-playfair text-xl font-bold text-ink/60 mb-2">
                  {tool.name}
                </h3>
                <p className="font-inter text-body/50 text-[14px] leading-relaxed flex-1">
                  {tool.description}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
