"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddEntryModal from "@/components/tracker/AddEntryModal";
import type { Wallet } from "@/components/tracker/CreateWalletModal";

export default function WalletDetailFAB({
  defaultWalletId,
  wallets,
}: {
  defaultWalletId: string;
  wallets: Wallet[];
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  function handleCreated() {
    setShowModal(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="sm:hidden fixed bottom-6 right-5 z-40 flex items-center gap-2 bg-white text-navy-dark font-semibold text-sm rounded-2xl px-5 py-3 shadow-lg shadow-black/40 hover:bg-white/90 transition"
        aria-label="Add Entry"
      >
        <span className="text-lg leading-none">+</span> Add Entry
      </button>

      {showModal && (
        <AddEntryModal
          wallets={wallets}
          defaultWalletId={defaultWalletId}
          onCreated={handleCreated}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
