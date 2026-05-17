import Link from "next/link";
import SmartLink from "@/components/SmartLink";
import { BRAND, FOOTER } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#0F1E40] text-white">
      {/* Main columns */}
      <div className="max-w-content mx-auto px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-white/10">
        {/* Col 1: Brand */}
        <div>
          <p className="font-playfair text-xl font-bold mb-2">{BRAND.name}</p>
          <p className="font-inter text-blue-200 text-sm leading-relaxed">
            {FOOTER.brandDescription}
          </p>
        </div>

        {/* Col 2: Links */}
        <div>
          <p className="font-inter text-xs font-semibold uppercase tracking-[0.15em] text-blue-300 mb-4">
            Navigation
          </p>
          <ul className="flex flex-col gap-3">
            {FOOTER.links.map((link) => (
              <li key={link.label}>
                <SmartLink
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="font-inter text-sm text-blue-100 hover:text-white transition-colors"
                >
                  {link.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Social */}
        <div>
          <p className="font-inter text-xs font-semibold uppercase tracking-[0.15em] text-blue-300 mb-4">
            Find Me
          </p>
          <ul className="flex flex-col gap-3">
            {FOOTER.social.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-inter text-sm text-blue-100 hover:text-white transition-colors"
                >
                  {link.label} ↗
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-content mx-auto px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-inter text-xs text-blue-300">
          {FOOTER.copyright}
        </p>
        {/* text-blue-300/85 (was /60) for WCAG AA contrast on dark navy footer.
            Lighthouse a11y audit flagged this at /60. */}
        <p className="font-inter text-xs text-blue-300/85">
          Built with care.
        </p>
      </div>
    </footer>
  );
}
