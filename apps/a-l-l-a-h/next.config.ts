import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@moonwitness/ui",
    "@moonwitness/types",
  ],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
