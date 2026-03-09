import { FeedSkeleton } from "@/components/tracker/TrackerSkeleton";

export default function TransactionsLoading() {
  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      <div className="border-b border-white/10 px-6 py-4 h-[57px]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="animate-pulse bg-white/8 rounded-lg h-7 w-40" />
          <div className="animate-pulse bg-white/8 rounded-xl h-9 w-28" />
        </div>
        <FeedSkeleton rows={8} />
      </div>
    </div>
  );
}
