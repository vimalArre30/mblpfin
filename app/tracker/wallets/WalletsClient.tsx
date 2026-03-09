"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CreateWalletModal, {
  type Wallet,
} from "@/components/tracker/CreateWalletModal";
import SignOutButton from "@/app/tracker/dashboard/SignOutButton";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
    </svg>
  );
}

function WalletCard({
  wallet,
  onDelete,
  isDeleting,
}: {
  wallet: Wallet;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = wallet.color ?? "#2563EB";

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/tracker/wallets/${wallet.id}`}
        className="block bg-white/5 border border-white/10 rounded-xl p-5 transition-colors hover:bg-white/[0.08]"
        style={{ borderLeft: `4px solid ${accent}` }}
      >
        <div className="text-3xl mb-3 leading-none">{wallet.emoji ?? "💼"}</div>
        <p className="font-semibold text-white text-base leading-snug">
          {wallet.name}
        </p>
        <p className="text-xs text-white/30 mt-1">View transactions →</p>
      </Link>

      {/* Delete button — visible on hover or while deleting */}
      {(hovered || isDeleting) && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
          disabled={isDeleting}
          className="absolute top-3 right-3 text-white/30 hover:text-red-400 transition disabled:opacity-50"
          aria-label={`Delete ${wallet.name}`}
        >
          {isDeleting ? (
            <SpinnerIcon className="w-4 h-4 animate-spin" />
          ) : (
            <TrashIcon className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

export default function WalletsClient({
  initialWallets,
  userEmail,
}: {
  initialWallets: Wallet[];
  userEmail: string;
}) {
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  async function handleDelete(wallet: Wallet) {
    const confirmed = window.confirm(
      `Delete "${wallet.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(wallet.id);
    const { error } = await supabase
      .from("wallets")
      .delete()
      .eq("id", wallet.id);

    if (!error) {
      setWallets((prev) => prev.filter((w) => w.id !== wallet.id));
    }
    setDeletingId(null);
  }

  function handleCreated(wallet: Wallet) {
    setWallets((prev) => [...prev, wallet]);
    setShowModal(false);
  }

  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-playfair text-lg font-semibold text-white tracking-tight">
            Mr. Bottom Line
          </span>
          <span className="text-white/25 text-sm">/</span>
          <Link
            href="/tracker/dashboard"
            className="text-white/60 text-sm hover:text-white/90 transition"
          >
            Dashboard
          </Link>
          <span className="text-white/25 text-sm">/</span>
          <span className="text-white/90 text-sm">Wallets</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/35 hidden sm:block">
            {userEmail}
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-content mx-auto px-6 py-12">
        {/* Page title + action */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-white">
              Wallets
            </h1>
            <p className="mt-1.5 text-white/45 text-sm">
              {wallets.length === 0
                ? "No wallets yet"
                : `${wallets.length} wallet${wallets.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-navy-dark text-sm font-semibold rounded-xl px-5 py-2.5 hover:bg-white/90 transition"
          >
            <span className="text-base leading-none">+</span> New Wallet
          </button>
        </div>

        {/* Empty state */}
        {wallets.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-5">👛</div>
            <h2 className="font-playfair text-xl font-semibold text-white mb-2">
              No wallets yet
            </h2>
            <p className="text-white/40 text-sm mb-6 max-w-xs mx-auto">
              Create your first wallet to start tracking where your money lives.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-navy-dark text-sm font-semibold rounded-xl px-6 py-2.5 hover:bg-white/90 transition"
            >
              + New Wallet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                onDelete={() => handleDelete(wallet)}
                isDeleting={deletingId === wallet.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showModal && (
        <CreateWalletModal
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
