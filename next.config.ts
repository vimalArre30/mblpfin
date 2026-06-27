import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["img.youtube.com"],
  },
  experimental: {
    staleTimes: {
      dynamic: 0, // never serve stale RSC payload for dynamic routes
    },
  },
  async headers() {
    return [
      {
        // Sitemap moved to /sitemap/sitemap.xml (nested route) to bypass
        // Next.js RSC vary header injection that caused GSC "Couldn't fetch".
        // Cache at Vercel edge for 24 hrs so Googlebot gets a fast CDN HIT
        // instead of cold-invoking a serverless function.
        source: "/sitemap/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // /pricing is the legacy entry point — /pro is canonical
      {
        source: "/pricing",
        destination: "/pro",
        permanent: true,
      },
      // /blog → /writing (canonical blog route)
      {
        source: "/blog",
        destination: "/writing",
        permanent: true,
      },
      {
        source: "/blog/:slug",
        destination: "/writing/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
