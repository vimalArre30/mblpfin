"use client";

import { useEffect, useRef, useState } from "react";

type Label = { id: string; name: string; color: string | null };

export default function LabelPickerSheet({
  labels,
  selectedIds,
  onChange,
  onClose,
}: {
  labels: Label[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  // Local draft — committed only when "Done" is tapped
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const [visible, setVisible] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Drag-down state
  const dragStartY = useRef(0);
  const dragY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);

  // Slide in
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Autofocus search
  useEffect(() => {
    if (visible) setTimeout(() => searchRef.current?.focus(), 50);
  }, [visible]);

  // Escape key (capture phase so it fires before the parent modal's handler)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        close();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag-down-to-dismiss
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    function onTouchStart(e: TouchEvent) {
      dragStartY.current = e.touches[0].clientY;
      dragY.current = 0;
      isDragging.current = true;
      setDragOffset(0);
    }
    function onTouchMove(e: TouchEvent) {
      if (!isDragging.current) return;
      const dy = e.touches[0].clientY - dragStartY.current;
      if (dy > 0) {
        dragY.current = dy;
        setDragOffset(dy);
      }
    }
    function onTouchEnd() {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (dragY.current > 80) {
        close();
      } else {
        dragY.current = 0;
        setDragOffset(0);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setVisible(false);
    setDragOffset(0);
    setTimeout(onClose, 280);
  }

  function confirm() {
    onChange(draft);
    close();
  }

  function toggle(id: string) {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  // Selected labels sorted to top; all filtered by search query
  const sorted = [
    ...labels.filter((l) => draft.includes(l.id)),
    ...labels.filter((l) => !draft.includes(l.id)),
  ].filter((l) => l.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        ref={sheetRef}
        className="w-full sm:max-w-sm bg-[#0F1E40] border border-white/15 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{
          maxHeight: "70vh",
          ...(visible ? { transform: `translateY(${dragOffset}px)` } : { transform: "translateY(100%)" }),
          transition: isDragging.current ? "none" : "transform 0.28s cubic-bezier(0.32,0.72,0,1)",
          opacity: visible ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-white/10 flex-shrink-0">
          <h3 className="text-sm font-semibold text-white">Labels</h3>
          <button
            type="button"
            onClick={close}
            className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-1 flex-shrink-0">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search labels…"
            className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-2 py-1">
          {sorted.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">No labels found</p>
          ) : (
            sorted.map((lbl) => {
              const isSelected = draft.includes(lbl.id);
              const color = lbl.color ?? "#2563EB";
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => toggle(lbl.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition hover:bg-white/5"
                >
                  {/* Checkbox */}
                  <span
                    className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                    style={
                      isSelected
                        ? { backgroundColor: color, borderColor: color }
                        : { borderColor: "rgba(255,255,255,0.2)", backgroundColor: "transparent" }
                    }
                  >
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={isSelected ? "text-white font-medium" : "text-white/60"}>
                    {lbl.name}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Done button */}
        <div className="px-4 pt-2 pb-5 flex-shrink-0 border-t border-white/10">
          <button
            type="button"
            onClick={confirm}
            className="w-full py-2.5 bg-white text-[#0F1E40] text-sm font-semibold rounded-xl hover:bg-white/90 transition"
          >
            {draft.length > 0 ? `Done (${draft.length} selected)` : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
