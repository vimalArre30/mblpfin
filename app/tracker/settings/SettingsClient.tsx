"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CategoryType = "income" | "expense" | "both";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  type: CategoryType | null;
  user_id: string | null;
};

type Label = {
  id: string;
  name: string;
  color: string | null;
  user_id: string | null;
};

const LABEL_COLORS = [
  "#2563EB",
  "#D97706",
  "#16A34A",
  "#7C3AED",
  "#DC2626",
  "#0891B2",
  "#EA580C",
  "#DB2777",
];

// ~55 financial / lifestyle emojis covering all common spend categories
const FINANCE_EMOJIS = [
  // Money & Banking
  "💰","💵","💳","🏦","💸","🤑","💹","📈","📊","🏧",
  // Food & Drink
  "🍔","🍕","🍜","🍣","☕","🍷","🥗","🍰","🛒","🥘",
  // Transport
  "🚗","✈️","⛽","🚌","🚂","🛵","🚲","🚕","🚢","🛺",
  // Home & Utilities
  "🏠","💡","💧","🔥","🔑","🛏️","🧹","📦","🪑","🔌",
  // Health & Wellness
  "💊","🏥","🧘","🏃","🩺","🧠","💉",
  // Entertainment & Lifestyle
  "🎬","🎮","🎵","📺","🎯","🎲","🎭","🎪","🏆",
  // Shopping & Personal
  "👗","👟","👜","🛍️","💍","🧴","💄",
  // Education & Work
  "📚","🎓","💻","📝","🖥️",
  // Travel & Leisure
  "🏖️","🏔️","🗺️","🏕️","🎡",
  // Savings & Goals
  "🐷","🔒","💎","🌿","🎁",
];

const MAX_LEN = 30;

// ─── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: CategoryType | string | null }) {
  const t = (type ?? "expense") as CategoryType;
  const styles: Record<CategoryType, string> = {
    income:  "bg-green-500/15 text-green-400 border border-green-500/20",
    expense: "bg-red-500/15 text-red-400 border border-red-500/20",
    both:    "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  };
  const labels: Record<CategoryType, string> = {
    income: "Income", expense: "Expense", both: "Both",
  };
  return (
    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0 ${styles[t] ?? styles.expense}`}>
      {labels[t] ?? "Expense"}
    </span>
  );
}

// ─── TypeToggle ───────────────────────────────────────────────────────────────

function TypeToggle({
  value,
  onChange,
}: {
  value: CategoryType;
  onChange: (v: CategoryType) => void;
}) {
  const active: Record<CategoryType, string> = {
    income:  "bg-green-500/20 text-green-300 border border-green-500/30",
    expense: "bg-red-500/20 text-red-300 border border-red-500/30",
    both:    "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  };
  const types: CategoryType[] = ["expense", "income", "both"];
  const typeLabels: Record<CategoryType, string> = {
    income: "Income", expense: "Expense", both: "Both",
  };
  return (
    <div className="flex gap-1 bg-white/8 rounded-lg p-0.5">
      {types.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
            value === t ? active[t] : "text-white/40 hover:text-white/60"
          }`}
        >
          {typeLabels[t]}
        </button>
      ))}
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────

function EmojiPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-10 bg-white/8 border border-white/12 rounded-lg text-xl flex items-center justify-center hover:bg-white/15 transition focus:outline-none focus:border-white/30"
        aria-label="Pick icon"
      >
        {value}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-12 left-0 z-20 bg-[#152040] border border-white/20 rounded-2xl p-3 shadow-2xl w-[272px]">
            <p className="text-xs text-white/30 mb-2 px-1">Pick an icon</p>
            <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
              {FINANCE_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { onChange(emoji); setOpen(false); }}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-white/15 transition ${
                    value === emoji ? "bg-white/20 ring-1 ring-white/30" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  initial,
  userId,
}: {
  initial: Category[];
  userId: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initial);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("💰");
  const [newType, setNewType] = useState<CategoryType>("expense");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  // Inline-edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<CategoryType>("expense");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(item: Category) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditType((item.type ?? "expense") as CategoryType);
    setEditError("");
  }

  async function saveEdit(id: string) {
    const name = editName.trim();
    if (!name) { setEditError("Name is required."); return; }
    if (name.length > MAX_LEN) { setEditError(`Max ${MAX_LEN} characters.`); return; }

    setSaving(true);
    const { error: dbErr } = await supabase
      .from("categories")
      .update({ name, type: editType })
      .eq("id", id);
    setSaving(false);

    if (dbErr) { setEditError(dbErr.message); return; }

    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, type: editType } : c))
    );
    setEditingId(null);
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (name.length > MAX_LEN) {
      setAddError(`Name must be ${MAX_LEN} characters or fewer.`);
      return;
    }
    if (items.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setAddError("A category with that name already exists.");
      return;
    }

    setAddError("");
    setAdding(true);

    const { data, error: dbErr } = await supabase
      .from("categories")
      .insert({ name, icon: newIcon, type: newType, user_id: userId })
      .select()
      .single();

    setAdding(false);

    if (dbErr) { setAddError(dbErr.message); return; }

    setItems((prev) => [...prev, data as Category]);
    setNewName("");
    setNewIcon("💰");
    setNewType("expense");
    nameRef.current?.focus();
  }

  async function handleDelete(item: Category) {
    if (
      !window.confirm(
        `Delete "${item.name}"?\n\nAny transactions using this category will lose their category link.`
      )
    )
      return;

    setDeletingId(item.id);
    const { error: dbErr } = await supabase
      .from("categories")
      .delete()
      .eq("id", item.id);
    setDeletingId(null);

    if (dbErr) { alert(`Could not delete: ${dbErr.message}`); return; }
    setItems((prev) => prev.filter((c) => c.id !== item.id));
  }

  const ownItems = items.filter((c) => c.user_id !== null);
  const systemItems = items.filter((c) => c.user_id === null);

  return (
    <SectionCard title="Categories" count={items.length}>
      {systemItems.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-white/25 uppercase tracking-wider mb-2">
            System defaults
          </p>
          {systemItems.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2">
              <span className="text-base w-6 text-center shrink-0 flex items-center justify-center">
                {c.icon ?? "📦"}
              </span>
              <span className="flex-1 text-sm text-white/80">{c.name}</span>
              <TypeBadge type={c.type} />
              <span className="text-xs text-white/20 bg-white/5 rounded px-1.5 py-0.5">
                system
              </span>
            </div>
          ))}
        </div>
      )}

      {ownItems.length > 0 && (
        <div className="mb-2">
          {systemItems.length > 0 && (
            <p className="text-xs text-white/25 uppercase tracking-wider mb-2 mt-4">
              Your categories
            </p>
          )}
          {ownItems.map((c) =>
            editingId === c.id ? (
              // ── Inline edit form ───────────────────────────────────────
              <div key={c.id} className="py-2 space-y-2 border-b border-white/8 last:border-0 mb-1">
                {editError && <p className="text-xs text-red-400">{editError}</p>}
                <input
                  value={editName}
                  onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
                  maxLength={MAX_LEN}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(c.id)}
                  className="w-full bg-white border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
                <TypeToggle value={editType} onChange={setEditType} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex-1 text-sm text-white/60 border border-white/15 rounded-lg py-1.5 hover:border-white/30 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveEdit(c.id)}
                    disabled={saving}
                    className="flex-1 text-sm bg-white text-navy-dark font-semibold rounded-lg py-1.5 hover:bg-white/90 disabled:opacity-50 transition"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              // ── Display row ────────────────────────────────────────────
              <div key={c.id} className="flex items-center gap-3 py-2 group">
                <span className="text-base w-6 text-center shrink-0 flex items-center justify-center">
                  {c.icon ?? "📦"}
                </span>
                <span className="flex-1 text-sm text-white/80">{c.name}</span>
                <TypeBadge type={c.type} />
                {/* Edit */}
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition text-white/30 hover:text-white/70 p-1 rounded"
                  aria-label={`Edit ${c.name}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  disabled={deletingId === c.id}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition text-white/30 hover:text-red-400 disabled:opacity-40 p-1 rounded"
                  aria-label={`Delete ${c.name}`}
                >
                  {deletingId === c.id ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            )
          )}
        </div>
      )}

      {ownItems.length === 0 && (
        <p className="text-sm text-white/30 py-2 mb-4">No custom categories yet.</p>
      )}

      {/* Add form */}
      <div className="border-t border-white/10 pt-4 mt-2 space-y-2">
        {addError && <p className="text-xs text-red-400">{addError}</p>}
        <div className="flex gap-2 items-center">
          <EmojiPicker value={newIcon} onChange={setNewIcon} />
          <input
            ref={nameRef}
            type="text"
            value={newName}
            maxLength={MAX_LEN}
            onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 bg-white border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="e.g. Farmstay Expenses"
          />
          <AddButton onClick={handleAdd} loading={adding} />
        </div>
        <TypeToggle value={newType} onChange={setNewType} />
        <p className="text-xs text-white/20 text-right">{newName.length}/{MAX_LEN}</p>
      </div>
    </SectionCard>
  );
}

// ─── Label Section ────────────────────────────────────────────────────────────

function LabelSection({
  initial,
  userId,
}: {
  initial: Label[];
  userId: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initial);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (name.length > MAX_LEN) {
      setError(`Name must be ${MAX_LEN} characters or fewer.`);
      return;
    }
    if (items.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
      setError("A label with that name already exists.");
      return;
    }

    setError("");
    setAdding(true);

    const { data, error: dbErr } = await supabase
      .from("labels")
      .insert({ name, color: newColor, user_id: userId })
      .select()
      .single();

    setAdding(false);

    if (dbErr) { setError(dbErr.message); return; }

    setItems((prev) => [...prev, data as Label]);
    setNewName("");
    nameRef.current?.focus();
  }

  async function handleDelete(item: Label) {
    if (!window.confirm(`Delete label "${item.name}"?`)) return;

    setDeletingId(item.id);
    const { error: dbErr } = await supabase
      .from("labels")
      .delete()
      .eq("id", item.id);
    setDeletingId(null);

    if (dbErr) { alert(`Could not delete: ${dbErr.message}`); return; }
    setItems((prev) => prev.filter((l) => l.id !== item.id));
  }

  const ownItems = items.filter((l) => l.user_id !== null);
  const systemItems = items.filter((l) => l.user_id === null);

  return (
    <SectionCard title="Labels" count={items.length}>
      {systemItems.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-white/25 uppercase tracking-wider mb-2">
            System defaults
          </p>
          {systemItems.map((l) => (
            <ItemRow
              key={l.id}
              icon={
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color ?? "#666" }} />
              }
              name={l.name}
              system
            />
          ))}
        </div>
      )}

      {ownItems.length > 0 && (
        <div className="mb-2">
          {systemItems.length > 0 && (
            <p className="text-xs text-white/25 uppercase tracking-wider mb-2 mt-4">
              Your labels
            </p>
          )}
          {ownItems.map((l) => (
            <ItemRow
              key={l.id}
              icon={
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color ?? "#666" }} />
              }
              name={l.name}
              onDelete={() => handleDelete(l)}
              deleting={deletingId === l.id}
            />
          ))}
        </div>
      )}

      {ownItems.length === 0 && (
        <p className="text-sm text-white/30 py-2 mb-4">No custom labels yet.</p>
      )}

      {/* Add form */}
      <div className="border-t border-white/10 pt-4 mt-2 space-y-3">
        {error && <p className="text-xs text-red-400">{error}</p>}

        <div>
          <p className="text-xs text-white/30 mb-2">Color</p>
          <div className="flex gap-2 flex-wrap">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`w-6 h-6 rounded-full transition ${
                  newColor === c
                    ? "ring-2 ring-white/60 ring-offset-1 ring-offset-navy-dark"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            ref={nameRef}
            type="text"
            value={newName}
            maxLength={MAX_LEN}
            onChange={(e) => { setNewName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 bg-white border border-white/20 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40"
            placeholder="e.g. Recurring"
          />
          <AddButton onClick={handleAdd} loading={adding} />
        </div>
        <p className="text-xs text-white/20 text-right">{newName.length}/{MAX_LEN}</p>
      </div>
    </SectionCard>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-playfair text-lg font-semibold text-white">{title}</h2>
        <span className="text-xs text-white/30 bg-white/8 rounded-full px-2.5 py-0.5">{count}</span>
      </div>
      {children}
    </div>
  );
}

function ItemRow({
  icon,
  name,
  system,
  onDelete,
  deleting,
}: {
  icon: React.ReactNode | string;
  name: string;
  system?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 group">
      <span className="text-base w-6 text-center shrink-0 flex items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 text-sm text-white/80">{name}</span>
      {system ? (
        <span className="text-xs text-white/20 bg-white/5 rounded px-1.5 py-0.5">system</span>
      ) : onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition text-white/30 hover:text-red-400 disabled:opacity-40 p-1 rounded"
          aria-label={`Delete ${name}`}
        >
          {deleting ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ) : null}
    </div>
  );
}

function AddButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="shrink-0 bg-white text-navy-dark font-semibold text-sm rounded-lg px-4 py-2 hover:bg-white/90 transition disabled:opacity-50"
    >
      {loading ? "…" : "Add"}
    </button>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function SettingsClient({
  initialCategories,
  initialLabels,
  userId,
}: {
  initialCategories: Category[];
  initialLabels: Label[];
  userId: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <CategorySection initial={initialCategories} userId={userId} />
      <LabelSection initial={initialLabels} userId={userId} />
    </div>
  );
}
