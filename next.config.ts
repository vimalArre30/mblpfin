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
