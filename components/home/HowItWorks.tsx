export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: "🎙",
      title: "Say it",
      description:
        'Open the app and speak naturally. "Paid 450 for groceries from HDFC." That\'s it.',
    },
    {
      number: "02",
      icon: "⚡",
      title: "AI parses it",
      description:
        "Voice AI extracts the amount, category, and wallet in under a second. No typing, no dropdowns.",
    },
    {
      number: "03",
      icon: "✓",
      title: "Logged",
      description:
        "Entry is saved, categorised, and attributed to the right wallet. Your data, instantly organised.",
    },
  ];

  return (
    <section className="bg-[#112244] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <p className="font-inter text-xs text-white/45 tracking-[0.15em] uppercase mb-3">
          How it works
        </p>
        <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-white mb-10">
          Three seconds to logged.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{step.icon}</span>
                <span className="font-inter text-xs text-white/35 tracking-widest">{step.number}</span>
              </div>
              <h3 className="font-playfair text-lg font-semibold text-white mb-2">
                {step.title}
              </h3>
              <p className="font-inter text-sm text-white/65 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
