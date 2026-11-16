import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@moonwitness/canon", "@moonwitness/ui", "@moonwitness/types"],
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    const apiUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3002";
    return [
      {
        source: "/api/v1/:path*",
        destination: apiUrl + "/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
