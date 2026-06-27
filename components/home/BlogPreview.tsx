import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export default function BlogPreview() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <section className="bg-[#0A1628] border-b border-white/[0.07]">
      <div className="max-w-content mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="font-inter text-xs text-white/30 tracking-[0.15em] uppercase mb-3">
              From the blog
            </p>
            <h2 className="font-playfair text-2xl lg:text-3xl font-bold text-white">
              Thinking on money and life.
            </h2>
          </div>
          <Link
            href="/writing"
            className="hidden sm:block font-inter text-sm text-white/40 hover:text-white transition-colors"
          >
            All articles →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/writing/${post.slug}`}
              className="group bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-3 hover:bg-white/[0.05] hover:border-white/[0.12] transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="font-inter text-[10px] text-white/25 bg-white/[0.05] px-2 py-0.5 rounded tracking-wide">
                  {post.category}
                </span>
                <span className="font-inter text-[10px] text-white/20">
                  {post.readTime}
                </span>
              </div>
              <h3 className="font-playfair text-base font-semibold text-white/80 leading-snug group-hover:text-white transition-colors">
                {post.title}
              </h3>
              <p className="font-inter text-xs text-white/35 leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
              <span className="font-inter text-xs text-white/25 group-hover:text-white/50 transition-colors mt-auto">
                Read →
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/writing"
          className="sm:hidden mt-6 block font-inter text-sm text-white/40 hover:text-white transition-colors"
        >
          All articles →
        </Link>
      </div>
    </section>
  );
}
