import Image from "next/image";
import Link from "next/link";

export default function ThreeArms() {
  return (
    <section id="pursuits" className="bg-surface-gray py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <p className="font-inter text-xs font-semibold uppercase tracking-[0.18em] text-navy/50 mb-3">
            The Platform
          </p>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight">
            Three arms. One bottom line.
          </h2>
          <p className="font-inter text-body text-[16px] leading-relaxed mt-3 max-w-2xl">
            MrBottomLine operates across fintech, capital allocation, and real-world experiences — each built to compound independently, and to reinforce each other over time.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── MBL PFin ── */}
          <div className="bg-navy rounded-2xl p-8 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="font-playfair text-lg font-bold text-white">₹</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-300/70 bg-white/10 px-2.5 py-1 rounded-full">
                Fintech
              </span>
            </div>
            <h3 className="font-playfair text-2xl font-bold text-white mb-2">MBL PFin</h3>
            <p className="font-inter text-xs font-semibold uppercase tracking-wider text-blue-300/60 mb-4">
              Personal Finance OS
            </p>
            <p className="font-inter text-blue-100/80 leading-relaxed text-[15px] flex-1">
              An AI-powered platform for personal finance — starting with voice expense tracking. Speak your spend, the AI does the rest. Built for Indian users, priced for Indian wallets. The long-term vision: a complete personal finance OS.
            </p>
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/pro"
                className="inline-flex items-center gap-2 font-inter text-sm font-semibold text-white hover:text-blue-200 transition-colors"
              >
                Try MBL PFin → Free for 250 entries
              </Link>
              <Link
                href="/tools/fire-calculator"
                className="inline-flex items-center gap-2 font-inter text-sm text-blue-300/60 hover:text-blue-300 transition-colors"
              >
                Free FIRE Calculator →
              </Link>
            </div>
          </div>

          {/* ── Prime Bottomline Ventures ── */}
          <div className="bg-[#0F2E17] rounded-2xl p-8 flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#C8941A]/20 flex items-center justify-center">
                <span className="font-playfair text-lg font-bold text-[#C8941A]">PBV</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C8941A]/70 bg-[#C8941A]/10 px-2.5 py-1 rounded-full">
                Capital
              </span>
            </div>

            {/* Logo */}
            <div className="mb-4">
              <Image
                src="/images/prime-bottomline-ventures-logo.svg"
                alt="Prime Bottomline Ventures"
                width={260}
                height={80}
                className="h-12 w-auto object-contain brightness-[1.15]"
              />
            </div>

            <p className="font-inter text-[#C8941A]/60 text-xs font-semibold uppercase tracking-wider mb-4">
              Revenue-First · Region-First
            </p>
            <p className="font-inter text-green-100/70 leading-relaxed text-[15px] flex-1">
              A ₹20 Crore revenue-stage fund backing Tier 2 India founders — operators in Coimbatore, Surat, Indore, Vizag — who have paying customers and zero institutional attention. Disciplined by design.
            </p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <Link
                href="https://www.primebottomline.vc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-inter text-sm font-semibold text-[#C8941A] hover:text-[#D4A830] transition-colors"
              >
                Visit Prime Bottomline Ventures →
              </Link>
            </div>
          </div>

          {/* ── Serene Windsor ── */}
          <div className="bg-white rounded-2xl p-8 border border-border shadow-sm flex flex-col min-h-[420px]">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">
                🌿
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-green-700/60 bg-green-50 px-2.5 py-1 rounded-full">
                Experience
              </span>
            </div>
            <h3 className="font-playfair text-2xl font-bold text-ink mb-2">Serene Windsor</h3>
            <p className="font-inter text-xs font-semibold uppercase tracking-wider text-green-700/50 mb-4">
              Farmstay · Opening July 2026
            </p>
            <p className="font-inter text-body leading-relaxed text-[15px] flex-1">
              A farmstay built deliberately and patiently. Serene Windsor is the real-world arm of the platform — craft, taste, and quiet quality over loud marketing. A place where people come to slow down. Brand is capital. Perception compounds.
            </p>
            <div className="mt-6 pt-6 border-t border-border">
              <Link
                href="https://serenewindsor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-inter text-sm font-semibold text-navy hover:text-navy-dark transition-colors"
              >
                Visit Serene Windsor →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
