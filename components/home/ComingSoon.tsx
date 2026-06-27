export default function ComingSoon() {
  const goals = [
    {
      icon: "🎓",
      label: "Education",
      description: "Children's education, skill certifications, courses — goal-based saving with a timeline.",
    },
    {
      icon: "💍",
      label: "Marriage",
      description: "Plan the big day years in advance. Break a large number into monthly targets.",
    },
    {
      icon: "✈️",
      label: "Travel",
      description: "Dedicated travel fund. Watch it grow trip by trip, year by year.",
    },
    {
      icon: "🌿",
      label: "Retirement",
      description: "Long-horizon planning. FIRE number, monthly contribution, projected corpus.",
    },
  ];

  return (
    <section className="bg-[#0D1B38] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex items-center gap-3 mb-3">
          <p className="font-inter text-xs text-white/30 tracking-[0.15em] uppercase">
            Coming next
          </p>
          <span className="font-inter text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full tracking-wide uppercase">
            Roadmap
          </span>
        </div>
        <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-white mb-3">
          Goal-based investing.
        </h2>
        <p className="font-inter text-sm text-white/40 mb-10 max-w-lg">
          Tracking is the foundation. The next layer is purposeful saving —
          every rupee allocated to a goal, not just a category.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {goals.map((g) => (
            <div
              key={g.label}
              className="bg-white/[0.03] border border-white/[0.06] border-dashed rounded-xl p-5 flex flex-col gap-3"
            >
              <span className="text-2xl">{g.icon}</span>
              <div>
                <h3 className="font-inter text-sm font-semibold text-white/60 mb-1">
                  {g.label}
                </h3>
                <p className="font-inter text-xs text-white/30 leading-relaxed">
                  {g.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
