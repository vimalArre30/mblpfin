import SectionLabel from "@/components/ui/SectionLabel";
import { PHILOSOPHY } from "@/lib/constants";

export default function Philosophy() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <SectionLabel>{PHILOSOPHY.sectionLabel}</SectionLabel>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight">
            {PHILOSOPHY.heading}
          </h2>
        </div>

        {/* Beliefs — manifesto-style */}
        <div className="max-w-3xl mx-auto">
          {PHILOSOPHY.beliefs.map((belief, i) => (
            <div key={i}>
              <div className="py-8 lg:py-10">
                <h3 className="font-playfair text-2xl lg:text-3xl font-bold text-ink mb-3">
                  {belief.title}
                </h3>
                <p className="font-inter text-body leading-relaxed text-[17px]">
                  {belief.body}
                </p>
              </div>
              {i < PHILOSOPHY.beliefs.length - 1 && (
                <hr className="border-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
