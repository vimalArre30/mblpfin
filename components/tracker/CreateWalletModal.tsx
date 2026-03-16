"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VoiceRecorder from "./VoiceRecorder";

const EMOJI_OPTIONS = [
  "💰", "💳", "🏦", "💵", "🛒", "🍔", "✈️", "🏠",
  "💊", "📱", "🎮", "👗", "📚", "🚗", "⚡", "🎵",
  "🏋️", "🛍️", "🎁", "🍕",
];

const PRESET_COLORS = [
  "#2563EB", // Blue
  "#16A34A", // Green
  "#D97706", // Amber
  "#DC2626", // Red
  "#7C3AED", // Purple
  "#0891B2", // Cyan
  "#EA580C", // Orange
  "#DB2777", // Pink
];

export type Wallet = {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  created_at: string;
};

export default function CreateWalletModal({
  onCreated,
  onClose,
}: {
  onCreated: (wallet: Wallet) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [openingBalance, setOpeningBalance] = useState("");
  const [openingBalanceDate, setOpeningBalanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [openingBalanceNote, setOpeningBalanceNote] = useState("");
  const [showVoice, setShowVoice] = useState(false);
  const [voiceParsing, setVoiceParsing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    nameRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleVoiceTranscript(transcript: string) {
    setShowVoice(false);
    setVoiceParsing(true);
    try {
      const res = await fetch("/api/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, mode: "opening_balance" }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.amount != null) setOpeningBalance(String(data.amount));
        if (data.date) setOpeningBalanceDate(data.date);
        if (data.note != null) setOpeningBalanceNote(data.note);
      } else {
        setError(data.message ?? data.error ?? "Voice parsing failed.");
      }
    } catch {
      setError("Voice parsing failed. Please try again.");
    } finally {
      setVoiceParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Wallet name is required.");
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

    const { data, error: dbError } = await supabase
      .from("wallets")
      .insert({ user_id: user.id, name: trimmed, emoji: emoji ?? null, color })
      .select()
      .single();

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    const wallet = data as Wallet;

    // Insert opening balance transaction if provided
    const parsedBalance = parseFloat(openingBalance);
    if (!isNaN(parsedBalance) && parsedBalance > 0) {
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        wallet_id: wallet.id,
        amount: parsedBalance,
        description: "Opening Balance",
        entry_type: "income",
        type: "credit",
        is_opening_balance: true,
        date: openingBalanceDate,
        note: openingBalanceNote.trim() || null,
        category_id: null,
        label_id: null,
      });
      if (txError) {
        setError(`Wallet created but opening balance failed: ${txError.message}`);
        setLoading(false);
        // Still call onCreated so the wallet appears — the balance insert failed but the wallet exists
        onCreated(wallet);
        return;
      }
    }

    onCreated(wallet);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-navy-dark border border-white/15 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-xl font-semibold text-white">
            New Wallet
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition text-lg leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Wallet Name <span className="text-red-400">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Salary, Wealth, Mortgage"
              className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
            />
          </div>

          {/* Opening Balance + As of Date */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  Opening Balance{" "}
                  <span className="text-white/25 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 text-sm select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/10 border border-white/15 rounded-lg pl-8 pr-9 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVoice((v) => !v)}
                    title="Voice input"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition text-base leading-none"
                    aria-label="Voice input for opening balance"
                  >
                    🎙️
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">
                  As of Date
                </label>
                <input
                  type="date"
                  value={openingBalanceDate}
                  onChange={(e) => setOpeningBalanceDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Note{" "}
                <span className="text-white/25 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={openingBalanceNote}
                onChange={(e) => setOpeningBalanceNote(e.target.value)}
                placeholder="e.g. savings account start"
                className="w-full bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition"
              />
            </div>

            {/* Voice recorder */}
            {voiceParsing && (
              <p className="text-xs text-white/40 animate-pulse">Parsing voice…</p>
            )}
            {showVoice && !voiceParsing && (
              <VoiceRecorder onUse={handleVoiceTranscript} />
            )}
          </div>

          {/* Emoji grid picker */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              Emoji{" "}
              <span className="text-white/25 font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(emoji === e ? null : e)}
                  className={`w-8 h-8 text-base flex items-center justify-center rounded-lg transition ${
                    emoji === e
                      ? "bg-white/20 ring-2 ring-white/60"
                      : "hover:bg-white/10"
                  }`}
                  aria-label={e}
                  aria-pressed={emoji === e}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color swatches */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid #fff` : "none",
                    outlineOffset: "2px",
                  }}
                  aria-label={`Select color ${c}`}
                  aria-pressed={color === c}
                />
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3"
            style={{ borderLeft: `4px solid ${color}` }}
          >
            <span className="text-2xl">{emoji ?? "💼"}</span>
            <span className="text-white font-medium text-sm">
              {name.trim() || "Wallet preview"}
            </span>
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
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
              className="flex-1 bg-white text-navy-dark text-sm font-semibold rounded-xl py-2.5 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Creating…" : "Create Wallet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
