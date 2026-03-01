import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import type { PostMeta } from "@/lib/blog";
import { BRAND } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// In Next.js 15+, route params are passed as a Promise.
type PageProps = {
  params: Promise<{ slug: string }>;
};

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------

/**
 * Tells Next.js which slugs to pre-render at build time.
 * Only published posts are included — unpublished posts return 404.
 */
export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

// ---------------------------------------------------------------------------
// SEO — dynamic per post
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return {};

  const url = `${BRAND.url}/writing/${post.slug}`;

  return {
    title: `${post.title} | Mr. Bottom Line`,
    description: post.excerpt,
    metadataBase: new URL(BRAND.url),
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: BRAND.name,
      type: "article",
      publishedTime: post.date,
      authors: ["Vimal"],
      // Fall back to the site OG image when the post has no cover image.
      images: [
        {
          url: post.coverImage ?? "https://www.mrbottomline.club/og-image.png",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage ?? "https://www.mrbottomline.club/og-image.png"],
    },
    robots: { index: true, follow: true },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "2025-02-03" → "3 February 2025" */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Returns up to `limit` published posts from the same category, excluding the current slug. */
function getRelatedPosts(allPosts: PostMeta[], currentSlug: string, category: string, limit = 2): PostMeta[] {
  return allPosts
    .filter((p) => p.slug !== currentSlug && p.category === category)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Sub-components (Server-side, no interactivity needed)
// ---------------------------------------------------------------------------

function RelatedPostCard({ post }: { post: PostMeta }) {
  return (
    <Link
      href={`/writing/${post.slug}`}
      className="group flex flex-col bg-white rounded-2xl p-7 border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-navy/60">
          {post.category}
        </span>
        <span className="font-inter text-xs text-body/40">{post.readTime}</span>
      </div>
      <h3 className="font-playfair text-lg font-bold text-ink leading-snug mb-3 group-hover:text-navy transition-colors duration-150">
        {post.title}
      </h3>
      <p className="font-inter text-body text-[13px] leading-relaxed flex-1 mb-5">
        {post.excerpt}
      </p>
      <span className="font-inter text-sm font-semibold text-navy group-hover:text-navy-dark transition-colors duration-150">
        Read →
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const allPosts = getAllPosts();
  const relatedPosts = getRelatedPosts(allPosts, post.slug, post.category);

  // ── JSON-LD structured data (Article schema) ───────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    url: `${BRAND.url}/writing/${post.slug}`,
    author: {
      "@type": "Person",
      name: "Vimal",
      url: BRAND.url,
    },
    publisher: {
      "@type": "Organization",
      name: "Mr. Bottom Line",
      url: BRAND.url,
    },
    ...(post.coverImage && { image: post.coverImage }),
  };

  return (
    <>
      <Navbar />

      {/* JSON-LD — placed in body; Google crawls it from anywhere in the HTML */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="bg-white">
        <div className="max-w-[720px] mx-auto px-6 lg:px-8 py-12 lg:py-20">

          {/* ── Back link ── */}
          <Link
            href="/writing"
            className="inline-flex items-center gap-2 font-inter text-sm font-medium text-body/60 hover:text-navy transition-colors duration-150 mb-10 group"
          >
            <span className="transition-transform duration-150 group-hover:-translate-x-0.5">←</span>
            Back to Writing
          </Link>

          {/* ── Article header ── */}
          <header className="mb-10">
            {/* Category + read time */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-inter text-xs font-semibold uppercase tracking-[0.15em] text-navy">
                {post.category}
              </span>
              <span className="text-border select-none">·</span>
              <span className="font-inter text-xs text-body/50">{post.readTime}</span>
            </div>

            {/* Title */}
            <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold text-ink leading-tight tracking-tight mb-6">
              {post.title}
            </h1>

            {/* Excerpt / lead */}
            <p className="font-inter text-lg text-body/80 leading-relaxed mb-6">
              {post.excerpt}
            </p>

            {/* Date */}
            <div className="flex items-center gap-2 pb-8 border-b border-border">
              <time
                dateTime={post.date}
                className="font-inter text-sm text-body/50"
              >
                {formatDate(post.date)}
              </time>
            </div>
          </header>

          {/* ── Article body ── */}
          {/* prose-lg: 18px base, 1.75 line-height baseline (we override to 1.85 in config) */}
          {/* max-w-none: width is controlled by the parent container, not prose itself */}
          <article
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* ── End-of-article divider ── */}
          <div className="mt-16 pt-8 border-t border-border">
            <Link
              href="/writing"
              className="inline-flex items-center gap-2 font-inter text-sm font-medium text-body/50 hover:text-navy transition-colors duration-150 group"
            >
              <span className="transition-transform duration-150 group-hover:-translate-x-0.5">←</span>
              All Writing
            </Link>
          </div>

          {/* ── Related posts ── */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <p className="font-inter text-xs font-semibold uppercase tracking-[0.15em] text-navy mb-2">
                You might also like
              </p>
              <h2 className="font-playfair text-2xl font-bold text-ink mb-8">
                More on {post.category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {relatedPosts.map((related) => (
                  <RelatedPostCard key={related.slug} post={related} />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}
