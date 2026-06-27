export default function Community() {
  const attributes = [
    "High-agency",
    "Financially prudent",
    "Long-term thinkers",
    "Anti-broke mindset",
    "Co-builders",
  ];

  return (
    <section className="bg-[#112244] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="font-inter text-xs text-white/45 tracking-[0.15em] uppercase mb-6">
            The community
          </p>
          <h2 className="font-playfair text-2xl lg:text-4xl font-bold text-white leading-tight mb-6">
            People who run their life.
          </h2>
          <p className="font-inter text-[15px] text-white/65 leading-relaxed mb-8">
            MBL PFin is not for everyone. It's for the person who tracks before spending,
            who asks hard questions about where money goes, who builds systems instead of
            hoping for the best. If that's you, you're already home.
          </p>
          <div className="flex flex-wrap gap-2">
            {attributes.map((attr) => (
              <span
                key={attr}
                className="font-inter text-xs text-white/70 bg-white/[0.06] border border-white/[0.08] px-3 py-1.5 rounded-full"
              >
                {attr}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
