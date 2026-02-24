"use client";

import { useState } from "react";
import { COMMUNITY } from "@/lib/constants";

export default function CommunityWaitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Phase 1: log to console. Phase 2: connect to Supabase or email service.
    console.log("Community waitlist signup:", email);
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section id="community" className="bg-navy py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center text-white">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {COMMUNITY.heading}
          </h2>
          <p className="font-inter text-blue-100 leading-relaxed text-[17px] mb-10">
            {COMMUNITY.subtext}
          </p>

          {submitted ? (
            <div className="bg-white/10 rounded-2xl px-8 py-6 border border-white/20">
              <p className="font-inter text-white font-semibold text-lg">
                You&apos;re on the list.
              </p>
              <p className="font-inter text-blue-100 text-sm mt-1">
                We&apos;ll reach out when the doors open.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={COMMUNITY.inputPlaceholder}
                required
                className="flex-1 max-w-xs px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-blue-200 font-inter text-base focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white text-navy font-inter font-semibold text-sm hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {COMMUNITY.ctaLabel}
              </button>
            </form>
          )}

          <p className="font-inter text-xs text-blue-200/70 mt-5 italic">
            {COMMUNITY.disclaimer}
          </p>
        </div>
      </div>
    </section>
  );
}
