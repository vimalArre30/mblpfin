import Image from "next/image";
import Link from "next/link";

const arms = [
  {
    label: "MBL PFin",
    tag: "Fintech",
    color: "bg-navy text-white",
    dot: "bg-blue-300",
    href: "/pro",
  },
  {
    label: "Prime Bottomline Ventures",
    tag: "Capital",
    color: "bg-[#1A5C2A] text-white",
    dot: "bg-[#C8941A]",
    href: "https://www.primebottomline.vc",
  },
  {
    label: "Serene Windsor",
    tag: "Experience",
    color: "bg-white text-ink border border-border",
    dot: "bg-green-500",
    href: "https://serenewindsor.com",
  },
];

export default function BrandHero() {
  return (
    <section id="about" className="bg-white py-20 lg:py-28 overflow-hidden">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-14 lg:gap-20">

          {/* Left — photo */}
          <div className="flex-shrink-0 w-full lg:w-[380px]">
            <div className="relative">
              <Image
                src="/images/vimal-primary.jpg"
                alt="Vimal — Mr. Bottom Line"
                width={500}
                height={600}
                className="rounded-2xl shadow-xl object-cover w-full h-auto"
                priority
              />
              <div className="absolute -bottom-4 -right-4 w-full h-full bg-navy/8 rounded-2xl -z-10" />
            </div>
          </div>

          {/* Right — platform positioning */}
          <div className="flex-1 flex flex-col justify-center gap-8 lg:pt-4">

            {/* Platform eyebrow */}
            <p className="font-inter text-xs font-semibold uppercase tracking-[0.22em] text-navy/50">
              mrbottomline.club · A platform for what matters
            </p>

            {/* Brand statement */}
            <div>
              <h1 className="font-playfair text-4xl lg:text-5xl font-bold text-ink leading-tight tracking-tight mb-4">
                MrBottomLine is a platform for personal finance, capital, and crafted experiences.
              </h1>
              <p className="font-inter text-body text-[16px] leading-relaxed max-w-lg">
                Three operating arms. One philosophy — that the bottom line, measured right, compounds over time. Built by Vimal, a product operator with 15+ years shipping for hundreds of millions of users.
              </p>
            </div>

            {/* Three arm chips */}
            <div className="flex flex-wrap gap-3">
              {arms.map((arm) => (
                <Link
                  key={arm.label}
                  href={arm.href}
                  target={arm.href.startsWith("http") ? "_blank" : undefined}
                  rel={arm.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold font-inter shadow-sm hover:opacity-80 transition-opacity ${arm.color}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${arm.dot}`} />
                  {arm.label}
                  <span className={`text-[10px] font-normal uppercase tracking-wider opacity-60`}>
                    {arm.tag}
                  </span>
                </Link>
              ))}
            </div>

            {/* Scroll cue */}
            <p className="font-inter text-xs text-body/40 uppercase tracking-widest">
              Scroll to explore the platform ↓
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
