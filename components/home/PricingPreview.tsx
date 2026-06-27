import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["250 entries / month", "Voice logging", "Basic analytics", "1 wallet"],
    cta: "Get started",
    ctaHref: "/tracker/login",
    highlight: false,
  },
  {
    name: "Pro Monthly",
    price: "₹199",
    period: "per month",
    features: ["Unlimited entries", "Multi-wallet", "Full analytics", "Priority support"],
    cta: "Start free trial",
    ctaHref: "/pro",
    highlight: true,
  },
  {
    name: "Pro Annual",
    price: "₹899",
    period: "per year",
    features: ["Everything in Pro", "2 months free", "Early access to features", "Community access"],
    cta: "Best value",
    ctaHref: "/pro",
    highlight: false,
  },
];

export default function PricingPreview() {
  return (
    <section className="bg-[#0D1B38] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-inter text-xs text-white/30 tracking-[0.15em] uppercase mb-3">
              Pricing
            </p>
            <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-white">
              Simple, honest pricing.
            </h2>
          </div>
          <Link
            href="/pro"
            className="hidden sm:block font-inter text-sm text-white/40 hover:text-white transition-colors"
          >
            See full pricing →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-6 border flex flex-col gap-4 ${
                plan.highlight
                  ? "bg-white/[0.07] border-white/20"
                  : "bg-white/[0.03] border-white/[0.07]"
              }`}
            >
              <div>
                <p className="font-inter text-xs text-white/35 mb-2 tracking-wide">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-playfair text-3xl font-bold text-white">{plan.price}</span>
                  <span className="font-inter text-xs text-white/35">{plan.period}</span>
                </div>
              </div>

              <ul className="flex flex-col gap-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-white/30 text-xs">✓</span>
                    <span className="font-inter text-xs text-white/45">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`mt-auto text-center font-inter text-sm font-medium py-2.5 rounded-lg transition-colors ${
                  plan.highlight
                    ? "bg-white text-[#0A1628] hover:bg-white/90"
                    : "border border-white/15 text-white/60 hover:text-white hover:border-white/30"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <Link
          href="/pro"
          className="sm:hidden mt-6 block font-inter text-sm text-white/40 hover:text-white transition-colors"
        >
          See full pricing →
        </Link>
      </div>
    </section>
  );
}
