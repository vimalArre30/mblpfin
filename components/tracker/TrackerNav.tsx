"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/tracker/dashboard", label: "Dashboard" },
  { href: "/tracker/transactions", label: "Transactions" },
  { href: "/tracker/wallets", label: "Wallets" },
  { href: "/tracker/analytics", label: "Analytics" },
  { href: "/tracker/settings", label: "Settings" },
];

export default function TrackerNav() {
  const pathname = usePathname();
  const proActive = pathname === "/pro";

  return (
    <nav className="border-b border-white/8 px-6 py-0 flex items-center gap-1 overflow-x-auto">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`relative shrink-0 px-3 py-3.5 text-sm font-medium transition whitespace-nowrap ${
              active
                ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white"
                : "text-white/45 hover:text-white/75"
            }`}
          >
            {label}
          </Link>
        );
      })}

      {/* Pro link — right-aligned, amber accent so it stands out from the main nav */}
      <div className="ml-auto pr-1 shrink-0">
        <Link
          href="/pro"
          className={`relative inline-flex items-center gap-1.5 px-3 py-3.5 text-sm font-semibold transition whitespace-nowrap ${
            proActive
              ? "text-amber-300 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-400"
              : "text-amber-400/85 hover:text-amber-300"
          }`}
          aria-label="Manage your MBL PFin Pro subscription"
        >
          <span aria-hidden>★</span> Pro
        </Link>
      </div>
    </nav>
  );
}
