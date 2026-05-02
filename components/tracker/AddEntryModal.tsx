"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Wallet } from "./CreateWalletModal";
import VoiceRecorder from "./VoiceRecorder";
import CategoryPickerSheet from "./CategoryPickerSheet";
import LabelPickerSheet from "./LabelPickerSheet";
import UpgradeModal from "./UpgradeModal";

type Category = { id: string; name: string; icon: string | null; type?: string | null };
type Label = { id: string; name: string; color: string | null };
type EntryType = "income" | "expense" | "transfer";

// Minimal shape of what we need from an existing transaction for edit mode
export type EditableTransaction = {
  id: string;
  transfer_id: string | null;
  entry_type: string | null;
  is_opening_balance: boolean | null;
  amount: number;
  description: string;
  date: string;
  note: string | null;
  wallet_id: string | null;
  to_wallet_id: string | null;
  category_id: string | null;
  type: string;
  spending_type: string | null;
  transaction_labels: { label_id: string }[] | null;
};

export default function AddEntryModal({
  wallets,
  onCreated,
  onClose,
  editTx,
  defaultWalletId,
}: {
  wallets: Wallet[];
  onCreated: () => void;
  onClose: () => void;
  editTx?: EditableTransaction;
  defaultWalletId?: string;
}) {
  const isEditing = !!editTx;
  const isOpeningBalanceEdit = isEditing && editTx.is_opening_balance === true;

  function deriveEntryType(): EntryType {
    if (!editTx) return "expense";
    if (isOpeningBalanceEdit) return "expense";
    const et = editTx.entry_type;
    if (et === "income" || et === "expense" || et === "transfer") return et;
    return editTx.type === "credit" ? "income" : "expense";
  }

  const [entryType, setEntryType] = useState<EntryType>(deriveEntryType);
  const [amount, setAmount] = useState(
    editTx ? String(Math.abs(Number(editTx.amount))) : ""
  );
  const [description, setDescription] = useState(editTx?.description ?? "");
  const [date, setDate] = useState(
    editTx?.date ?? new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState(editTx?.note ?? "");
  const [walletId, setWalletId] = useState(
    editTx?.wallet_id ?? defaultWalletId ?? wallets[0]?.id ?? ""
  );
  // For transfer edit: pre-fill to_wallet_id from the debit leg
  const [toWalletId, setToWalletId] = useState(
    editTx?.to_wallet_id ?? wallets[1]?.id ?? wallets[0]?.id ?? ""
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    editTx?.category_id ?? null
  );
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    editTx?.transaction_labels?.map((tl) => tl.label_id) ?? []
  );
  const [spendingType, setSpendingType] = useState<'need' | 'want' | null>(
    (editTx?.spending_type === 'need' || editTx?.spending_type === 'want')
      ? editTx.spending_type
      : null
  );

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  const router = useRouter();
  const amountRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  // Tracks whether a picker sheet is open so the Escape handler doesn't also close this modal
  const anyPickerOpenRef = useRef(false);
  anyPickerOpenRef.current = showCategoryPicker || showLabelPicker;

  useEffect(() => {
    amountRef.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !anyPickerOpenRef.current) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    async function fetchData() {
      const [{ data: cats }, { data: lbls }] = await Promise.all([
        supabase.from("categories").select("id, name, icon, type").order("name"),
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
            ? { transcript, mode: "transfer", walletNames: wallets.map((w) => w.name) }
            : { transcript, categories: categories.map((c) => c.name), wallets: wallets.map((w) => w.name) }
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        setParseError(data.message ?? data.error ?? "Parsing failed — please fill in manually");
        return;
      }

      if (data.amount != null) setAmount(String(data.amount));

      if (isTransferMode) {
        if (data.from_wallet) {
          const match = wallets.find((w) => w.name.toLowerCase() === data.from_wallet.toLowerCase());
          if (match) { setWalletId(match.id); setFromWalletUnmatched(false); }
          else setFromWalletUnmatched(true);
        }
        if (data.to_wallet) {
          const match = wallets.find((w) => w.name.toLowerCase() === data.to_wallet.toLowerCase());
          if (match) { setToWalletId(match.id); setToWalletUnmatched(false); }
          else setToWalletUnmatched(true);
        }
      } else {
        if (data.description) setDescription(data.description);
        if (data.note) setNote(data.note);
        if (data.date) setDate(data.date);
        if (data.entry_type && ["income", "expense", "transfer"].includes(data.entry_type)) {
          setEntryType(data.entry_type as EntryType);
        }
        const fromWalletName = data.from_wallet ?? data.wallet;
        if (fromWalletName) {
          const match = wallets.find((w) => w.name.toLowerCase() === fromWalletName.toLowerCase());
          if (match) setWalletId(match.id);
        }
        if (data.category) {
          const match = categories.find((c) => c.name.toLowerCase() === data.category.toLowerCase());
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
      if (!walletId || !toWalletId) { setError("Select both source and destination wallets."); return; }
      if (walletId === toWalletId) { setWalletMatchError("From and To wallets must be different."); return; }
    } else if (!isOpeningBalanceEdit && !description.trim()) {
      setError("Description is required.");
      return;
    }

    setError("");
    setLoading(true);

    // ── EDIT MODE ────────────────────────────────────────────────────────────
    if (isEditing && editTx) {
      const noteValue = note.trim() || null;

      if (isOpeningBalanceEdit) {
        // Opening balance: update amount, date, note only
        await supabase
          .from("transactions")
          .update({ amount: parsedAmount, date, note: noteValue })
          .eq("id", editTx.id);

      } else if (entryType === "transfer" && editTx.transfer_id) {
        // Update debit leg (current row)
        await supabase.from("transactions").update({
          amount: -parsedAmount,
          description: description.trim() || "Transfer",
          date,
          wallet_id: walletId,
          to_wallet_id: toWalletId,
          note: noteValue,
        }).eq("id", editTx.id);

        // Update credit leg via transfer_id
        await supabase.from("transactions").update({
          amount: parsedAmount,
          description: description.trim() || "Transfer",
          date,
          wallet_id: toWalletId,
          note: noteValue,
        }).eq("transfer_id", editTx.transfer_id).eq("type", "credit");

      } else {
        // Regular income / expense
        await supabase.from("transactions").update({
          amount: parsedAmount,
          description: description.trim(),
          date,
          wallet_id: walletId || null,
          category_id: categoryId || null,
          note: noteValue,
          spending_type: entryType === 'expense' ? spendingType : null,
        }).eq("id", editTx.id);

        // Re-assign labels: clear old + insert new
        await supabase.from("transaction_labels").delete().eq("transaction_id", editTx.id);
        if (selectedLabels.length > 0) {
          await supabase.from("transaction_labels").insert(
            selectedLabels.map((lid) => ({ transaction_id: editTx.id, label_id: lid }))
          );
        }
      }

      router.refresh();
      onCreated();
      return;
    }

    // ── CREATE MODE ──────────────────────────────────────────────────────────
    if (entryType === "transfer") {
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

    const res = await fetch("/api/tracker/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wallet_id: walletId || null,
        category_id: categoryId || null,
        amount: parsedAmount,
        description: description.trim(),
        date,
        entry_type: entryType,
        note: note.trim() || null,
        label_ids: selectedLabels,
        spending_type: entryType === 'expense' ? spendingType : null,
      }),
    });

    if (res.status === 402) {
      console.log("upgrade modal triggered");
      setShowUpgradeModal(true);
      setLoading(false);
      return;
    }

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to save — please try again."); setLoading(false); return; }

    router.refresh();
    onCreated();
  }

  const isTransfer = entryType === "transfer";

  // Filter categories by the selected entry type.
  // Falls back to showing all if a category's type field is null/missing.
  const visibleCategories = categories.filter((c) => {
    const ct = c.type ?? "both"; // safe fallback: show in all contexts
    if (entryType === "income")  return ct === "income"  || ct === "both";
    if (entryType === "expense") return ct === "expense" || ct === "both";
    return true;
  });

  const visibleLabels = labels.filter(
    (l) => !['need', 'needs', 'want', 'wants'].includes(l.name.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-lg bg-[#0F1E40] border border-white/15 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
          <h2 className="font-playfair text-xl font-semibold text-white">
            {isEditing
              ? isOpeningBalanceEdit
                ? "Edit Opening Balance"
                : "Edit Entry"
              : "New Entry"}
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

            {/* Entry Type Toggle — hidden for opening balance edit */}
            {!isOpeningBalanceEdit && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-2">Type</label>
                <div className="flex gap-1 bg-white/8 rounded-xl p-1">
                  {(["expense", "income", "transfer"] as EntryType[]).map((t) => {
                    const typeLabels = { expense: "Expense", income: "Income", transfer: "Transfer" };
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
                        onClick={() => { setEntryType(t); setError(""); }}
                        // Lock type when editing
                        disabled={isEditing}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                          entryType === t ? activeClass : "text-white/40 hover:text-white/60"
                        } disabled:cursor-default`}
                      >
                        {typeLabels[t]}
                      </button>
                    );
                  })}
                </div>
                {isEditing && (
                  <p className="text-xs text-white/25 mt-1.5">Entry type cannot be changed when editing.</p>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm font-medium select-none">₹</span>
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

            {/* Transfer: From + To Wallets */}
            {isTransfer && !isOpeningBalanceEdit && wallets.length >= 2 && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">From Wallet</label>
                  <select
                    value={walletId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWalletId(val);
                      setFromWalletUnmatched(false);
                      setWalletMatchError(val === toWalletId ? "From and To wallets must be different." : "");
                      setError("");
                    }}
                    className={`w-full bg-[#0F1E40] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition ${
                      fromWalletUnmatched ? "border-amber-400/60 focus:border-amber-400 focus:ring-amber-400/20" : "border-white/15 focus:border-white/40 focus:ring-white/20"
                    }`}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.emoji ?? ""} {w.name}</option>
                    ))}
                  </select>
                  {fromWalletUnmatched && <p className="mt-1 text-xs text-amber-400/80">Couldn't match — pick manually</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">To Wallet</label>
                  <select
                    value={toWalletId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setToWalletId(val);
                      setToWalletUnmatched(false);
                      setWalletMatchError(val === walletId ? "From and To wallets must be different." : "");
                      setError("");
                    }}
                    className={`w-full bg-[#0F1E40] border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 transition ${
                      toWalletUnmatched ? "border-amber-400/60 focus:border-amber-400 focus:ring-amber-400/20" : "border-white/15 focus:border-white/40 focus:ring-white/20"
                    }`}
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>{w.emoji ?? ""} {w.name}</option>
                    ))}
                  </select>
                  {toWalletUnmatched && <p className="mt-1 text-xs text-amber-400/80">Couldn't match — pick manually</p>}
                  {walletMatchError && <p className="mt-1.5 text-xs text-red-400/90">{walletMatchError}</p>}
                </div>
              </div>
            )}

            {isTransfer && !isOpeningBalanceEdit && wallets.length < 2 && (
              <p className="text-xs text-amber-400/80 bg-amber-400/8 border border-amber-400/15 rounded-lg px-3 py-2">
                You need at least 2 wallets to make a transfer.
              </p>
            )}

            {/* Description — hidden for opening balance edit */}
            {!isOpeningBalanceEdit && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Description{" "}
                  {!isTransfer && <span className="text-red-400">*</span>}
                  {isTransfer && <span className="text-white/25 font-normal">(optional)</span>}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError(""); }}
                  placeholder={isTransfer ? "e.g. Moving savings to mortgage" : "e.g. Lunch at Bombay Canteen"}
                  className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                />
              </div>
            )}

            {/* Voice input — only in create mode */}
            {!isEditing && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-white/50">
                    Voice Input <span className="text-white/25 font-normal">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowVoice((v) => !v)}
                    className={`flex items-center gap-1 text-xs rounded-lg px-2.5 py-1 transition ${
                      showVoice ? "bg-white/12 text-white/80" : "text-white/35 hover:text-white/60 hover:bg-white/8"
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
                  <p className="mt-2 text-xs text-amber-400/80 bg-amber-400/8 border border-amber-400/15 rounded-lg px-3 py-2">{parseError}</p>
                )}
                {voiceTranscript && !showVoice && !parsing && (
                  <div className="mt-2 relative">
                    <p className="text-xs text-white/25 mb-1">Voice input (raw)</p>
                    <div className="bg-white/6 border border-white/12 rounded-lg px-3 py-2 pr-8 text-sm text-white/55 leading-relaxed italic">
                      "{voiceTranscript}"
                    </div>
                    <button
                      type="button"
                      onClick={() => { setVoiceTranscript(""); setParseError(""); }}
                      className="absolute top-6 right-2 text-white/25 hover:text-white/60 transition text-xs"
                    >✕</button>
                  </div>
                )}
              </div>
            )}

            {/* Date + Wallet (income/expense) */}
            {!isTransfer && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition [color-scheme:dark]"
                  />
                </div>
                {!isOpeningBalanceEdit && (
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Wallet</label>
                    {wallets.length === 0 ? (
                      <p className="text-xs text-white/30 pt-2.5">No wallets yet</p>
                    ) : (
                      <select
                        value={walletId}
                        onChange={(e) => setWalletId(e.target.value)}
                        className="w-full bg-[#0F1E40] border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                      >
                        {wallets.map((w) => (
                          <option key={w.id} value={w.id}>{w.emoji ?? ""} {w.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Date for transfer */}
            {isTransfer && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition [color-scheme:dark]"
                />
              </div>
            )}

            {/* Category picker trigger — income/expense, non-opening-balance */}
            {!isTransfer && !isOpeningBalanceEdit && !dataLoading && visibleCategories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Category</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryPicker(true)}
                  className="w-full flex items-center justify-between bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm transition hover:border-white/30 min-h-[44px]"
                >
                  <span className={categoryId ? "text-white" : "text-white/30"}>
                    {categoryId
                      ? (() => {
                          const cat = visibleCategories.find((c) => c.id === categoryId);
                          return cat ? `${cat.icon ? cat.icon + " " : ""}${cat.name}` : "Select category";
                        })()
                      : "Select category"}
                  </span>
                  <svg className="w-4 h-4 text-white/30 flex-shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            {/* Spending Type — expense only */}
            {!isTransfer && !isOpeningBalanceEdit && entryType === 'expense' && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Spending Type <span className="text-white/25 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  {(['need', 'want'] as const).map((type) => {
                    const selected = spendingType === type;
                    const color = type === 'need' ? '#3B5998' : '#8B5CF6';
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSpendingType(selected ? null : type)}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg border transition"
                        style={{
                          backgroundColor: selected ? `${color}33` : 'transparent',
                          borderColor: selected ? color : 'rgba(255,255,255,0.15)',
                          color: selected ? color : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {type === 'need' ? 'Need' : 'Want'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Label picker trigger — income/expense, non-opening-balance */}
            {!isTransfer && !isOpeningBalanceEdit && !dataLoading && visibleLabels.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Labels <span className="text-white/25 font-normal">(multi-select)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLabelPicker(true)}
                  className="w-full flex items-center justify-between bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm transition hover:border-white/30 min-h-[44px]"
                >
                  {selectedLabels.length === 0 ? (
                    <span className="text-white/30">Select labels</span>
                  ) : (
                    <span className="flex flex-wrap gap-1.5">
                      {selectedLabels.map((id) => {
                        const lbl = visibleLabels.find((l) => l.id === id);
                        if (!lbl) return null;
                        return (
                          <span
                            key={id}
                            className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                            style={{ backgroundColor: lbl.color ?? "#2563EB" }}
                          >
                            {lbl.name}
                          </span>
                        );
                      })}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-white/30 flex-shrink-0 ml-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}

            {/* Note — all entry types */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Note <span className="text-white/25 font-normal">(optional)</span>
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
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
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
                ? isEditing ? "Saving..." : isTransfer ? "Transferring..." : "Saving..."
                : isEditing ? "Save Changes"
                : isTransfer ? "Transfer"
                : "Log Entry"}
            </button>
          </div>
        </form>
      </div>

      {showCategoryPicker && (
        <CategoryPickerSheet
          categories={visibleCategories}
          selectedId={categoryId}
          onSelect={setCategoryId}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}

      {showLabelPicker && (
        <LabelPickerSheet
          labels={visibleLabels}
          selectedIds={selectedLabels}
          onChange={setSelectedLabels}
          onClose={() => setShowLabelPicker(false)}
        />
      )}

      <UpgradeModal open={showUpgradeModal} />
    </div>
  );
}
