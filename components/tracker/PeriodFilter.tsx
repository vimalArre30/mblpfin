"use client";

import { useEffect, useRef, useState } from "react";

interface PeriodFilterProps {
  onChange: (start: string, end: string, label: string) => void;
}

function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function computePeriod(
  mode: "month" | "year",
  anchor: Date
): { start: string; end: string; label: string } {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  if (mode === "month") {
    return {
      start: toISO(new Date(y, m, 1)),
      end: toISO(new Date(y, m + 1, 0)), // last day of month
      label: anchor.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    };
  }
  return { start: `${y}-01-01`, end: `${y}-12-31`, label: String(y) };
}

export default function PeriodFilter({ onChange }: PeriodFilterProps) {
  const [mode, setMode] = useState<"month" | "year">("month");
  const [anchor, setAnchor] = useState<Date>(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [labelVisible, setLabelVisible] = useState(true);
  const touchStartX = useRef(0);

  const now = new Date();
  const { start, end, label } = computePeriod(mode, anchor);

  const atCurrent =
    mode === "month"
      ? anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth()
      : anchor.getFullYear() === now.getFullYear();

  // Fire onChange on mount and whenever the computed range changes
  useEffect(() => {
    onChange(start, end, label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end]);

  function animateThen(fn: () => void) {
    setLabelVisible(false);
    setTimeout(() => {
      fn();
      setLabelVisible(true);
    }, 80);
  }

  function prev() {
    animateThen(() =>
      setAnchor((a) =>
        mode === "month"
          ? new Date(a.getFullYear(), a.getMonth() - 1, 1)
          : new Date(a.getFullYear() - 1, 0, 1)
      )
    );
  }

  function next() {
    if (atCurrent) return;
    animateThen(() =>
      setAnchor((a) =>
        mode === "month"
          ? new Date(a.getFullYear(), a.getMonth() + 1, 1)
          : new Date(a.getFullYear() + 1, 0, 1)
      )
    );
  }

  function switchMode(m: "month" | "year") {
    animateThen(() => setMode(m));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 60) prev();
    else if (dx < -60) next();
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white/[0.03] border border-white/8 rounded-xl px-2 py-2">
      {/* Period navigator — swipeable */}
      <div
        className="flex items-center flex-1 min-w-0"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={prev}
          className="w-11 h-11 flex items-center justify-center text-xl text-white/50 hover:text-white/90 transition rounded-lg hover:bg-white/5 shrink-0"
          aria-label="Previous period"
        >
          ‹
        </button>
        <span
          className="flex-1 text-center font-semibold text-white text-sm sm:text-base transition-opacity duration-150 select-none"
          style={{ opacity: labelVisible ? 1 : 0 }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={atCurrent}
          className="w-11 h-11 flex items-center justify-center text-xl text-white/50 hover:text-white/90 transition rounded-lg hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
          aria-label="Next period"
        >
          ›
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-0.5 bg-white/8 rounded-lg p-0.5 self-center sm:self-auto shrink-0">
        {(["month", "year"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`h-8 px-4 text-xs font-semibold rounded-md transition ${
              mode === m ? "bg-amber-500 text-white" : "text-white/50 hover:text-white/70"
            }`}
          >
            {m === "month" ? "Month" : "Year"}
          </button>
        ))}
      </div>
    </div>
  );
}
