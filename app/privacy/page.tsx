import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy | Mr. Bottom Line",
  description:
    "How MrBottomLine handles your data — what we collect, how we store it, who we share it with, and how to delete it.",
  metadataBase: new URL(BRAND.url),
  alternates: { canonical: `${BRAND.url}/privacy` },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "2 May 2026";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-white/50 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* Intro */}
        <Section>
          <p className="text-white/75 leading-relaxed">
            MrBottomLine (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the
            website <span className="text-white">mrbottomline.club</span> and the
            MrBottomLine Tracker mobile app (collectively, the &ldquo;Service&rdquo;).
            This page explains what personal data we collect, why we collect it,
            how we store it, who we share it with, and how you can request its
            deletion.
          </p>
          <p className="text-white/75 leading-relaxed">
            By using the Service, you agree to the collection and use of
            information in accordance with this policy.
          </p>
        </Section>

        {/* What we collect */}
        <Section title="1. Information we collect">
          <H3>Account information</H3>
          <p>
            When you sign up, we collect your phone number (for OTP-based
            authentication via Supabase Auth) and optionally a name, username,
            and short bio if you choose to add them on your profile screen.
          </p>

          <H3>Financial transaction data you enter</H3>
          <p>
            The Service is an expense tracker. We store the transactions you log
            — including amount, date, description, category, wallet, optional
            note, and labels — in our database. We never connect to your bank
            account; everything is entered manually by you (typed or via voice
            input).
          </p>

          <H3>Voice and AI input</H3>
          <p>
            If you use the voice-input feature, your spoken text is transcribed
            on-device and the transcript is sent to Anthropic&apos;s Claude API
            for parsing into a structured transaction. Audio is not stored. The
            transcript is sent only to extract transaction fields; we do not
            retain it for training purposes.
          </p>
          <p>
            If you use the AI insights feature on the dashboard, an aggregated
            summary of your recent spending is sent to Anthropic&apos;s Claude
            API to generate a one-paragraph insight. The summary contains
            category totals and date ranges — never raw transaction text.
          </p>

          <H3>Subscription &amp; payment information</H3>
          <p>
            If you subscribe to MrBottomLine Pro, payment is processed by{" "}
            <Link
              href="https://razorpay.com/privacy/"
              className="underline decoration-amber-400/50 hover:decoration-amber-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              Razorpay
            </Link>
            , an Indian payment gateway. We do not see, store, or process your
            card or UPI details. We store only the Razorpay subscription ID,
            your plan tier (free or pro), the renewal date, and whether you
            have cancelled or applied a loyalty discount — so we can show your
            subscription state on your Pro page.
          </p>

          <H3>Technical &amp; usage data</H3>
          <p>
            We log standard server logs (IP address, user agent, request path,
            response time) for debugging and abuse prevention. These logs are
            retained for up to 30 days. We do not run third-party analytics or
            advertising trackers on the Service.
          </p>
        </Section>

        {/* How we use */}
        <Section title="2. How we use your data">
          <ul className="space-y-2 list-disc list-outside ml-5 marker:text-white/30">
            <li>To operate the Service: render your dashboard, save your transactions, and apply paywall logic.</li>
            <li>To process subscriptions: communicate with Razorpay to start, renew, cancel, or refund Pro plans.</li>
            <li>To provide voice and AI features: send transcripts and summaries to Anthropic&apos;s Claude API as described above.</li>
            <li>To send essential service emails: payment receipts, subscription expiry warnings, and security alerts.</li>
            <li>To debug and improve reliability: server logs, error reports.</li>
          </ul>
          <p>
            We do not sell or rent your personal data. We do not use your data
            to train any AI model.
          </p>
        </Section>

        {/* Sharing */}
        <Section title="3. Who we share data with">
          <p>The Service relies on a small number of trusted infrastructure providers:</p>
          <ul className="space-y-2 list-disc list-outside ml-5 marker:text-white/30">
            <li>
              <strong className="text-white">Supabase</strong> — database and authentication.
              All transaction data and user profiles are stored here in encrypted form.
            </li>
            <li>
              <strong className="text-white">Vercel</strong> — application hosting for the website
              and API.
            </li>
            <li>
              <strong className="text-white">Razorpay</strong> — payment processing for Pro
              subscriptions. Razorpay receives the data needed to process your
              payment per their{" "}
              <Link
                href="https://razorpay.com/privacy/"
                className="underline decoration-amber-400/50 hover:decoration-amber-400 text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                privacy policy
              </Link>
              .
            </li>
            <li>
              <strong className="text-white">Anthropic</strong> — only for the voice and AI insights
              features described above. Anthropic does not train on data sent
              via API. See{" "}
              <Link
                href="https://www.anthropic.com/legal/privacy"
                className="underline decoration-amber-400/50 hover:decoration-amber-400 text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                Anthropic&apos;s privacy policy
              </Link>
              .
            </li>
          </ul>
          <p>
            We may also disclose information if required to do so by law or in
            response to a valid legal request.
          </p>
        </Section>

        {/* Storage & security */}
        <Section title="4. Where data is stored &amp; how it&apos;s protected">
          <p>
            All transaction data is stored in our Supabase database, hosted in
            the AWS Mumbai (ap-south-1) region. Data is encrypted in transit
            (TLS) and at rest. Database access is gated by row-level security
            (RLS) — you can only read or write your own rows.
          </p>
          <p>
            Server-side secrets (API keys, webhook signing secrets) are stored
            as encrypted environment variables on Vercel. We rotate sensitive
            credentials periodically.
          </p>
        </Section>

        {/* Retention */}
        <Section title="5. Data retention">
          <p>
            Your transactions and profile remain stored for as long as your
            account is active. If you delete your account, all data associated
            with it is removed from our active database within 30 days, with
            backups purged within 90 days.
          </p>
        </Section>

        {/* Your rights */}
        <Section title="6. Your rights">
          <p>You can, at any time:</p>
          <ul className="space-y-2 list-disc list-outside ml-5 marker:text-white/30">
            <li>View and export your transactions from the dashboard.</li>
            <li>Edit or delete individual transactions.</li>
            <li>Cancel your Pro subscription from the Pro page.</li>
            <li>Request full account deletion (see contact below).</li>
            <li>Request a copy of all data we hold about you.</li>
          </ul>
        </Section>

        {/* Children */}
        <Section title="7. Children&apos;s privacy">
          <p>
            The Service is not directed at children under 13, and we do not
            knowingly collect personal data from children under 13. If you
            believe a child has provided us with personal data, please contact
            us and we will delete it.
          </p>
        </Section>

        {/* Changes */}
        <Section title="8. Changes to this policy">
          <p>
            We may update this policy from time to time. The &ldquo;Last
            updated&rdquo; date at the top of this page reflects the most recent
            change. Material changes will be communicated via in-app notice or
            email.
          </p>
        </Section>

        {/* Contact */}
        <Section title="9. Contact &amp; data deletion requests">
          <p>
            For privacy questions, data export, or account deletion, email{" "}
            <Link
              href="mailto:hello@mrbottomline.club"
              className="underline decoration-amber-400/50 hover:decoration-amber-400 text-white"
            >
              hello@mrbottomline.club
            </Link>
            . We aim to respond within 7 business days.
          </p>
          <p className="text-white/50 text-sm">
            Operator: MrBottomLine, India.
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

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-semibold text-white text-base mt-6 mb-2">{children}</h3>
  );
}
