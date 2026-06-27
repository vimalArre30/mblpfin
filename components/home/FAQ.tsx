"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. The free plan gives you 250 entries per month — plenty for most people to start. No credit card required. Upgrade to Pro when you want unlimited logging and advanced features.",
  },
  {
    q: "How does voice logging work?",
    a: "Open the app, tap the mic, and say something like \"Spent 350 on fuel from Axis card.\" AI parses the amount (350), category (fuel/transport), and wallet (Axis). The entry is created instantly. Works in English and Hinglish.",
  },
  {
    q: "Is my financial data safe?",
    a: "Yes. Your data is stored securely via Supabase (row-level security). We don't sell data. We don't have access to your bank accounts — you log entries manually by voice or text.",
  },
  {
    q: "What's the difference between MBL PFin and other trackers?",
    a: "Most trackers are passive — you connect a bank and hope for the best. MBL PFin is active — you speak it, you own it. That deliberate act of logging is the point. It builds awareness, not just records.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-[#0D1B38] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <p className="font-inter text-xs text-white/30 tracking-[0.15em] uppercase mb-3">
          FAQ
        </p>
        <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-white mb-10">
          Common questions.
        </h2>

        <div className="max-w-2xl space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-white/[0.08] rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-inter text-sm font-medium text-white/70">
                  {faq.q}
                </span>
                <span className="flex-shrink-0 text-white/30 text-lg leading-none">
                  {open === i ? "−" : "+"}
                </span>
              </button>
              {open === i && (
                <div className="px-5 pb-5 border-t border-white/[0.06]">
                  <p className="font-inter text-sm text-white/40 leading-relaxed pt-4">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
