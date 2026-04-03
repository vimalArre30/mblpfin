"use client";

import { useEffect, useRef, useState } from "react";

type Category = { id: string; name: string; icon: string | null };

export default function CategoryPickerSheet({
  categories,
  selectedId,
  onSelect,
  onClose,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
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

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        close();
      }
    }
    document.addEventListener("keydown", onKey, true); // capture phase — fires before parent modal
    return () => document.removeEventListener("keydown", onKey, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drag-down-to-dismiss (native listeners, passive where possible)
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

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

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
          transform: `translateY(${visible ? dragOffset : "100%"}px) ${!visible ? "" : ""}`,
          // On mount, slide from translateY(100%) to 0; after that, only dragOffset applies
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
          <h3 className="text-sm font-semibold text-white">Category</h3>
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
            placeholder="Search categories…"
            className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-2 py-1">
          {filtered.length === 0 ? (
            <p className="text-center text-white/30 text-sm py-8">No categories found</p>
          ) : (
            filtered.map((cat) => {
              const isSelected = selectedId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelect(isSelected ? null : cat.id);
                    if (!isSelected) close();
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-sm transition ${
                    isSelected
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {cat.icon && <span className="text-base">{cat.icon}</span>}
                    {cat.name}
                  </span>
                  {isSelected && (
                    <svg className="w-4 h-4 text-white flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5-1-1z" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Clear / footer */}
        <div className="px-4 pt-2 pb-5 flex-shrink-0 border-t border-white/10">
          <button
            type="button"
            onClick={() => { onSelect(null); close(); }}
            disabled={!selectedId}
            className="w-full py-2.5 text-sm border border-white/15 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed text-white/55 hover:border-white/30 hover:text-white/75 disabled:hover:border-white/15 disabled:hover:text-white/30"
          >
            Clear selection
          </button>
        </div>
      </div>
    </div>
  );
}
