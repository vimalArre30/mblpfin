import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./SignOutButton";

export const metadata = {
  title: "Dashboard — MrBottomLine Tracker",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Belt-and-suspenders check (middleware is the primary guard)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/tracker/login");

  // Fetch this user's categories so we can show a count
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", user.id);

  return (
    <div className="min-h-screen bg-navy-dark font-inter">
      {/* Top bar */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-playfair text-lg font-semibold text-white tracking-tight">
            Mr. Bottom Line
          </span>
          <span className="text-white/25 text-sm">/</span>
          <span className="text-white/60 text-sm">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/35 hidden sm:block">
            {user.email ?? user.phone ?? "Your account"}
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* Body */}
      <main className="max-w-content mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="font-playfair text-3xl font-bold text-white">
            Your Tracker
          </h1>
          <p className="mt-2 text-white/45 text-base">
            Session active for{" "}
            <span className="text-white/70">
              {user.email ?? user.phone ?? "your account"}
            </span>
          </p>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <StatusCard
            label="Auth"
            value="Active"
            detail="Session via Supabase"
            ok
          />
          <StatusCard
            label="Categories"
            value={String(categories?.length ?? 0)}
            detail="Seeded on sign-up"
            ok={(categories?.length ?? 0) > 0}
          />
          <StatusCard
            label="Wallets"
            value="Manage"
            detail="Create and delete wallets"
            ok
            href="/tracker/wallets"
          />
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuickNavCard
            emoji="👛"
            title="Wallets"
            description="Create and manage your money buckets — Salary, Savings, and more."
            href="/tracker/wallets"
            cta="Open Wallets"
          />
          <QuickNavCard
            emoji="🏗️"
            title="Transactions"
            description="Log income and expenses against your wallets. Coming soon."
            href="#"
            cta="Coming soon"
            disabled
          />
        </div>
      </main>
    </div>
  );
}

function StatusCard({
  label,
  value,
  detail,
  ok,
  pending,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  ok: boolean;
  pending?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`w-2 h-2 rounded-full ${
            pending
              ? "bg-yellow-400/60"
              : ok
              ? "bg-green-400"
              : "bg-red-400/60"
          }`}
        />
      </div>
      <p className="text-white font-semibold text-lg">{value}</p>
      <p className="text-white/35 text-xs mt-0.5">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.08] transition"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">{inner}</div>
  );
}

function QuickNavCard({
  emoji,
  title,
  description,
  href,
  cta,
  disabled,
}: {
  emoji: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  disabled?: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
      <div className="text-3xl mb-4">{emoji}</div>
      <h3 className="font-playfair text-lg font-semibold text-white mb-1">
        {title}
      </h3>
      <p className="text-white/40 text-sm mb-5">{description}</p>
      {disabled ? (
        <span className="inline-block text-sm text-white/25 border border-white/10 rounded-xl px-4 py-2 cursor-not-allowed">
          {cta}
        </span>
      ) : (
        <Link
          href={href}
          className="inline-block text-sm font-semibold text-navy-dark bg-white rounded-xl px-4 py-2 hover:bg-white/90 transition"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
