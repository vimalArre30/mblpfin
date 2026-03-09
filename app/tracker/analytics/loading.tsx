import {
  ChartSkeleton,
} from "@/components/tracker/TrackerSkeleton";

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      <div className="border-b border-white/10 px-6 py-4 h-[57px]" />
      <div className="border-b border-white/8 h-[45px]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page title placeholder */}
        <div className="space-y-2">
          <div className="animate-pulse bg-white/8 rounded-lg h-7 w-40" />
          <div className="animate-pulse bg-white/8 rounded-lg h-3 w-64" />
        </div>
        <ChartSkeleton height={180} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton height={120} />
        </div>
      </div>
    </div>
  );
}
