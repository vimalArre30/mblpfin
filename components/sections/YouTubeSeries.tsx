import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import { YOUTUBE_SERIES } from "@/lib/constants";

export default function YouTubeSeries() {
  const { sectionLabel, heading, subheading, body, cta } = YOUTUBE_SERIES;

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel>{sectionLabel}</SectionLabel>

          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight mt-2 mb-3">
            {heading}
          </h2>

          <p className="font-inter text-xl font-semibold text-navy mb-5">
            {subheading}
          </p>

          <p className="font-inter text-body text-lg leading-relaxed mb-8">
            {body}
          </p>

          <Link
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-navy text-white font-inter font-semibold text-sm px-6 py-3 rounded-full hover:bg-navy-dark transition-colors duration-150"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
