"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const [emoji, setEmoji] = useState("💰");
  const [color, setColor] = useState(PRESET_COLORS[0]);
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
      .insert({ user_id: user.id, name: trimmed, emoji: emoji.trim() || null, color })
      .select()
      .single();

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    onCreated(data as Wallet);
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

          {/* Emoji */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Emoji
            </label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="💰"
              className="w-24 bg-white/10 border border-white/15 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition text-center"
            />
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
            <span className="text-2xl">{emoji || "💼"}</span>
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
