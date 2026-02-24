import Image from "next/image";
import Button from "@/components/ui/Button";
import SectionLabel from "@/components/ui/SectionLabel";
import { HERO } from "@/lib/constants";

export default function Hero() {
  return (
    <section
      id="about"
      className="bg-white py-20 lg:py-28 overflow-hidden"
    >
      <div className="max-w-content mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            <SectionLabel>{HERO.eyebrow}</SectionLabel>

            <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-tight tracking-tight mt-2 mb-6">
              {HERO.heading.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  {i < HERO.heading.split("\n").length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="font-inter text-lg text-body leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
              {HERO.subheading}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button href={HERO.primaryCta.href} variant="primary">
                {HERO.primaryCta.label}
              </Button>
              <Button
                href={HERO.secondaryCta.href}
                variant="secondary"
                external
              >
                {HERO.secondaryCta.label}
              </Button>
            </div>
          </div>

          {/* Primary photo */}
          <div className="flex-shrink-0">
            <div className="relative w-72 md:w-80 lg:w-[380px]">
              <Image
                src="/images/vimal-primary.jpg"
                alt="Vimal — Mr. Bottom Line"
                width={500}
                height={600}
                className="rounded-2xl shadow-xl object-cover w-full h-auto"
                priority
              />
              {/* Subtle navy accent block behind image */}
              <div className="absolute -bottom-4 -right-4 w-full h-full bg-navy/10 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
