import Image from "next/image";

const career = [
  { company: "21st Century Fox", role: "Early career", period: "2009" },
  { company: "Disney", role: "Product & Operations", period: "2010–12" },
  { company: "Hotstar", role: "Product", period: "2013–16" },
  { company: "TikTok / ByteDance", role: "Product", period: "2017–19" },
  { company: "Resso", role: "Product", period: "2020–21" },
  { company: "Arré Voice", role: "Chief of Product", period: "2021–Present", current: true },
];

export default function CareerStory() {
  return (
    <section className="bg-surface-gray py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">

        <div className="flex flex-col lg:flex-row items-start gap-14 lg:gap-20">

          {/* Photo */}
          <div className="flex-shrink-0 w-full lg:w-[320px]">
            <Image
              src="/images/vimal-secondary.jpg"
              alt="Vimal — 15+ years of shipping"
              width={400}
              height={500}
              className="rounded-2xl object-cover w-full h-auto shadow-md"
            />
          </div>

          {/* Story */}
          <div className="flex-1">
            <p className="font-inter text-xs font-semibold uppercase tracking-[0.18em] text-navy/50 mb-3">
              Behind the Platform
            </p>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight mb-5">
              15+ years of shipping.
            </h2>
            <p className="font-inter text-body text-[16px] leading-relaxed mb-4 max-w-xl">
              The arc from product operator to platform builder is not a pivot — it's an accumulation. Every product decision, every distribution experiment, every failure in growth — it all loads into how MrBottomLine thinks about capital, systems, and what actually lasts.
            </p>
            <p className="font-inter text-body text-[16px] leading-relaxed mb-10 max-w-xl">
              Across 15+ years, the work has touched hundreds of millions of users across some of the most competitive digital platforms in the world.
            </p>

            {/* Career timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border" />

              <div className="flex flex-col gap-5">
                {career.map((item, i) => (
                  <div key={i} className="flex items-start gap-5">
                    {/* Dot */}
                    <div className={`relative z-10 mt-1 w-4 h-4 rounded-full border-2 shrink-0 ${
                      item.current
                        ? "bg-navy border-navy"
                        : "bg-white border-border"
                    }`} />
                    {/* Content */}
                    <div>
                      <p className={`font-inter font-semibold text-[15px] ${item.current ? "text-navy" : "text-ink"}`}>
                        {item.company}
                        {item.current && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-white bg-navy px-2 py-0.5 rounded-full">
                            Now
                          </span>
                        )}
                      </p>
                      <p className="font-inter text-body/60 text-[13px]">
                        {item.role} · {item.period}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
