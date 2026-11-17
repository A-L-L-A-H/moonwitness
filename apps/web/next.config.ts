import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  transpilePackages: [
    "@moonwitness/canon",
    "@moonwitness/ui",
    "@moonwitness/core",
    "@moonwitness/types",
    "@moonwitness/assets",
    "@moonwitness/avatars",
    "@tanstack/react-query",
  ],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [480, 960, 1440, 1920],
    imageSizes: [240, 480],
    minimumCacheTTL: 31_536_000,
  },
};

export default nextConfig;
