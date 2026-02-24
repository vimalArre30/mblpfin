import Image from "next/image";
import SectionLabel from "@/components/ui/SectionLabel";
import { NARRATIVE } from "@/lib/constants";

export default function NarrativeArc() {
  return (
    <section className="bg-surface-gray py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <SectionLabel>{NARRATIVE.sectionLabel}</SectionLabel>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight">
            {NARRATIVE.heading}
          </h2>
        </div>

        {/* Three phase cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {NARRATIVE.phases.map((phase) => (
            <div
              key={phase.number}
              className="bg-white rounded-2xl p-8 border border-border shadow-sm"
            >
              <p className="font-playfair text-5xl font-bold text-navy/20 leading-none mb-4">
                {phase.number}
              </p>
              <h3 className="font-playfair text-xl font-bold text-ink mb-3">
                {phase.title}
              </h3>
              <p className="font-inter text-body leading-relaxed text-[15px]">
                {phase.description}
              </p>
            </div>
          ))}
        </div>

        {/* Secondary photo */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 bg-white rounded-2xl border border-border p-8 lg:p-12 shadow-sm">
          <div className="flex-shrink-0 w-full lg:w-auto">
            <Image
              src="/images/vimal-secondary.jpg"
              alt="Vimal, product builder"
              width={400}
              height={500}
              className="rounded-2xl object-cover w-full lg:w-[320px] h-auto shadow-md"
            />
          </div>
          <div>
            <SectionLabel>BEHIND THE WORK</SectionLabel>
            <h3 className="font-playfair text-3xl font-bold text-ink mb-4">
              Five years of shipping.
            </h3>
            <p className="font-inter text-body leading-relaxed mb-4 text-[16px]">
              The arc from builder to allocator is not a career pivot. It's an accumulation. Every product decision, every distribution experiment, every failed growth hack — it all loads into how I think about capital, leverage, and durability.
            </p>
            <p className="font-inter text-body leading-relaxed text-[16px]">
              I spent five years building ARRÊ Voice from the inside — learning what it actually takes to grow a social product in India, what users want versus what they'll pay for, and what the difference between traction and retention looks like in practice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
