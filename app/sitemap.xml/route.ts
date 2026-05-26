/**
 * Sitemap Route Handler — /sitemap.xml
 *
 * Replaces the previous app/sitemap.ts metadata route which, even with
 * `force-static`, caused Next.js 16 to set:
 *   cache-control: public, max-age=0, must-revalidate
 * That tells Vercel's CDN never to cache the sitemap, so every Googlebot
 * request cold-invokes a serverless function — causing intermittent
 * timeouts and the persistent "Couldn't fetch" status in Google Search
 * Console despite the URL being publicly reachable in a browser.
 *
 * This Route Handler fixes both problems:
 *   1. Explicit Cache-Control: CDN caches for 24 hrs; browsers for 1 hr.
 *   2. Explicit Content-Type: application/xml — no ambiguity.
 *   3. No RSC Vary headers (route handlers never add them).
 *   4. Full control over which URLs are included.
 *
 * Add new static routes to STATIC_URLS below. Article URLs are generated
 * automatically from getAllPosts() — just add a new .md file to
 * /content/blog/ with `published: true` and it will appear on next deploy.
 */

import { getAllPosts } from "@/lib/blog";
import { BRAND } from "@/lib/constants";

// Cache at CDN edge for 24 hrs; browsers revalidate after 1 hr.
// Vercel serves from edge on cache HIT — no cold-start, no timeout.
export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

type UrlEntry = {
  url: string;
  lastmod: string;   // YYYY-MM-DD
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;  // "0.0" – "1.0" as string
};

function renderUrl({ url, lastmod, changefreq, priority }: UrlEntry): string {
  return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const posts = getAllPosts();
  const latestPostDate = posts[0]?.date ?? "2026-05-17";

  const staticUrls: UrlEntry[] = [
    {
      url: `${BRAND.url}/`,
      lastmod: "2026-05-02",
      changefreq: "weekly",
      priority: "1.0",
    },
    {
      url: `${BRAND.url}/pro`,
      lastmod: "2026-05-15",
      changefreq: "monthly",
      priority: "0.9",
    },
    {
      url: `${BRAND.url}/writing`,
      lastmod: latestPostDate,
      changefreq: "weekly",
      priority: "0.6",
    },
    ...posts.map<UrlEntry>((post) => ({
      url: `${BRAND.url}/writing/${post.slug}`,
      lastmod: post.date,
      changefreq: "monthly",
      priority: "0.8",
    })),
    {
      url: `${BRAND.url}/privacy`,
      lastmod: "2026-05-02",
      changefreq: "yearly",
      priority: "0.3",
    },
    {
      url: `${BRAND.url}/delete-account`,
      lastmod: "2026-05-10",
      changefreq: "yearly",
      priority: "0.3",
    },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.map(renderUrl).join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // CDN caches for 24 hrs; browsers revalidate after 1 hr.
      // stale-while-revalidate means Vercel serves the old version
      // while quietly fetching a fresh one in the background.
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
