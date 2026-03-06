"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Wallet } from "./CreateWalletModal";

type Category = { id: string; name: string; icon: string | null };
type Label = { id: string; name: string; color: string | null };

export default function AddEntryModal({
  wallets,
  onCreated,
  onClose,
}: {
  wallets: Wallet[];
  onCreated: () => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    amountRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    async function fetchData() {
      const [{ data: cats }, { data: lbls }] = await Promise.all([
        supabase.from("categories").select("id, name, icon").order("name"),
        supabase.from("labels").select("id, name, color").order("name"),
      ]);
      if (cats) setCategories(cats);
      if (lbls) setLabels(lbls);
      setDataLoading(false);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleLabel(id: string) {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    setError("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated. Please sign in again.");
      setLoading(false);
      return;
    }

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        wallet_id: walletId || null,
        category_id: categoryId || null,
        amount: parsedAmount,
        description: description.trim(),
        note: note.trim() || null,
        date,
      })
      .select()
      .single();

    if (txError) {
      setError(txError.message);
      setLoading(false);
      return;
    }

    if (selectedLabels.length > 0 && tx) {
      const labelRows = selectedLabels.map((lid) => ({
        transaction_id: tx.id,
        label_id: lid,
      }));
      await supabase.from("transaction_labels").insert(labelRows);
    }

    onCreated();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-lg bg-[#0F1E40] border border-white/15 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
          <h2 className="font-playfair text-xl font-semibold text-white">
            New Entry
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm font-medium select-none">
                  ₹
                </span>
                <input
                  ref={amountRef}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError("");
                  }}
                  placeholder="0.00"
                  className="w-full bg-white/10 border border-white/15 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Lunch at Bombay Canteen"
                className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
              />
            </div>

            {/* Date + Wallet */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Wallet
                </label>
                {wallets.length === 0 ? (
                  <p className="text-xs text-white/30 pt-2.5">No wallets yet</p>
                ) : (
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full bg-[#0F1E40] border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.emoji ?? ""} {w.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Category chips */}
            {!dataLoading && categories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Category
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {categories.map((cat) => {
                    const selected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setCategoryId(selected ? null : cat.id)
                        }
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          selected
                            ? "bg-white text-[#0F1E40] border-white"
                            : "bg-transparent text-white/60 border-white/20 hover:border-white/40 hover:text-white/80"
                        }`}
                      >
                        {cat.icon && <span>{cat.icon}</span>}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Label chips */}
            {!dataLoading && labels.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">
                  Labels{" "}
                  <span className="text-white/25 font-normal">(multi-select)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {labels.map((lbl) => {
                    const selected = selectedLabels.includes(lbl.id);
                    const color = lbl.color ?? "#2563EB";
                    return (
                      <button
                        key={lbl.id}
                        type="button"
                        onClick={() => toggleLabel(lbl.id)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                          selected
                            ? "text-white"
                            : "bg-transparent text-white/60 hover:text-white/80"
                        }`}
                        style={
                          selected
                            ? { backgroundColor: color, borderColor: color }
                            : { borderColor: `${color}55` }
                        }
                      >
                        {lbl.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Note{" "}
                <span className="text-white/25 font-normal">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any extra context..."
                rows={2}
                className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-white/10 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm text-white/60 border border-white/15 rounded-xl py-2.5 hover:border-white/30 hover:text-white/80 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-[#0F1E40] text-sm font-semibold rounded-xl py-2.5 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Saving..." : "Log Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
