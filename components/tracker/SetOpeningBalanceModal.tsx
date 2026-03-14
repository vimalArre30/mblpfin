"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Wallet } from "./CreateWalletModal";

export default function SetOpeningBalanceModal({
  wallet,
  onSaved,
  onClose,
}: {
  wallet: Wallet;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [existingTxId, setExistingTxId] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amountRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Load existing opening balance transaction for this wallet
  useEffect(() => {
    amountRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);

    async function fetchExisting() {
      const { data } = await supabase
        .from("transactions")
        .select("id, amount, date")
        .eq("wallet_id", wallet.id)
        .eq("is_opening_balance", true)
        .maybeSingle();

      if (data) {
        setExistingTxId(data.id);
        setAmount(String(Math.abs(Number(data.amount))));
        setDate(data.date);
      }
      setFetching(false);
    }
    fetchExisting();

    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    setError("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    if (existingTxId) {
      // Update existing row
      const { error: upErr } = await supabase
        .from("transactions")
        .update({ amount: parsed, date })
        .eq("id", existingTxId);
      if (upErr) { setError(upErr.message); setLoading(false); return; }
    } else {
      // Insert new row
      const { error: insErr } = await supabase.from("transactions").insert({
        user_id: user.id,
        wallet_id: wallet.id,
        amount: parsed,
        description: "Opening Balance",
        entry_type: "income",
        type: "credit",
        is_opening_balance: true,
        date,
        category_id: null,
        label_id: null,
      });
      if (insErr) { setError(insErr.message); setLoading(false); return; }
    }

    onSaved();
  }

  async function handleClear() {
    if (!existingTxId) { onClose(); return; }
    if (!window.confirm("Remove the opening balance for this wallet?")) return;
    setLoading(true);
    const { error: delErr } = await supabase
      .from("transactions")
      .delete()
      .eq("id", existingTxId);
    if (delErr) { setError(delErr.message); setLoading(false); return; }
    onSaved();
  }

  const accent = wallet.color ?? "#2563EB";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-[#0F1E40] border border-white/15 rounded-2xl p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: accent }}
            />
            <h2 className="font-playfair text-lg font-semibold text-white">
              {wallet.emoji ?? "💼"} {wallet.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-white/40 mb-5">
          {existingTxId ? "Edit the opening balance for this wallet." : "Set an opening balance for this wallet."}
        </p>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin w-5 h-5 text-white/30" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Opening Balance <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm select-none">
                  ₹
                </span>
                <input
                  ref={amountRef}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(""); }}
                  placeholder="0.00"
                  className="w-full bg-white/10 border border-white/15 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                As of Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition [color-scheme:dark]"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              {existingTxId && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={loading}
                  className="text-sm text-red-400/70 hover:text-red-400 border border-red-400/20 hover:border-red-400/40 rounded-xl px-4 py-2.5 transition disabled:opacity-50"
                >
                  Clear
                </button>
              )}
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
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
