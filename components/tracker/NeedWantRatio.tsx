export interface NeedWantData {
  needTotal: number;
  wantTotal: number;
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export default function NeedWantRatio({ needTotal, wantTotal }: NeedWantData) {
  const combined = needTotal + wantTotal;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-5">
        Need vs Want
      </h2>

      {combined === 0 ? (
        <p className="text-sm text-white/30">
          No labelled transactions yet.
        </p>
      ) : (
        <>
          {/* Segmented bar */}
          <div className="flex rounded-full overflow-hidden h-3 mb-4">
            {needTotal > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(needTotal / combined) * 100}%` }}
                title={`Need: ${fmt(needTotal)}`}
              />
            )}
            {wantTotal > 0 && (
              <div
                className="bg-amber-400 transition-all"
                style={{ width: `${(wantTotal / combined) * 100}%` }}
                title={`Want: ${fmt(wantTotal)}`}
              />
            )}
          </div>

          {/* Ratio label */}
          <p className="text-xs text-white/45 mb-5">
            <span className="text-green-400 font-medium">
              {Math.round((needTotal / combined) * 100)}% Need
            </span>
            <span className="text-white/20 mx-1.5">·</span>
            <span className="text-amber-400 font-medium">
              {Math.round((wantTotal / combined) * 100)}% Want
            </span>
          </p>

          {/* Two stat cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-xs text-green-400/70 uppercase tracking-wider mb-1">
                Needs
              </p>
              <p className="text-white font-bold text-xl">{fmt(needTotal)}</p>
            </div>
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-4">
              <p className="text-xs text-amber-400/70 uppercase tracking-wider mb-1">
                Wants
              </p>
              <p className="text-white font-bold text-xl">{fmt(wantTotal)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
