import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { BRAND } from "@/lib/constants";

/**
 * Sitemap served at /sitemap/sitemap.xml
 *
 * WHY NESTED ROUTE (not app/sitemap.ts at /sitemap.xml):
 * Next.js metadata routes at the app root inject RSC `vary` headers
 * (rsc, next-router-state-tree, next-router-prefetch) even with
 * `force-static`. Googlebot's sitemap fetcher doesn't send those RSC
 * request headers, so the vary causes GSC to report "Couldn't fetch"
 * even though the URL is publicly reachable. Nesting the file under
 * app/sitemap/ serves it at a fresh URL that bypasses the RSC header
 * injection and busts GSC's cached failure for the old /sitemap.xml URL.
 *
 * Reference: https://github.com/vercel/next.js/issues/75836
 *
 * Includes:
 * - Homepage
 * - /pro (conversion target)
 * - /writing index + all published blog posts (/writing/[slug])
 * - /privacy and /delete-account
 *
 * Private app routes (/tracker/*) are excluded — blocked via
 * public/robots.txt + per-layout robots:{index:false}.
 *
 * Cache-Control is overridden via next.config.ts headers() to set
 * s-maxage=86400 so Vercel's CDN serves it from edge on cache HIT.
 */
export const dynamic = "force-static";

// Stable last-modified dates — only bump when page content meaningfully
// changes. NEVER use `new Date()` here: dynamic dates re-add RSC headers.
const HOMEPAGE_LAST_MODIFIED = new Date("2026-05-02");
const PRO_LAST_MODIFIED      = new Date("2026-05-15");
const PRIVACY_LAST_MODIFIED  = new Date("2026-05-02");
const DELETE_LAST_MODIFIED   = new Date("2026-05-10");

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BRAND.url}/writing/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const latestPostDate = posts[0]
    ? new Date(posts[0].date)
    : HOMEPAGE_LAST_MODIFIED;

  return [
    {
      url: `${BRAND.url}/`,
      lastModified: HOMEPAGE_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BRAND.url}/pro`,
      lastModified: PRO_LAST_MODIFIED,
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
      lastModified: PRIVACY_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BRAND.url}/delete-account`,
      lastModified: DELETE_LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
