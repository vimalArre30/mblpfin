"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  icon: string | null;
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

const MAX_LEN = 30;

// ─── Category Section ────────────────────────────────────────────────────────

function CategorySection({
  initial,
  userId,
}: {
  initial: Category[];
  userId: string;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initial);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
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
    if (
      items.some((c) => c.name.toLowerCase() === name.toLowerCase())
    ) {
      setError("A category with that name already exists.");
      return;
    }

    setError("");
    setAdding(true);

    const { data, error: dbErr } = await supabase
      .from("categories")
      .insert({ name, icon: newIcon.trim() || "📦", user_id: userId })
      .select()
      .single();

    setAdding(false);

    if (dbErr) {
      setError(dbErr.message);
      return;
    }

    setItems((prev) => [...prev, data as Category]);
    setNewName("");
    setNewIcon("📦");
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

    // Check if transactions exist (soft warning already shown above)
    const { error: dbErr } = await supabase
      .from("categories")
      .delete()
      .eq("id", item.id);

    setDeletingId(null);

    if (dbErr) {
      alert(`Could not delete: ${dbErr.message}`);
      return;
    }

    setItems((prev) => prev.filter((c) => c.id !== item.id));
  }

  const ownItems = items.filter((c) => c.user_id !== null);
  const systemItems = items.filter((c) => c.user_id === null);

  return (
    <SectionCard title="Categories" count={items.length}>
      {/* System items */}
      {systemItems.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-white/25 uppercase tracking-wider mb-2">
            System defaults
          </p>
          {systemItems.map((c) => (
            <ItemRow key={c.id} icon={c.icon ?? "📦"} name={c.name} system />
          ))}
        </div>
      )}

      {/* User items */}
      {ownItems.length > 0 && (
        <div className="mb-2">
          {systemItems.length > 0 && (
            <p className="text-xs text-white/25 uppercase tracking-wider mb-2 mt-4">
              Your categories
            </p>
          )}
          {ownItems.map((c) => (
            <ItemRow
              key={c.id}
              icon={c.icon ?? "📦"}
              name={c.name}
              onDelete={() => handleDelete(c)}
              deleting={deletingId === c.id}
            />
          ))}
        </div>
      )}

      {ownItems.length === 0 && (
        <p className="text-sm text-white/30 py-2 mb-4">
          No custom categories yet.
        </p>
      )}

      {/* Add form */}
      <div className="border-t border-white/10 pt-4 mt-2 space-y-2">
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value.slice(0, 2))}
            className="w-12 bg-white/8 border border-white/12 rounded-lg px-2 py-2 text-center text-lg focus:outline-none focus:border-white/30"
            placeholder="📦"
            aria-label="Category icon"
          />
          <input
            ref={nameRef}
            type="text"
            value={newName}
            maxLength={MAX_LEN}
            onChange={(e) => {
              setNewName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 bg-white/8 border border-white/12 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30"
            placeholder="e.g. Farmstay Expenses"
          />
          <AddButton onClick={handleAdd} loading={adding} />
        </div>
        <p className="text-xs text-white/20 text-right">
          {newName.length}/{MAX_LEN}
        </p>
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

    if (dbErr) {
      setError(dbErr.message);
      return;
    }

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

    if (dbErr) {
      alert(`Could not delete: ${dbErr.message}`);
      return;
    }

    setItems((prev) => prev.filter((l) => l.id !== item.id));
  }

  const ownItems = items.filter((l) => l.user_id !== null);
  const systemItems = items.filter((l) => l.user_id === null);

  return (
    <SectionCard title="Labels" count={items.length}>
      {/* System labels */}
      {systemItems.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-white/25 uppercase tracking-wider mb-2">
            System defaults
          </p>
          {systemItems.map((l) => (
            <ItemRow
              key={l.id}
              icon={
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: l.color ?? "#666" }}
                />
              }
              name={l.name}
              system
            />
          ))}
        </div>
      )}

      {/* User labels */}
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
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: l.color ?? "#666" }}
                />
              }
              name={l.name}
              onDelete={() => handleDelete(l)}
              deleting={deletingId === l.id}
            />
          ))}
        </div>
      )}

      {ownItems.length === 0 && (
        <p className="text-sm text-white/30 py-2 mb-4">
          No custom labels yet.
        </p>
      )}

      {/* Add form */}
      <div className="border-t border-white/10 pt-4 mt-2 space-y-3">
        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Color swatches */}
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
            onChange={(e) => {
              setNewName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 bg-white/8 border border-white/12 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30"
            placeholder="e.g. Recurring"
          />
          <AddButton onClick={handleAdd} loading={adding} />
        </div>
        <p className="text-xs text-white/20 text-right">
          {newName.length}/{MAX_LEN}
        </p>
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
        <h2 className="font-playfair text-lg font-semibold text-white">
          {title}
        </h2>
        <span className="text-xs text-white/30 bg-white/8 rounded-full px-2.5 py-0.5">
          {count}
        </span>
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
        <span className="text-xs text-white/20 bg-white/5 rounded px-1.5 py-0.5">
          system
        </span>
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

function AddButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
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
