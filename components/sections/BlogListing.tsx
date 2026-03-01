"use client";

import { useState } from "react";
import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import type { PostMeta, Category } from "@/lib/blog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlogListingProps {
  posts: PostMeta[];
  categories: Category[];
}

// Canonical display order for category filters.
// Categories not yet in use simply won't appear since getAllCategories() only
// returns categories that have at least one published post.
const CATEGORY_ORDER: Category[] = [
  "Personal Finance",
  "Philosophy",
  "Lifestyle",
  "Technology",
  "Entrepreneurship",
  "Farmstay",
];

type FilterValue = "All" | Category;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Formats a YYYY-MM-DD date string as "Month YYYY" (e.g. "February 2025"). */
function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterButton({ label, active, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-full font-inter text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2",
        active
          ? "bg-navy text-white shadow-sm"
          : "border border-border text-body bg-white hover:border-navy hover:text-navy",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

interface PostCardProps {
  post: PostMeta;
}

function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/writing/${post.slug}`}
      className="group flex flex-col bg-white rounded-2xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      {/* Category + read time */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-inter text-xs font-semibold uppercase tracking-[0.12em] text-navy/60">
          {post.category}
        </span>
        <span className="font-inter text-xs text-body/40 tabular-nums">
          {post.readTime}
        </span>
      </div>

      {/* Title */}
      <h2 className="font-playfair text-xl font-bold text-ink leading-snug mb-3 group-hover:text-navy transition-colors duration-150">
        {post.title}
      </h2>

      {/* Excerpt */}
      <p className="font-inter text-body text-[14px] leading-relaxed flex-1 mb-6">
        {post.excerpt}
      </p>

      {/* Date + Read link */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="font-inter text-xs text-body/40">
          {formatDate(post.date)}
        </span>
        <span className="font-inter text-sm font-semibold text-navy group-hover:text-navy-dark transition-colors duration-150">
          Read →
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function BlogListing({ posts, categories }: BlogListingProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("All");

  // Sort categories into canonical order, omitting any that have no posts yet.
  const orderedCategories = CATEGORY_ORDER.filter((cat) =>
    categories.includes(cat)
  );

  const visiblePosts =
    activeFilter === "All"
      ? posts
      : posts.filter((post) => post.category === activeFilter);

  return (
    <section className="bg-white min-h-screen py-20 lg:py-28">
      <div className="max-w-content mx-auto px-6 lg:px-8">

        {/* ── Page header ── */}
        <div className="mb-12 lg:mb-16">
          <SectionLabel>LONG-FORM THINKING</SectionLabel>
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ink tracking-tight mt-2 mb-4">
            Writing
          </h1>
          <p className="font-inter text-body text-lg leading-relaxed max-w-xl">
            Long reads on money, time, and decisions that compound.
          </p>
        </div>

        {/* ── Category filters ── */}
        <div
          className="flex flex-wrap gap-2 mb-12"
          role="group"
          aria-label="Filter posts by category"
        >
          <FilterButton
            label="All"
            active={activeFilter === "All"}
            onClick={() => setActiveFilter("All")}
          />
          {orderedCategories.map((cat) => (
            <FilterButton
              key={cat}
              label={cat}
              active={activeFilter === cat}
              onClick={() => setActiveFilter(cat)}
            />
          ))}
        </div>

        {/* ── Post grid ── */}
        {visiblePosts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-inter text-body/50 text-[15px]">
              No posts in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visiblePosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
