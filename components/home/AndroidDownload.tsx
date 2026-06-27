import { LINKS } from "@/lib/constants";

export default function AndroidDownload() {
  return (
    <section className="bg-[#0A1628] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <p className="font-inter text-xs text-white/45 tracking-[0.15em] uppercase mb-3">
              Android app
            </p>
            <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-white mb-3">
              Log from anywhere, anytime.
            </h2>
            <p className="font-inter text-sm text-white/65 max-w-md">
              The MBL PFin Android app is live on the Play Store.
              Free to download. Voice logging works offline too.
            </p>
          </div>

          <div className="flex-shrink-0">
            <a
              href={LINKS.playStore}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white text-[#0A1628] px-5 py-3 rounded-xl hover:bg-white/90 transition-colors"
            >
              {/* Play Store icon */}
              <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1.5L10.5 11L1 20.5" stroke="#0A1628" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 1.5L19 11L1 20.5" stroke="#0A1628" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div className="font-inter text-[9px] text-[#0A1628]/50 uppercase tracking-wide leading-none mb-0.5">
                  Get it on
                </div>
                <div className="font-inter text-sm font-semibold text-[#0A1628] leading-none">
                  Google Play
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
