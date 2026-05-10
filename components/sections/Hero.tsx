import Image from "next/image";
import DisabledLink from "@/components/ui/DisabledLink";

// NOTE: External project links temporarily disabled for Razorpay account verification (May 2026).
// To restore: replace each <DisabledLink> below with the commented-out <Link href="..."> alongside it,
// re-add `import Link from "next/link";` above, and delete this comment block.

export default function Hero() {
  return (
    <section id="about" className="bg-white py-20 lg:py-28 overflow-hidden">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-14 lg:gap-20">

          {/* Photo */}
          <div className="flex-shrink-0 w-full lg:w-[400px]">
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

          {/* Three pillar statements */}
          <div className="flex-1 flex flex-col justify-center gap-10 lg:pt-6">

            {/* Name */}
            <p className="font-inter text-xs font-semibold uppercase tracking-[0.2em] text-navy/50">
              Vimal · mrbottomline.club
            </p>

            {/* I build */}
            <div className="border-l-[3px] border-navy pl-7">
              <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-ink mb-2 tracking-tight">
                I build.
              </h2>
              <p className="font-inter text-body text-[15px] mb-4">
                Products &amp; experiences — digital and physical.
              </p>
              <div className="flex flex-wrap gap-4">
                {/* Original: <Link href="https://arrevoice.com" target="_blank" rel="noopener noreferrer" ...> */}
                <DisabledLink className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-navy hover:text-navy-dark transition-colors">
                  Arré Voice →
                </DisabledLink>
                {/* Original: <Link href="https://serenewindsor.com" target="_blank" rel="noopener noreferrer" ...> */}
                <DisabledLink className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-navy hover:text-navy-dark transition-colors">
                  Serene Windsor →
                </DisabledLink>
              </div>
            </div>

            {/* I allocate */}
            <div className="border-l-[3px] border-amber-400 pl-7">
              <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-ink mb-2 tracking-tight">
                I allocate.
              </h2>
              <p className="font-inter text-body text-[15px] mb-4">
                Capital into high-agency founders. Revenue-First. Region-First.
              </p>
              {/* Original: <Link href="https://www.bottomlineventures.vc" target="_blank" rel="noopener noreferrer" ...> */}
              <DisabledLink className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-navy hover:text-navy-dark transition-colors">
                Bottomline Ventures →
              </DisabledLink>
            </div>

            {/* I create */}
            <div className="border-l-[3px] border-red-500 pl-7">
              <h2 className="font-playfair text-4xl lg:text-5xl font-bold text-ink mb-2 tracking-tight">
                I create.
              </h2>
              <p className="font-inter text-body text-[15px] mb-4">
                Content for builders and operators. Insight-first, not entertainment-first.
              </p>
              {/* Original: <Link href="https://www.youtube.com/@mrbottomline" target="_blank" rel="noopener noreferrer" ...> */}
              <DisabledLink className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-navy hover:text-navy-dark transition-colors">
                MrBottomLine on YouTube →
              </DisabledLink>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
