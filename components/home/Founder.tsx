import Image from "next/image";
import { YOUTUBE_VIDEOS, LINKS } from "@/lib/constants";

export default function Founder() {
  return (
    <section className="bg-[#0A1628] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <p className="font-inter text-xs text-white/30 tracking-[0.15em] uppercase mb-10">
          The Founder
        </p>

        {/* Bio row */}
        <div className="flex gap-6 items-start mb-12">
          {/* Avatar */}
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center">
            <span className="font-playfair text-xl font-bold text-white">V</span>
          </div>

          <div>
            <h2 className="font-playfair text-xl font-bold text-white mb-1">
              Vimal — MrBottomLine
            </h2>
            <p className="font-inter text-sm text-white/40 mb-4">
              Product builder · Runner · Capital allocator
            </p>
            <p className="font-inter text-sm text-white/50 leading-relaxed max-w-2xl">
              I built MBL PFin because I couldn't find a tracker that fit how I actually live —
              on the move, thinking out loud, managing multiple wallets. So I built one.
              The same obsession with bottom-line thinking that drives my YouTube channel
              drives this product: honest numbers, no excuses, systems that compound.
            </p>
            <a
              href={LINKS.mrbottomlineClub}
              target="_blank"
              rel="noopener noreferrer"
              className="font-inter text-xs text-white/30 hover:text-white/60 transition-colors mt-3 inline-block"
            >
              mrbottomline.club ↗
            </a>
          </div>
        </div>

        {/* YouTube grid */}
        <p className="font-inter text-xs text-white/25 tracking-[0.12em] uppercase mb-5">
          On YouTube
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {YOUTUBE_VIDEOS.map((video) => (
            <a
              key={video.id}
              href={video.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden aspect-video block"
            >
              {/* Thumbnail */}
              <Image
                src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, 25vw"
                unoptimized
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
              {/* Play icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                    <path d="M0 0L10 6L0 12V0Z" />
                  </svg>
                </div>
              </div>
              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-inter text-[9px] font-semibold text-white leading-tight tracking-wide line-clamp-2">
                  {video.label.replace(/\n/g, " · ")}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
