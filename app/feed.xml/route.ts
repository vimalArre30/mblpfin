import { getAllPosts } from "@/lib/blog";
import { BRAND, LINKS } from "@/lib/constants";

// Re-validate the feed at most once per hour on Vercel's edge cache.
export const revalidate = 3600;

/**
 * RSS 2.0 feed — served at /feed.xml.
 *
 * Includes all published posts with full metadata so RSS readers and
 * aggregators (Feedly, Reeder, Substack import, etc.) can discover content.
 *
 * The <atom:link> self-reference is required by the RSS 2.0 specification
 * and is checked by feed validators.
 */
export async function GET() {
  const posts = getAllPosts();

  const items = posts
    .map((post) => {
      const url = `${BRAND.url}/writing/${post.slug}`;
      // pubDate must be RFC 822 format — toUTCString() produces exactly that.
      const pubDate = new Date(post.date).toUTCString();

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${post.category}</category>
      <author>${LINKS.contactEmail} (Vimal)</author>
    </item>`;
    })
    .join("");

  const lastBuildDate = posts[0]
    ? new Date(posts[0].date).toUTCString()
    : new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <channel>
    <title>${BRAND.name}</title>
    <link>${BRAND.url}</link>
    <description>Long reads on money, time, and decisions that compound.</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${BRAND.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BRAND.url}/og-image.png</url>
      <title>${BRAND.name}</title>
      <link>${BRAND.url}</link>
    </image>${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Browsers and proxies may cache for 1 hour; after that serve stale
      // while revalidating in the background.
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
