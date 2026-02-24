import SectionLabel from "@/components/ui/SectionLabel";
import { COLLABORATE } from "@/lib/constants";

export default function Collaborate() {
  return (
    <section id="collaborate" className="bg-white py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <SectionLabel>{COLLABORATE.sectionLabel}</SectionLabel>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight mb-8">
            {COLLABORATE.heading}
          </h2>

          <div className="flex flex-col gap-5 mb-10 text-left">
            {COLLABORATE.body.map((paragraph, i) => (
              <p
                key={i}
                className="font-inter text-body leading-relaxed text-[17px]"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Contact form / CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 max-w-xs px-5 py-3 rounded-2xl border border-border font-inter text-base text-body placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-all"
            />
            <a
              href={COLLABORATE.cta.href}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-navy text-white font-inter font-semibold text-sm hover:bg-navy-dark transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {COLLABORATE.cta.label}
            </a>
          </div>
          <p className="font-inter text-xs text-gray-400 mt-4">
            Or email directly:{" "}
            <a
              href="mailto:hello@mrbottomline.club"
              className="text-navy hover:underline"
            >
              hello@mrbottomline.club
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
