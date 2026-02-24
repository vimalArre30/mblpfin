import Button from "@/components/ui/Button";
import SectionLabel from "@/components/ui/SectionLabel";
import { YOUTUBE_FEATURE } from "@/lib/constants";

export default function YouTubeFeature() {
  return (
    <section className="bg-surface-gray py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          {/* Left: text */}
          <div className="lg:w-[340px] flex-shrink-0 lg:sticky lg:top-24">
            <SectionLabel>{YOUTUBE_FEATURE.sectionLabel}</SectionLabel>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-ink tracking-tight mb-4">
              {YOUTUBE_FEATURE.heading}
            </h2>
            <p className="font-inter text-body leading-relaxed text-[16px] mb-8">
              {YOUTUBE_FEATURE.subtext}
            </p>
            <Button
              href={YOUTUBE_FEATURE.cta.href}
              variant="primary"
              external
            >
              {YOUTUBE_FEATURE.cta.label}
            </Button>
          </div>

          {/* Right: videos */}
          <div className="flex-1 flex flex-col gap-6">
            {YOUTUBE_FEATURE.videos.map((video, i) => (
              <div key={i}>
                <div className="relative w-full rounded-2xl overflow-hidden shadow-lg aspect-video bg-ink">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={`Mr. Bottom Line video ${i + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    loading="lazy"
                  />
                </div>
                <p className="font-inter text-sm text-body mt-3 leading-relaxed">
                  {video.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
