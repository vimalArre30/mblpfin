"use client";

import { useEffect, useRef } from "react";

/**
 * Footer for a paged list: loads the next page when scrolled into view, with a
 * visible "Load more" button as the fallback. Shows "Showing n of total".
 */
export default function LoadMoreFooter({
  shown,
  total,
  hasMore,
  loading,
  onLoadMore,
}: {
  shown: number;
  total: number | null;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onLoadMore);
  cb.current = onLoadMore;

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) cb.current();
      },
      { rootMargin: "300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown]);

  if (!hasMore && (total === null || shown >= total)) return null;

  return (
    <div ref={ref} className="flex flex-col items-center gap-2 pt-6 pb-2">
      {total !== null && (
        <p className="text-xs text-white/35">
          Showing {shown.toLocaleString("en-IN")} of {total.toLocaleString("en-IN")}
        </p>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          className="text-sm text-white/60 border border-dashed border-white/20 rounded-xl px-5 py-2 hover:text-white hover:border-white/40 transition disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
