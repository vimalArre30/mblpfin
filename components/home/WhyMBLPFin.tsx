export default function WhyMBLPFin() {
  const reasons = [
    {
      tag: "Not just tracking",
      title: "A personal finance OS",
      body: "MBL PFin starts with logging, but the roadmap is bigger — budgets, goals, net worth, investment tracking. The foundation you build today powers every financial decision tomorrow.",
    },
    {
      tag: "Community + platform",
      title: "Built alongside you",
      body: "Features are co-built with the people who use them. Community members vote on what gets built next. Your wishlist shapes the product roadmap directly.",
    },
    {
      tag: "High-trust network",
      title: "People who run their life",
      body: "The MBL PFin community isn't about hacks and tips. It's for high-agency individuals who take their finances seriously — and who hold each other to that standard.",
    },
  ];

  return (
    <section className="bg-[#0A1628] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <p className="font-inter text-xs text-white/45 tracking-[0.15em] uppercase mb-3">
          Why MBL PFin
        </p>
        <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-white mb-10">
          More than an expense tracker.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="border border-white/[0.08] rounded-xl p-6 flex flex-col gap-3"
            >
              <span className="inline-block self-start font-inter text-[10px] text-white/45 bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-full tracking-wide uppercase">
                {r.tag}
              </span>
              <h3 className="font-playfair text-lg font-semibold text-white leading-snug">
                {r.title}
              </h3>
              <p className="font-inter text-sm text-white/65 leading-relaxed">
                {r.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
