import { FeedSkeleton } from "@/components/tracker/TrackerSkeleton";

export default function WalletDetailLoading() {
  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      <div className="border-b border-white/10 px-6 py-4 h-[57px]" />
      <div className="border-b border-white/8 h-[45px]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Back link */}
        <div className="animate-pulse bg-white/8 rounded h-4 w-28" />

        {/* Wallet header */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
          <div className="animate-pulse bg-white/8 rounded-lg h-10 w-10" />
          <div className="animate-pulse bg-white/8 rounded-lg h-7 w-40" />
          <div className="animate-pulse bg-white/8 rounded-lg h-3 w-28" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-2">
              <div className="animate-pulse bg-white/8 rounded h-3 w-20" />
              <div className="animate-pulse bg-white/8 rounded-lg h-7 w-32" />
              <div className="animate-pulse bg-white/8 rounded h-3 w-16" />
            </div>
          ))}
        </div>

        <FeedSkeleton rows={6} />
      </div>
    </div>
  );
}
