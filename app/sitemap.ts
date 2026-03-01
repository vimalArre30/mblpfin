import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { BRAND } from "@/lib/constants";

/**
 * Generates the XML sitemap for the site.
 * Next.js serves this automatically at /sitemap.xml.
 *
 * Includes:
 * - Homepage
 * - Blog index (/blog)
 * - All published blog posts (/blog/[slug])
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BRAND.url}/blog/${post.slug}`,
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
      url: `${BRAND.url}/blog`,
      lastModified: latestPostDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...postEntries,
  ];
}
