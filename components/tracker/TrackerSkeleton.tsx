// Reusable skeleton primitives for tracker pages

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/8 rounded-lg ${className ?? ""}`}
    />
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Bone className="h-3 w-20" />
            <Bone className="h-5 w-5 rounded-full" />
          </div>
          <Bone className="h-7 w-32" />
          <Bone className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="bg-white/5 border border-white/10 rounded-xl p-6"
      style={{ minHeight: height + 56 }}
    >
      <Bone className="h-3 w-36 mb-6" />
      <div className="animate-pulse space-y-3">
        {([80, 55, 70, 45, 60, 35] as const).map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <Bone className="h-3 w-20 shrink-0" />
            <div
              className="h-5 bg-white/8 rounded-lg"
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <div className="flex-1 space-y-2">
            <Bone className="h-3.5 w-48" />
            <Bone className="h-3 w-28" />
          </div>
          <div className="text-right space-y-2">
            <Bone className="h-3.5 w-20" />
            <Bone className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WalletGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3"
        >
          <Bone className="h-9 w-9 rounded-lg" />
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
