"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import RecurringModal from "@/components/tracker/RecurringModal";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

type Category = { id: string; name: string; icon: string | null; type: string };
type Label    = { id: string; name: string; color: string | null };

type RecurringLabel = {
  label_id: string;
  labels: { id: string; name: string; color: string | null } | null;
};

type RecurringTemplate = {
  id:          string;
  amount:      number;
  entry_type:  "income" | "expense";
  description: string;
  note:        string | null;
  wallet_id:   string | null;
  category_id: string | null;
  day_of_month:number;
  start_month: string;
  end_month:   string | null;
  is_active:   boolean;
  created_at:  string;
  recurring_transaction_labels: RecurringLabel[];
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function ordinal(n: number) {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function formatMonth(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function SkeletonRow() {
  return (
    <div className="animate-pulse bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/10 rounded w-2/3" />
        <div className="h-2.5 bg-white/[0.08] rounded w-1/2" />
      </div>
      <div className="h-4 bg-white/10 rounded w-16 shrink-0" />
    </div>
  );
}

export default function RecurringSection({ wallets }: { wallets: Wallet[] }) {
  const supabase = useRef(createClient()).current;
  const [templates, setTemplates]   = useState<RecurringTemplate[]>([]);
  const [loading,   setLoading]     = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [toast,     setToast]       = useState<string | null>(null);
  const [deleting,  setDeleting]    = useState<string | null>(null);
  const [toggling,  setToggling]    = useState<string | null>(null);

  // Categories + labels for the modal (fetched once)
  const [categories, setCategories] = useState<Category[]>([]);
  const [labels,     setLabels]     = useState<Label[]>([]);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tracker/recurring");
    if (res.ok) {
      const { data } = await res.json();
      setTemplates(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  async function loadMeta() {
    if (metaLoaded) return;
    const [{ data: cats }, { data: labs }] = await Promise.all([
      supabase.from("categories").select("id, name, icon, type").order("name"),
      supabase.from("labels").select("id, name, color").order("name"),
    ]);
    setCategories((cats ?? []) as Category[]);
    setLabels((labs ?? []) as Label[]);
    setMetaLoaded(true);
  }

  async function openModal() {
    await loadMeta();
    setShowModal(true);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function toggleActive(tmpl: RecurringTemplate) {
    setToggling(tmpl.id);
    const res = await fetch(`/api/tracker/recurring/${tmpl.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ is_active: !tmpl.is_active }),
    });
    if (res.ok) {
      setTemplates((prev) =>
        prev.map((t) => t.id === tmpl.id ? { ...t, is_active: !t.is_active } : t)
      );
      showToast(tmpl.is_active ? "Recurring paused" : "Recurring resumed");
    }
    setToggling(null);
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this recurring template? Past transactions are kept.")) return;
    setDeleting(id);
    const res = await fetch(`/api/tracker/recurring/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      showToast("Template deleted");
    }
    setDeleting(null);
  }

  function handleCreated() {
    setShowModal(false);
    showToast("Recurring transaction saved");
    loadTemplates();
  }

  return (
    <>
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-white">Recurring</h1>
            {!loading && (
              <p className="mt-1.5 text-white/45 text-sm">
                {templates.length === 0
                  ? "No recurring transactions set up"
                  : `${templates.length} template${templates.length !== 1 ? "s" : ""}`}
              </p>
            )}
          </div>
          <button
            onClick={openModal}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-[#0F1E40] text-sm font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition"
          >
            <span className="text-base leading-none">🔁</span> Add Recurring
          </button>
        </div>

        {/* Info banner */}
        <div className="mb-6 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-sm mt-0.5">ℹ️</span>
          <p className="font-inter text-xs text-white/50 leading-relaxed">
            Recurring transactions are auto-created each day at 06:00 IST. They appear in your feed with a <span className="text-white/70">🔁</span> badge.
          </p>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-5">🔁</div>
            <h2 className="font-playfair text-xl font-semibold text-white mb-2">
              No recurring transactions yet
            </h2>
            <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
              Set up EMIs, subscriptions, salaries — anything that repeats monthly.
            </p>
            <button
              onClick={openModal}
              className="bg-white text-[#0F1E40] text-sm font-semibold rounded-xl px-6 py-2.5 hover:bg-white/90 transition"
            >
              + Add Recurring
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((tmpl) => {
              const labelList = tmpl.recurring_transaction_labels
                .map((rl) => rl.labels)
                .filter(Boolean);
              const isExpense = tmpl.entry_type === "expense";
              const isPaused  = !tmpl.is_active;

              return (
                <div
                  key={tmpl.id}
                  className={`bg-white/[0.04] border rounded-xl px-4 py-4 flex gap-4 items-start transition-opacity ${
                    isPaused ? "opacity-50" : ""
                  } border-white/[0.08]`}
                >
                  {/* Amount + type indicator */}
                  <div className="shrink-0 text-right min-w-[72px]">
                    <p className={`font-inter text-sm font-semibold ${isExpense ? "text-red-400" : "text-green-400"}`}>
                      {isExpense ? "−" : "+"}₹{Number(tmpl.amount).toLocaleString("en-IN")}
                    </p>
                    <p className="font-inter text-[10px] text-white/30 capitalize mt-0.5">{tmpl.entry_type}</p>
                  </div>

                  {/* Description + metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-inter text-sm font-medium text-white truncate">{tmpl.description}</p>
                      {isPaused && (
                        <span className="font-inter text-[10px] text-white/40 border border-white/[0.12] rounded px-1.5 py-0.5 shrink-0">Paused</span>
                      )}
                    </div>
                    <p className="font-inter text-xs text-white/40 mt-0.5">
                      Every month on the {tmpl.day_of_month}{ordinal(tmpl.day_of_month)}
                      {tmpl.end_month
                        ? ` · until ${formatMonth(tmpl.end_month)}`
                        : " · ongoing"}
                    </p>
                    {/* Labels */}
                    {labelList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {labelList.map((l) => l && (
                          <span
                            key={l.id}
                            className="font-inter text-[10px] px-2 py-0.5 rounded-full border border-white/[0.10] text-white/50"
                            style={l.color ? { borderColor: l.color + "55", color: l.color } : {}}
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(tmpl)}
                      disabled={toggling === tmpl.id}
                      title={tmpl.is_active ? "Pause" : "Resume"}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30"
                    >
                      {toggling === tmpl.id
                        ? <span className="text-xs">…</span>
                        : tmpl.is_active
                          ? <PauseIcon />
                          : <PlayIcon />
                      }
                    </button>
                    <button
                      onClick={() => deleteTemplate(tmpl.id)}
                      disabled={deleting === tmpl.id}
                      title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30"
                    >
                      {deleting === tmpl.id ? <span className="text-xs">…</span> : <TrashIcon />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg z-50 pointer-events-none">
          {toast}
        </div>
      )}

      {showModal && (
        <RecurringModal
          categories={categories}
          labels={labels}
          wallets={wallets}
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 2h4a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1zM3 5h10l-.8 8.1A1 1 0 0 1 11.2 14H4.8a1 1 0 0 1-1-.9L3 5z" />
      <path d="M1 5h14M6 7v5M10 7v5" stroke="none" />
    </svg>
  );
}
