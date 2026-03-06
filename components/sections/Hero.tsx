import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import SectionLabel from "@/components/ui/SectionLabel";
import { HERO } from "@/lib/constants";

const pillars = [
  {
    label: "I BUILD",
    heading: "Products & Experiences",
    detail: "Arré Voice · Serene Windsor",
    icon: "🎙",
    href: "#build",
    accent: "bg-navy/6",
  },
  {
    label: "I ALLOCATE",
    heading: "Capital",
    detail: "Bottomline Ventures · Tier 2 India",
    icon: "BV",
    href: "#allocate",
    accent: "bg-amber-50",
    monogram: true,
  },
  {
    label: "I CREATE",
    heading: "Content",
    detail: "MrBottomLine · YouTube",
    icon: "▶",
    href: "#create",
    accent: "bg-red-50",
  },
];

export default function Hero() {
  return (
    <section
      id="about"
      className="bg-white py-20 lg:py-28 overflow-hidden"
    >
      <div className="max-w-content mx-auto px-6 lg:px-8">
        {/* ── Headline + Photo ── */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mb-16">
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

        {/* ── Three Pillars Strip ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-10 border-t border-border">
          {pillars.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="group flex flex-col gap-4 p-6 rounded-2xl hover:bg-surface-gray transition-colors duration-200"
            >
              {/* Icon / monogram */}
              <div
                className={`w-11 h-11 rounded-xl ${p.accent} flex items-center justify-center flex-shrink-0`}
              >
                {p.monogram ? (
                  <span className="font-playfair text-sm font-bold text-amber-600">
                    {p.icon}
                  </span>
                ) : (
                  <span className="text-lg">{p.icon}</span>
                )}
              </div>

              {/* Text */}
              <div>
                <p className="font-inter text-xs font-semibold uppercase tracking-[0.14em] text-navy/50 mb-1">
                  {p.label}
                </p>
                <h3 className="font-playfair text-xl font-bold text-ink mb-1 group-hover:text-navy transition-colors">
                  {p.heading}
                </h3>
                <p className="font-inter text-sm text-body/70">{p.detail}</p>
              </div>

              {/* Arrow — appears on hover */}
              <span className="font-inter text-sm font-semibold text-navy opacity-0 group-hover:opacity-100 transition-opacity -mt-1">
                See more →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
