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
 *
 * IMPORTANT: This route is forced static so the sitemap is generated ONCE
 * at build time and served as a stable file. Earlier dynamic generation
 * caused Next.js 15 to inject RSC `vary` headers (rsc, next-router-*)
 * which confused Google's sitemap fetcher and produced a persistent
 * "Couldn't fetch" status in Google Search Console even though the URL
 * was publicly reachable. Static generation removes those headers.
 *
 * To force a regenerate without changing content, push an empty commit
 * or bump any of the stable `lastModified` constants below.
 */
export const dynamic = "force-static";

// Stable last-modified dates per URL — only bump these when the page's
// actual content meaningfully changes. NEVER use `new Date()` here:
// it makes Next.js treat the route as dynamic and re-adds the RSC `vary`
// headers that confuse Google's sitemap parser.
const HOMEPAGE_LAST_MODIFIED = new Date("2026-05-02"); // Day 53 launch
const PRO_LAST_MODIFIED      = new Date("2026-05-15"); // Day 58 metadata polish
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

  // Use the most recent post's date as the /writing index's lastModified —
  // the index page itself changes only when new posts are added.
  const latestPostDate = posts[0]
    ? new Date(posts[0].date)
    : HOMEPAGE_LAST_MODIFIED;

  return [
    {
      // Trailing slash on root URL — matches Google's sitemap example convention
      // and avoids any ambiguity with the homepage canonical.
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
