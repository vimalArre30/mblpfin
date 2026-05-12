import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { BRAND } from "@/lib/constants";

/**
 * Generates the XML sitemap for the site.
 * Next.js serves this automatically at /sitemap.xml.
 *
 * Includes:
 * - Homepage
 * - /pro (MBL PFin Pro subscription page — conversion target)
 * - /writing index + all published blog posts (/writing/[slug])
 * - /privacy and /delete-account (low priority but should be indexed)
 *
 * Private app routes (/tracker/*) are intentionally excluded — blocked
 * via public/robots.txt + per-layout robots:{index:false}.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BRAND.url}/writing/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Use the most recent post's date as the blog index lastModified — more
  // accurate than new Date() since the index only changes when posts are added.
  const latestPostDate = posts[0] ? new Date(posts[0].date) : new Date();

  return [
    {
      url: BRAND.url,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BRAND.url}/pro`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BRAND.url}/writing`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...postEntries,
    {
      url: `${BRAND.url}/privacy`,
      lastModified: new Date("2026-05-02"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BRAND.url}/delete-account`,
      lastModified: new Date("2026-05-10"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
