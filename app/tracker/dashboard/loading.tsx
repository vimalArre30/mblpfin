import {
  StatCardsSkeleton,
  ChartSkeleton,
  FeedSkeleton,
} from "@/components/tracker/TrackerSkeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      {/* Top bar placeholder */}
      <div className="border-b border-white/10 px-6 py-4 h-[57px]" />
      {/* Nav placeholder */}
      <div className="border-b border-white/8 h-[45px]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <StatCardsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton height={160} />
        </div>
        <ChartSkeleton height={80} />
        <FeedSkeleton rows={6} />
      </div>
    </div>
  );
}
