import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import { PURSUITS } from "@/lib/constants";

export default function Pursuits() {
  return (
    <section id="pursuits" className="bg-white py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <SectionLabel>{PURSUITS.sectionLabel}</SectionLabel>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight">
            {PURSUITS.heading}
          </h2>
        </div>

        {/* 2×2 grid of cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {PURSUITS.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center text-xl mb-5 text-navy">
                {item.icon}
              </div>

              {/* Tag */}
              <p className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-navy/60 mb-2">
                {item.tag}
              </p>

              {/* Name */}
              <h3 className="font-playfair text-xl font-bold text-ink mb-3">
                {item.name}
              </h3>

              {/* Description */}
              <p className="font-inter text-body leading-relaxed text-[15px] flex-1 mb-6">
                {item.description}
              </p>

              {/* CTA */}
              {item.cta && (
                <Link
                  href={item.cta.href}
                  target={item.cta.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="font-inter text-sm font-semibold text-navy hover:text-navy-dark transition-colors"
                >
                  {item.cta.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Fund card — full width, navy */}
        <div className="bg-navy rounded-2xl p-10 lg:p-12 text-white flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <p className="font-inter text-xs font-semibold uppercase tracking-[0.15em] text-blue-200 mb-2">
              {PURSUITS.fundCard.tag}
            </p>
            <h3 className="font-playfair text-2xl lg:text-3xl font-bold mb-4">
              {PURSUITS.fundCard.heading}
            </h3>
            <p className="font-inter text-blue-100 leading-relaxed text-[15px] max-w-2xl">
              {PURSUITS.fundCard.description}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href={PURSUITS.fundCard.cta.href}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-navy font-inter font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm"
            >
              {PURSUITS.fundCard.cta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
