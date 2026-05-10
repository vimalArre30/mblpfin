import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Delete your account | MBL PFin",
  description:
    "How to request deletion of your MBL PFin (MrBottomLine) account and all associated data. Steps, what's deleted, what's kept.",
  metadataBase: new URL(BRAND.url),
  alternates: { canonical: `${BRAND.url}/delete-account` },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "10 May 2026";

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-[#0F1E40] font-inter text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        {/* Hero */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition mb-6"
          >
            <span aria-hidden>←</span> Back to Home
          </Link>
          <h1 className="font-playfair text-3xl sm:text-4xl font-bold text-white mb-3">
            Delete your account
          </h1>
          <p className="text-white/50 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Intro */}
        <Section>
          <p className="text-white/75 leading-relaxed">
            This page explains how to request deletion of your{" "}
            <span className="text-white">MBL PFin</span> account (the Android
            app published by MrBottomLine on Google Play) and all data
            associated with it. We process every deletion request manually and
            confirm by email within 7 business days.
          </p>
          <p className="text-white/75 leading-relaxed">
            If you only want to remove specific transactions or wallets without
            deleting your whole account, you can do that yourself from the app —
            no need to contact us.
          </p>
        </Section>

        {/* How to request deletion */}
        <Section title="1. How to request account deletion">
          <p>
            Send an email from the address you have access to (it doesn&apos;t
            need to match anything we have on file) with the following:
          </p>
          <ul className="space-y-2 list-disc list-outside ml-5 marker:text-white/30">
            <li>
              <span className="text-white">To:</span>{" "}
              <Link
                href="mailto:hello@mrbottomline.club?subject=Delete%20my%20MBL%20PFin%20account"
                className="underline decoration-amber-400/50 hover:decoration-amber-400 text-white"
              >
                hello@mrbottomline.club
              </Link>
            </li>
            <li>
              <span className="text-white">Subject:</span> Delete my MBL PFin
              account
            </li>
            <li>
              <span className="text-white">Body:</span> the phone number you
              signed up with (in international format, e.g.{" "}
              <span className="text-white">+91 98XXX XXXXX</span>), and a brief
              confirmation that you want the account permanently deleted.
            </li>
          </ul>
          <p>
            We will reply within 7 business days confirming the deletion. You
            don&apos;t need to send any sensitive information (no passwords, no
            OTP codes, no payment details).
          </p>
        </Section>

        {/* What gets deleted */}
        <Section title="2. What data is deleted">
          <p>
            On confirmation, the following is permanently removed from our
            active database within 30 days:
          </p>
          <ul className="space-y-2 list-disc list-outside ml-5 marker:text-white/30">
            <li>
              Your <span className="text-white">user profile</span> — phone
              number, name, username, bio.
            </li>
            <li>
              Every <span className="text-white">transaction</span> you logged
              (income, expense, transfer, opening balance).
            </li>
            <li>
              Every <span className="text-white">wallet</span>,{" "}
              <span className="text-white">category</span>, and{" "}
              <span className="text-white">label</span> you created.
            </li>
            <li>
              Every <span className="text-white">voice transcript</span> sent
              for AI parsing (these are already not stored long-term — Anthropic
              processes them and discards; nothing about them is retained on our
              side once parsing returns).
            </li>
            <li>
              Your <span className="text-white">Pro subscription</span> — if
              active, it is cancelled at the next billing cycle (no further
              charges).
            </li>
            <li>
              Authentication records (Supabase Auth user) — your phone number
              cannot log in to MBL PFin again unless you create a new account.
            </li>
          </ul>
          <p>
            All database backups containing your data are purged within 90 days
            of the active-database deletion.
          </p>
        </Section>

        {/* What is kept */}
        <Section title="3. What data is retained, and for how long">
          <p>
            A small amount of data must be retained for legal and compliance
            reasons even after account deletion:
          </p>
          <ul className="space-y-2 list-disc list-outside ml-5 marker:text-white/30">
            <li>
              <span className="text-white">Payment records</span> (subscription
              invoices, refund records) — retained for{" "}
              <span className="text-white">7 years</span> by Razorpay and by us
              for Indian tax and audit compliance. These records contain your
              name and amount only — no transaction-level financial data.
            </li>
            <li>
              <span className="text-white">Anonymised aggregate metrics</span> —
              counts like &ldquo;total active users in May 2026&rdquo; that
              cannot be linked back to any individual user. Retained
              indefinitely for product analytics.
            </li>
            <li>
              <span className="text-white">Email correspondence</span> with
              hello@mrbottomline.club regarding your deletion request — retained
              for up to 12 months for support/audit reference.
            </li>
          </ul>
        </Section>

        {/* Self-serve alternatives */}
        <Section title="4. Self-serve alternatives (no email needed)">
          <p>
            If you only want partial control over your data, you can do the
            following yourself from inside the app — no deletion request
            needed:
          </p>
          <ul className="space-y-2 list-disc list-outside ml-5 marker:text-white/30">
            <li>
              <span className="text-white">Export</span> your transactions —
              available from the dashboard.
            </li>
            <li>
              <span className="text-white">Delete individual transactions</span>
              {" "}— swipe left on any row in the transactions list.
            </li>
            <li>
              <span className="text-white">Delete wallets, categories, or
              labels</span> — from the Settings screen.
            </li>
            <li>
              <span className="text-white">Cancel your Pro subscription</span>
              {" "}— from the Pro page (web), 3-step cancel flow.
            </li>
          </ul>
        </Section>

        {/* Contact */}
        <Section title="5. Contact">
          <p>
            For account deletion requests or any privacy-related question, email{" "}
            <Link
              href="mailto:hello@mrbottomline.club"
              className="underline decoration-amber-400/50 hover:decoration-amber-400 text-white"
            >
              hello@mrbottomline.club
            </Link>
            .
          </p>
          <p className="text-white/50 text-sm">
            Operator: MrBottomLine, India. App: MBL PFin
            (package <span className="text-white">club.mblpfin</span>) on Google
            Play. See also our{" "}
            <Link
              href="/privacy"
              className="underline decoration-amber-400/50 hover:decoration-amber-400 text-white"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </Section>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition"
          >
            <span aria-hidden>←</span> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 text-white/75 leading-relaxed">
      {title && (
        <h2 className="font-playfair text-xl sm:text-2xl font-semibold text-white">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
