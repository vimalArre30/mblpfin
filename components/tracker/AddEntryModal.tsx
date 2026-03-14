"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Wallet } from "./CreateWalletModal";
import VoiceRecorder from "./VoiceRecorder";

type Category = { id: string; name: string; icon: string | null };
type Label = { id: string; name: string; color: string | null };
type EntryType = "income" | "expense" | "transfer";

export default function AddEntryModal({
  wallets,
  onCreated,
  onClose,
}: {
  wallets: Wallet[];
  onCreated: () => void;
  onClose: () => void;
}) {
  const [entryType, setEntryType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id ?? wallets[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const [walletMatchError, setWalletMatchError] = useState("");
  const [fromWalletUnmatched, setFromWalletUnmatched] = useState(false);
  const [toWalletUnmatched, setToWalletUnmatched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
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

  async function parseVoice(transcript: string) {
    setVoiceTranscript(transcript);
    setShowVoice(false);
    setParseError("");
    setParsing(true);
    setFromWalletUnmatched(false);
    setToWalletUnmatched(false);

    try {
      const isTransferMode = entryType === "transfer";
      const res = await fetch("/api/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isTransferMode
            ? {
                transcript,
                mode: "transfer",
                walletNames: wallets.map((w) => w.name),
              }
            : {
                transcript,
                categories: categories.map((c) => c.name),
                wallets: wallets.map((w) => w.name),
              }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        setParseError(data.message ?? data.error ?? "Parsing failed — please fill in manually");
        return;
      }

      // Amount (all modes)
      if (data.amount != null) setAmount(String(data.amount));

      if (isTransferMode) {
        // Match from_wallet
        if (data.from_wallet) {
          const match = wallets.find(
            (w) => w.name.toLowerCase() === data.from_wallet.toLowerCase()
          );
          if (match) {
            setWalletId(match.id);
            setFromWalletUnmatched(false);
          } else {
            setFromWalletUnmatched(true);
          }
        }
        // Match to_wallet
        if (data.to_wallet) {
          const match = wallets.find(
            (w) => w.name.toLowerCase() === data.to_wallet.toLowerCase()
          );
          if (match) {
            setToWalletId(match.id);
            setToWalletUnmatched(false);
          } else {
            setToWalletUnmatched(true);
          }
        }
      } else {
        // Income / Expense fields
        if (data.description) setDescription(data.description);
        if (data.note) setNote(data.note);
        if (data.date) setDate(data.date);

        if (data.entry_type && ["income", "expense", "transfer"].includes(data.entry_type)) {
          setEntryType(data.entry_type as EntryType);
        }

        const fromWalletName = data.from_wallet ?? data.wallet;
        if (fromWalletName) {
          const match = wallets.find(
            (w) => w.name.toLowerCase() === fromWalletName.toLowerCase()
          );
          if (match) setWalletId(match.id);
        }

        if (data.category) {
          const match = categories.find(
            (c) => c.name.toLowerCase() === data.category.toLowerCase()
          );
          if (match) setCategoryId(match.id);
        }
      }
    } catch {
      setParseError("Couldn't reach the server — please fill in manually");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }

    if (entryType === "transfer") {
      if (!walletId || !toWalletId) {
        setError("Select both source and destination wallets.");
        return;
      }
      if (walletId === toWalletId) {
        setWalletMatchError("From and To wallets must be different.");
        return;
      }
    } else {
      if (!description.trim()) {
        setError("Description is required.");
        return;
      }
    }

    setError("");
    setLoading(true);

    if (entryType === "transfer") {
      // Call atomic transfer API
      const res = await fetch("/api/tracker/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWalletId: walletId,
          toWalletId,
          amount: parsedAmount,
          description: description.trim() || "Transfer",
          date,
          note: note.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Transfer failed — please try again.");
        setLoading(false);
        return;
      }

      router.refresh();
      onCreated();
      return;
    }

    // Income or Expense
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated. Please sign in again.");
      setLoading(false);
      return;
    }

    const noteValue = note.trim();
    const payload: Record<string, unknown> = {
      user_id: user.id,
      wallet_id: walletId || null,
      category_id: categoryId || null,
      amount: parsedAmount,
      description: description.trim(),
      date,
      entry_type: entryType,
      type: entryType === "income" ? "credit" : "debit",
      is_opening_balance: false,
    };
    // Only include note if the column exists and has a value
    if (noteValue) payload.note = noteValue;
    console.log("[AddEntry] inserting:", payload);

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert(payload)
      .select()
      .single();

    console.log("[AddEntry] insert result:", { data: tx, error: txError });

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

    router.refresh();
    onCreated();
  }

  const isTransfer = entryType === "transfer";

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

            {/* Entry Type Toggle */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2">
                Type
              </label>
              <div className="flex gap-1 bg-white/8 rounded-xl p-1">
                {(["expense", "income", "transfer"] as EntryType[]).map((t) => {
                  const labels = { expense: "Expense", income: "Income", transfer: "Transfer" };
                  const activeClass =
                    t === "income"
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : t === "expense"
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30";
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setEntryType(t);
                        setError("");
                      }}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                        entryType === t
                          ? activeClass
                          : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      {labels[t]}
                    </button>
                  );
                })}
              </div>
            </div>

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

            {/* Transfer: From + To Wallets */}
            {isTransfer && wallets.length >= 2 && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">
                    From Wallet
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWalletId(val);
                      setFromWalletUnmatched(false);
                      setWalletMatchError(val === toWalletId ? "From and To wallets must be different." : "");
                      setError("");
                    }}
                    className={`w-full bg-[#0F1E40] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition ${fromWalletUnmatched ? "border-amber-400/60 focus:border-amber-400 focus:ring-amber-400/20" : "border-white/15 focus:border-white/40 focus:ring-white/20"}`}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.emoji ?? ""} {w.name}
                      </option>
                    ))}
                  </select>
                  {fromWalletUnmatched && (
                    <p className="mt-1 text-xs text-amber-400/80">Couldn't match — pick manually</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">
                    To Wallet
                  </label>
                  <select
                    value={toWalletId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setToWalletId(val);
                      setToWalletUnmatched(false);
                      setWalletMatchError(val === walletId ? "From and To wallets must be different." : "");
                      setError("");
                    }}
                    className={`w-full bg-[#0F1E40] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition ${toWalletUnmatched ? "border-amber-400/60 focus:border-amber-400 focus:ring-amber-400/20" : "border-white/15 focus:border-white/40 focus:ring-white/20"}`}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.emoji ?? ""} {w.name}
                      </option>
                    ))}
                  </select>
                  {toWalletUnmatched && (
                    <p className="mt-1 text-xs text-amber-400/80">Couldn't match — pick manually</p>
                  )}
                  {walletMatchError && (
                    <p className="mt-1.5 text-xs text-red-400/90">
                      {walletMatchError}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isTransfer && wallets.length < 2 && (
              <p className="text-xs text-amber-400/80 bg-amber-400/8 border border-amber-400/15 rounded-lg px-3 py-2">
                You need at least 2 wallets to make a transfer.
              </p>
            )}

            {/* Description (hidden for transfer if empty — but still present) */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                {isTransfer ? "Note" : "Description"}{" "}
                {!isTransfer && <span className="text-red-400">*</span>}
                {isTransfer && <span className="text-white/25 font-normal">(optional)</span>}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError("");
                }}
                placeholder={isTransfer ? "e.g. Moving savings to mortgage" : "e.g. Lunch at Bombay Canteen"}
                className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
              />
            </div>

            {/* Voice input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-white/50">
                  Voice Input{" "}
                  <span className="text-white/25 font-normal">(optional)</span>
                </label>
                  <button
                    type="button"
                    onClick={() => setShowVoice((v) => !v)}
                    className={`flex items-center gap-1 text-xs rounded-lg px-2.5 py-1 transition ${
                      showVoice
                        ? "bg-white/12 text-white/80"
                        : "text-white/35 hover:text-white/60 hover:bg-white/8"
                    }`}
                  >
                    <span>🎙️</span>
                    <span>{showVoice ? "Hide" : "Open"}</span>
                  </button>
                </div>

                {showVoice && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <VoiceRecorder onUse={parseVoice} />
                  </div>
                )}

                {parsing && (
                  <div className="mt-2 flex items-center gap-2.5 text-xs text-white/50 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                    <svg className="animate-spin w-3.5 h-3.5 shrink-0 text-white/40" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Parsing with AI…
                  </div>
                )}

                {parseError && !parsing && (
                  <p className="mt-2 text-xs text-amber-400/80 bg-amber-400/8 border border-amber-400/15 rounded-lg px-3 py-2">
                    {parseError}
                  </p>
                )}

                {voiceTranscript && !showVoice && !parsing && (
                  <div className="mt-2 relative">
                    <p className="text-xs text-white/25 mb-1">Voice input (raw)</p>
                    <div className="bg-white/6 border border-white/12 rounded-lg px-3 py-2 pr-8 text-sm text-white/55 leading-relaxed italic">
                      "{voiceTranscript}"
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVoiceTranscript("");
                        setParseError("");
                      }}
                      className="absolute top-6 right-2 text-white/25 hover:text-white/60 transition text-xs"
                      aria-label="Clear voice transcript"
                    >
                      ✕
                    </button>
                  </div>
                )}
            </div>

            {/* Date + Wallet (for income/expense) */}
            {!isTransfer && (
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
            )}

            {/* Date for transfer */}
            {isTransfer && (
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
            )}

            {/* Category chips (income/expense only) */}
            {!isTransfer && !dataLoading && categories.length > 0 && (
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

            {/* Label chips (income/expense only) */}
            {!isTransfer && !dataLoading && labels.length > 0 && (
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

            {/* Note (income/expense only) */}
            {!isTransfer && (
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
            )}

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
              disabled={loading || (isTransfer && walletId === toWalletId)}
              className="flex-1 bg-white text-[#0F1E40] text-sm font-semibold rounded-xl py-2.5 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading
                ? isTransfer
                  ? "Transferring..."
                  : "Saving..."
                : isTransfer
                ? "Transfer"
                : "Log Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
