export default function Features() {
  const features = [
    {
      icon: "👛",
      title: "Multi-wallet tracking",
      description:
        "HDFC, SBI, UPI, cash — track every wallet in one place. See where money is sitting and where it's moving.",
    },
    {
      icon: "📊",
      title: "Spending analytics",
      description:
        "Category breakdowns, monthly trends, and spending patterns. The data you need to make better decisions.",
    },
    {
      icon: "🏷",
      title: "Auto-categorisation",
      description:
        "AI assigns the right category the moment you log. Food, transport, bills, EMIs — sorted without you lifting a finger.",
    },
    {
      icon: "🔍",
      title: "Instant search",
      description:
        "Find any transaction in seconds. Search by amount, category, date, or keyword across your entire history.",
    },
  ];

  return (
    <section className="bg-[#0D1B38] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <p className="font-inter text-xs text-white/30 tracking-[0.15em] uppercase mb-3">
          Features
        </p>
        <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-white mb-10">
          Everything you need. Nothing you don't.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-3"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-inter text-sm font-semibold text-white">
                {f.title}
              </h3>
              <p className="font-inter text-xs text-white/40 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
