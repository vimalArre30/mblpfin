import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";

export default function ThreePillars() {
  return (
    <>
      {/* ── I BUILD PRODUCTS & EXPERIENCES ─────────────────────────────── */}
      <section id="build" className="bg-surface-gray py-20 lg:py-28">
        <div className="max-w-content mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <SectionLabel>BUILDING</SectionLabel>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight mt-1">
              I build products &amp; experiences.
            </h2>
            <p className="font-inter text-body text-[16px] leading-relaxed mt-4 max-w-2xl">
              From digital platforms serving millions to physical spaces built for craft and quiet quality — I build things meant to last.
            </p>
          </div>

          {/* Two cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Arré Voice — dark navy card */}
            <div className="bg-navy rounded-2xl p-10 text-white flex flex-col min-h-[360px]">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl mb-6">
                🎙
              </div>
              <p className="font-inter text-xs font-semibold uppercase tracking-[0.15em] text-blue-200 mb-2">
                CHIEF OF PRODUCT · 5+ YEARS
              </p>
              <h3 className="font-playfair text-2xl font-bold mb-4">Arré Voice</h3>
              <p className="font-inter text-blue-100 leading-relaxed text-[15px] flex-1">
                India's short-form social audio app — a platform where anyone can create, share, and discover 30-second Voicepods. Built from the ground up, overseeing product and engineering across growth, monetisation, and platform stability.
              </p>
              <Link
                href="https://arrevoice.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 font-inter text-sm font-semibold text-white hover:text-blue-200 transition-colors"
              >
                Visit Arré Voice →
              </Link>
            </div>

            {/* Serene Windsor — light card */}
            <div className="bg-white rounded-2xl p-10 border border-border shadow-sm flex flex-col min-h-[360px]">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl mb-6">
                🌿
              </div>
              <p className="font-inter text-xs font-semibold uppercase tracking-[0.15em] text-navy/60 mb-2">
                FARMSTAY · OPENING JULY 2026
              </p>
              <h3 className="font-playfair text-2xl font-bold text-ink mb-4">Serene Windsor</h3>
              <p className="font-inter text-body leading-relaxed text-[15px] flex-1">
                A farmstay being built deliberately and patiently. Serene Windsor is about craft, taste, and quiet quality over loud marketing. Brand is capital. Perception compounds. Opening for guests July 2026.
              </p>
              <Link
                href="https://serenewindsor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 font-inter text-sm font-semibold text-navy hover:text-navy-dark transition-colors"
              >
                Visit Serene Windsor →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── I ALLOCATE CAPITAL ─────────────────────────────────────────── */}
      <section id="allocate" className="bg-ink py-20 lg:py-28">
        <div className="max-w-content mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-14 lg:gap-20">
            {/* Left: copy */}
            <div className="flex-1">
              <p className="font-inter text-xs font-semibold uppercase tracking-[0.15em] text-amber-400 mb-4">
                CAPITAL ALLOCATION
              </p>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                I allocate capital.
              </h2>
              <p className="font-inter text-zinc-300 leading-relaxed text-[16px] mb-8 max-w-lg">
                Bottomline Ventures is a ₹20 Crore revenue-stage fund backing Tier 2 India founders — operators in cities like Coimbatore, Surat, Indore, and Vizag who have paying customers and zero institutional attention. Revenue-First. Region-First. Disciplined by Design.
              </p>
              <Link
                href="https://www.primebottomline.vc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-amber-400 text-ink font-inter font-bold text-sm hover:bg-amber-300 transition-colors shadow-lg"
              >
                Visit Bottomline Ventures →
              </Link>
            </div>

            {/* Right: BV stats widget */}
            <div className="flex-shrink-0 w-full lg:w-72">
              {/* BV Monogram */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                  <span className="font-playfair text-xl font-bold text-amber-400">BV</span>
                </div>
                <div>
                  <p className="font-playfair text-white font-bold text-lg leading-tight">Bottomline</p>
                  <p className="font-playfair text-white font-bold text-lg leading-tight">Ventures</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <p className="font-playfair text-2xl font-bold text-amber-400">₹20Cr</p>
                  <p className="font-inter text-xs text-zinc-400 mt-1 leading-snug">Fund Size</p>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <p className="font-playfair text-2xl font-bold text-amber-400">₹1Cr</p>
                  <p className="font-inter text-xs text-zinc-400 mt-1 leading-snug">Cheque Size</p>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <p className="font-playfair text-lg font-bold text-white">Tier 2</p>
                  <p className="font-inter text-xs text-zinc-400 mt-1 leading-snug">India Focus</p>
                </div>
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <p className="font-playfair text-lg font-bold text-white">May '26</p>
                  <p className="font-inter text-xs text-zinc-400 mt-1 leading-snug">Fund I Launch</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── I CREATE CONTENT ───────────────────────────────────────────── */}
      <section id="create" className="bg-white py-20 lg:py-28">
        <div className="max-w-content mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <SectionLabel>CONTENT</SectionLabel>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight mt-1">
              I create content.
            </h2>
            <p className="font-inter text-body text-[16px] leading-relaxed mt-4 max-w-2xl">
              A builder's notebook in video form — product breakdowns, business model analysis, capital allocation frameworks, and founder psychology. Insight-first, not entertainment-first.
            </p>
          </div>

          {/* Two YouTube channel cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* English Channel */}
            <div className="bg-white rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-red-600"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <div>
                  <p className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-navy/60">
                    ENGLISH · INSIGHT-FIRST
                  </p>
                  <h3 className="font-playfair text-xl font-bold text-ink">MrBottomLine</h3>
                </div>
              </div>
              <p className="font-inter text-body leading-relaxed text-[15px] flex-1 mb-6">
                Product breakdowns, business model analysis, capital allocation thinking, and practical frameworks for builders and operators. Every video earns its watch time.
              </p>
              <Link
                href="https://www.youtube.com/@mrbottomline"
                target="_blank"
                rel="noopener noreferrer"
                className="font-inter text-sm font-semibold text-navy hover:text-navy-dark transition-colors"
              >
                Watch the channel →
              </Link>
            </div>

            {/* Tamil Channel — coming soon */}
            <div className="bg-surface-gray rounded-2xl p-8 border border-border flex flex-col relative">
              {/* Coming Soon badge */}
              <div className="absolute top-6 right-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-navy/8 font-inter text-xs font-semibold text-navy uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-red-500 opacity-60"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <div>
                  <p className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-navy/60">
                    TAMIL · LOCALISATION
                  </p>
                  <h3 className="font-playfair text-xl font-bold text-ink">MrBottomLine Tamil</h3>
                </div>
              </div>
              <p className="font-inter text-body leading-relaxed text-[15px] flex-1 mb-6 opacity-80">
                The same rigorous frameworks — product thinking, business models, capital allocation — delivered in Tamil for Tier 2 India founders and builders. Coimbatore is the geographic anchor.
              </p>
              <span className="font-inter text-sm font-semibold text-navy/40">Launching 2026</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
