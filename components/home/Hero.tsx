import Link from "next/link";
import { LINKS } from "@/lib/constants";

export default function Hero() {
  return (
    <section className="bg-[#0A1628] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-0 min-h-[480px] items-center">

        {/* Left: copy + CTAs */}
        <div className="py-16 lg:py-20 lg:pr-12">
          <div className="inline-block bg-white/[0.06] border border-white/10 rounded-full px-3 py-1 text-xs text-white/45 mb-6 tracking-wide">
            Voice AI · Expense Tracker · Android
          </div>
          <h1 className="font-playfair text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-5">
            Track every rupee.<br />
            <em>By voice.</em>
          </h1>
          <p className="font-inter text-[15px] text-white/45 leading-relaxed mb-8 max-w-sm">
            Say it out loud. MBL PFin logs it — amount, category, wallet.
            No forms. No tapping. The foundation of your financial intelligence.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tracker/login"
              className="font-inter text-sm font-semibold bg-white text-[#0A1628] px-5 py-2.5 rounded-lg hover:bg-white/90 transition-colors"
            >
              Get started free →
            </Link>
            <a
              href={LINKS.playStore}
              target="_blank"
              rel="noopener noreferrer"
              className="font-inter text-sm border border-white/20 text-white px-5 py-2.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              Download on Android
            </a>
          </div>
          <p className="font-inter text-xs text-white/20 mt-4">
            Free plan · 250 entries/month · No card needed
          </p>
        </div>

        {/* Right: community network illustration */}
        <div className="hidden lg:flex items-center justify-center py-12">
          <svg
            width="320"
            height="320"
            viewBox="0 0 320 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Subtle grid lines */}
            <line x1="0" y1="160" x2="320" y2="160" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
            <line x1="160" y1="0" x2="160" y2="320" stroke="white" strokeOpacity="0.04" strokeWidth="1" />

            {/* Connection lines to outer nodes */}
            <line x1="160" y1="160" x2="86" y2="72"  stroke="white" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="160" y1="160" x2="236" y2="72" stroke="white" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="160" y1="160" x2="46"  y2="190" stroke="white" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="160" y1="160" x2="274" y2="190" stroke="white" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="160" y1="160" x2="116" y2="268" stroke="white" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="160" y1="160" x2="206" y2="268" stroke="white" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 4" />

            {/* Cross-community connections */}
            <line x1="86" y1="72"  x2="236" y2="72"  stroke="white" strokeOpacity="0.05" strokeWidth="1" />
            <line x1="46"  y1="190" x2="116" y2="268" stroke="white" strokeOpacity="0.05" strokeWidth="1" />
            <line x1="274" y1="190" x2="206" y2="268" stroke="white" strokeOpacity="0.05" strokeWidth="1" />

            {/* Central node */}
            <circle cx="160" cy="160" r="38" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.22" strokeWidth="1" />
            {/* Mic icon */}
            <rect x="151" y="142" width="18" height="28" rx="5" stroke="white" strokeOpacity="0.65" strokeWidth="1.5" fill="none" />
            <circle cx="160" cy="157" r="5" fill="white" fillOpacity="0.5" />
            <line x1="160" y1="170" x2="160" y2="176" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />
            <line x1="154" y1="176" x2="166" y2="176" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" />

            {/* Outer user nodes */}
            {/* Top-left */}
            <circle cx="86" cy="72" r="22" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.16" strokeWidth="1" />
            <text x="86" y="77" textAnchor="middle" fill="white" fillOpacity="0.6" fontSize="11" fontFamily="Inter, system-ui, sans-serif" fontWeight="500">AR</text>
            <rect x="94" y="50" width="32" height="13" rx="4" fill="white" fillOpacity="0.07" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
            <text x="110" y="60" textAnchor="middle" fill="white" fillOpacity="0.38" fontSize="8" fontFamily="Inter, system-ui, sans-serif">₹450</text>

            {/* Top-right */}
            <circle cx="236" cy="72" r="22" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.16" strokeWidth="1" />
            <text x="236" y="77" textAnchor="middle" fill="white" fillOpacity="0.6" fontSize="11" fontFamily="Inter, system-ui, sans-serif" fontWeight="500">SK</text>

            {/* Left */}
            <circle cx="46" cy="190" r="22" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.16" strokeWidth="1" />
            <text x="46" y="195" textAnchor="middle" fill="white" fillOpacity="0.6" fontSize="11" fontFamily="Inter, system-ui, sans-serif" fontWeight="500">PM</text>
            <rect x="20" y="168" width="46" height="13" rx="4" fill="rgba(99,211,122,0.1)" stroke="rgba(99,211,122,0.2)" strokeWidth="0.5" />
            <text x="43" y="178" textAnchor="middle" fill="rgba(99,211,122,0.65)" fontSize="7.5" fontFamily="Inter, system-ui, sans-serif">✓ trusted</text>

            {/* Right */}
            <circle cx="274" cy="190" r="22" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.16" strokeWidth="1" />
            <text x="274" y="195" textAnchor="middle" fill="white" fillOpacity="0.6" fontSize="11" fontFamily="Inter, system-ui, sans-serif" fontWeight="500">RV</text>

            {/* Bottom-left */}
            <circle cx="116" cy="268" r="22" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.16" strokeWidth="1" />
            <text x="116" y="273" textAnchor="middle" fill="white" fillOpacity="0.6" fontSize="11" fontFamily="Inter, system-ui, sans-serif" fontWeight="500">MK</text>
            <rect x="96" y="292" width="40" height="13" rx="4" fill="white" fillOpacity="0.07" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
            <text x="116" y="302" textAnchor="middle" fill="white" fillOpacity="0.38" fontSize="8" fontFamily="Inter, system-ui, sans-serif">₹1,200</text>

            {/* Bottom-right */}
            <circle cx="206" cy="268" r="22" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.16" strokeWidth="1" />
            <text x="206" y="273" textAnchor="middle" fill="white" fillOpacity="0.6" fontSize="11" fontFamily="Inter, system-ui, sans-serif" fontWeight="500">DS</text>

            {/* Floating "Logged" chip */}
            <rect x="206" y="100" width="58" height="20" rx="5" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
            <text x="235" y="114" textAnchor="middle" fill="white" fillOpacity="0.35" fontSize="8" fontFamily="Inter, system-ui, sans-serif">✓ Logged</text>

            {/* Central label */}
            <text x="160" y="210" textAnchor="middle" fill="white" fillOpacity="0.18" fontSize="8.5" fontFamily="Inter, system-ui, sans-serif" letterSpacing="1.5">MBL PFIN</text>
          </svg>
        </div>
      </div>
    </section>
  );
}
