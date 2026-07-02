"use client";

import { useState, useEffect } from "react";

type Category = { id: string; name: string; icon: string | null; type: string };
type Label    = { id: string; name: string; color: string | null };
type Wallet   = { id: string; name: string; emoji: string | null };

type Props = {
  categories: Category[];
  labels:     Label[];
  wallets:    Wallet[];
  onCreated:  () => void;
  onClose:    () => void;
};

const MONTHS = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

function monthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = -2; i <= 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    opts.push({
      value: d.toISOString().split("T")[0],
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return opts;
}

export default function RecurringModal({ categories, labels, wallets, onCreated, onClose }: Props) {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

  const [entryType,  setEntryType]  = useState<"income" | "expense">("expense");
  const [amount,     setAmount]     = useState("");
  const [description,setDescription]= useState("");
  const [note,       setNote]       = useState("");
  const [walletId,   setWalletId]   = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [labelIds,   setLabelIds]   = useState<string[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startMonth, setStartMonth] = useState(thisMonth);
  const [endMonth,   setEndMonth]   = useState("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Retroactive prompt state
  const [showRetroPrompt, setShowRetroPrompt] = useState(false);
  const [pendingPayload,  setPendingPayload]  = useState<object | null>(null);

  const monthOpts = monthOptions();

  const filteredCategories = categories.filter(
    (c) => c.type === entryType || c.type === "both"
  );

  // Reset category if type changes and selected category no longer valid
  useEffect(() => {
    if (categoryId) {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat && cat.type !== "both" && cat.type !== entryType) setCategoryId("");
    }
  }, [entryType, categoryId, categories]);

  function toggleLabel(id: string) {
    setLabelIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  // Check if current month's day has already passed
  function shouldShowRetroPrompt() {
    if (startMonth !== thisMonth) return false;
    const day = parseInt(dayOfMonth, 10);
    return day <= now.getDate(); // day has already passed or is today
  }

  async function submit(createForCurrentMonth: boolean) {
    setSaving(true);
    setError(null);

    const payload = pendingPayload
      ? { ...pendingPayload, create_for_current_month: createForCurrentMonth }
      : null;

    try {
      const res = await fetch("/api/tracker/recurring", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Could not save. Please try again.");
        setSaving(false);
        return;
      }
      onCreated();
    } catch {
      setError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  function handleSubmit() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    const payload = {
      amount:        Number(amount),
      entry_type:    entryType,
      description:   description.trim(),
      note:          note.trim() || undefined,
      wallet_id:     walletId    || undefined,
      category_id:   categoryId  || undefined,
      label_ids:     labelIds,
      day_of_month:  parseInt(dayOfMonth, 10),
      start_month:   startMonth,
      end_month:     endMonth || undefined,
    };

    if (shouldShowRetroPrompt()) {
      setPendingPayload(payload);
      setShowRetroPrompt(true);
      return;
    }

    setPendingPayload(payload);
    submit(false);
  }

  const INPUT = "w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2.5 font-inter text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
  const SELECT = `${INPUT} [color-scheme:dark]`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0F1E40] border border-white/[0.10] rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <h2 className="font-playfair text-lg font-bold text-white">New Recurring Transaction</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        {/* Retroactive prompt overlay */}
        {showRetroPrompt && (
          <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="text-3xl">📅</div>
            <div>
              <p className="font-inter text-sm font-semibold text-white mb-1">
                The {dayOfMonth}{ordinal(parseInt(dayOfMonth))} has already passed this month.
              </p>
              <p className="font-inter text-xs text-white/50">
                Create a transaction for {MONTHS[now.getMonth()]} {now.getFullYear()} now, or start from next month?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { setShowRetroPrompt(false); submit(false); }}
                disabled={saving}
                className="flex-1 font-inter text-sm text-white/60 border border-white/[0.10] rounded-lg py-2.5 hover:bg-white/[0.05] transition-colors disabled:opacity-40"
              >
                Start next month
              </button>
              <button
                onClick={() => { setShowRetroPrompt(false); submit(true); }}
                disabled={saving}
                className="flex-1 font-inter text-sm font-semibold bg-white text-[#0A1628] rounded-lg py-2.5 hover:bg-white/90 transition-colors disabled:opacity-40"
              >
                {saving ? "Saving…" : "Create for this month"}
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {!showRetroPrompt && (
          <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">

            {/* Type toggle */}
            <div className="flex rounded-lg overflow-hidden border border-white/[0.10]">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setEntryType(t)}
                  className={`flex-1 py-2 font-inter text-sm font-medium transition-colors capitalize ${
                    entryType === t
                      ? t === "expense"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-green-500/20 text-green-300"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Amount + description */}
            <div className="flex gap-3">
              <div className="w-36">
                <label className="block font-inter text-xs text-white/50 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(null); }}
                  placeholder="0.00"
                  className={INPUT}
                />
              </div>
              <div className="flex-1">
                <label className="block font-inter text-xs text-white/50 mb-1.5">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError(null); }}
                  placeholder="e.g. HDFC EMI"
                  className={INPUT}
                />
              </div>
            </div>

            {/* Day of month + wallet */}
            <div className="flex gap-3">
              <div className="w-36">
                <label className="block font-inter text-xs text-white/50 mb-1.5">Day of month</label>
                <select value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className={SELECT}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}{ordinal(d)}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block font-inter text-xs text-white/50 mb-1.5">Wallet</label>
                <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className={SELECT}>
                  <option value="">Any wallet</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>{w.emoji} {w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block font-inter text-xs text-white/50 mb-1.5">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={SELECT}>
                <option value="">No category</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Labels */}
            {labels.length > 0 && (
              <div>
                <label className="block font-inter text-xs text-white/50 mb-1.5">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {labels.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => toggleLabel(l.id)}
                      className={`font-inter text-xs px-3 py-1 rounded-full border transition-colors ${
                        labelIds.includes(l.id)
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/[0.08] text-white/45 hover:text-white/70"
                      }`}
                      style={labelIds.includes(l.id) && l.color ? { borderColor: l.color + "66", backgroundColor: l.color + "22", color: l.color } : {}}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start + end month */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block font-inter text-xs text-white/50 mb-1.5">Start month</label>
                <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className={SELECT}>
                  {monthOpts.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block font-inter text-xs text-white/50 mb-1.5">End month <span className="text-white/30">(optional)</span></label>
                <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className={SELECT}>
                  <option value="">No end date</option>
                  {monthOpts.filter((m) => m.value >= startMonth).map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block font-inter text-xs text-white/50 mb-1.5">Note <span className="text-white/30">(optional)</span></label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any extra detail"
                className={INPUT}
              />
            </div>

            {error && <p className="font-inter text-xs text-red-400">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full font-inter text-sm font-semibold bg-white text-[#0A1628] py-2.5 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-40 mt-1"
            >
              {saving ? "Saving…" : "Save recurring transaction"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ordinal(n: number) {
  if (n >= 11 && n <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
