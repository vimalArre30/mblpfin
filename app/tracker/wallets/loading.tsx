import { WalletGridSkeleton } from "@/components/tracker/TrackerSkeleton";

export default function WalletsLoading() {
  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      <div className="border-b border-white/10 px-6 py-4 h-[57px]" />

      <div className="max-w-content mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-2">
            <div className="animate-pulse bg-white/8 rounded-lg h-8 w-28" />
            <div className="animate-pulse bg-white/8 rounded-lg h-3 w-20" />
          </div>
          <div className="animate-pulse bg-white/8 rounded-xl h-10 w-32" />
        </div>
        <WalletGridSkeleton />
      </div>
    </div>
  );
}
