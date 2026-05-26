import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    domains: [],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    staleTimes: {
      dynamic: 0, // never serve stale RSC payload for dynamic routes
    },
  },
  async headers() {
    return [
      {
        // Override Next.js's default `max-age=0, must-revalidate` on the
        // sitemap so Vercel's CDN caches it at the edge for 24 hrs.
        // Without this, every Googlebot fetch cold-invokes a serverless
        // function, which can timeout and produce "Couldn't fetch" in GSC.
        source: "/sitemap.xml",
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
    ];
  },
};

export default nextConfig;
