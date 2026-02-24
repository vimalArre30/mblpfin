import Link from "next/link";
import Button from "@/components/ui/Button";
import SectionLabel from "@/components/ui/SectionLabel";
import { THINKING } from "@/lib/constants";

export default function Thinking() {
  return (
    <section id="thinking" className="bg-surface-gray py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <SectionLabel>{THINKING.sectionLabel}</SectionLabel>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight">
              {THINKING.heading}
            </h2>
            <p className="font-inter text-body leading-relaxed mt-3 max-w-xl text-[16px]">
              {THINKING.subtext}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button href={THINKING.cta.href} variant="primary" external>
              {THINKING.cta.label}
            </Button>
          </div>
        </div>

        {/* Article cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {THINKING.articles.map((article, i) => (
            <Link
              key={i}
              href={article.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col group"
            >
              <p className="font-inter text-xs text-navy/60 font-medium uppercase tracking-wider mb-3">
                {article.date}
              </p>
              <h3 className="font-playfair text-xl font-bold text-ink mb-3 group-hover:text-navy transition-colors">
                {article.title}
              </h3>
              <p className="font-inter text-body text-[14px] leading-relaxed flex-1 mb-5">
                {article.excerpt}
              </p>
              <span className="font-inter text-sm font-semibold text-navy">
                Read on Substack →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
