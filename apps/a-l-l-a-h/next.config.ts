import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@moonwitness/canon", "@moonwitness/ui", "@moonwitness/types"],
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    const apiUrl = process.env.API_INTERNAL_URL?.trim();
    if (!apiUrl) {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: apiUrl.replace(/\/+$/, "") + "/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
