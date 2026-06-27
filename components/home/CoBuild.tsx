export default function CoBuild() {
  const wishlist = [
    { votes: 142, feature: "Budget envelopes with monthly rollover", status: "In review" },
    { votes: 98,  feature: "Net worth tracker across all asset classes", status: "Planned" },
    { votes: 87,  feature: "Recurring expense detection & reminders", status: "Building" },
    { votes: 61,  feature: "Shared wallet for couples / families", status: "Planned" },
    { votes: 44,  feature: "Export to Google Sheets (auto-sync)", status: "In review" },
  ];

  return (
    <section className="bg-[#0A1628] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <p className="font-inter text-xs text-white/30 tracking-[0.15em] uppercase mb-3">
          Co-building
        </p>
        <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-white mb-3">
          You decide what gets built.
        </h2>
        <p className="font-inter text-sm text-white/40 mb-10 max-w-lg">
          Community members upvote features. The top requests directly influence the roadmap.
          No black-box product decisions.
        </p>

        <div className="space-y-3 max-w-2xl">
          {wishlist.map((item) => (
            <div
              key={item.feature}
              className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4"
            >
              {/* Votes */}
              <div className="flex-shrink-0 w-12 text-center">
                <div className="font-inter text-base font-semibold text-white/60">{item.votes}</div>
                <div className="font-inter text-[9px] text-white/20 tracking-wide uppercase">votes</div>
              </div>

              {/* Feature */}
              <div className="flex-1 font-inter text-sm text-white/60">
                {item.feature}
              </div>

              {/* Status */}
              <span className={`flex-shrink-0 font-inter text-[10px] px-2.5 py-1 rounded-full border tracking-wide ${
                item.status === "Building"
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : item.status === "Planned"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "bg-white/[0.05] border-white/10 text-white/30"
              }`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <p className="font-inter text-xs text-white/20 mt-6">
          Wishlist data is illustrative — join the community to vote on real features.
        </p>
      </div>
    </section>
  );
}
