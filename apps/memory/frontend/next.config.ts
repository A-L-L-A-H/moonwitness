import type { NextConfig } from "next";

function extractOrigin(rawUrl: string | undefined, fallback: string): string {
  const candidate = rawUrl?.trim() || fallback;
  try {
    return new URL(candidate).origin;
  } catch {
    return fallback;
  }
}

const apiOrigin = extractOrigin(process.env.NEXT_PUBLIC_API_BASE_URL, "http://localhost:8000");
const midOrigin = extractOrigin(
  process.env.NEXT_PUBLIC_MID_ISSUER_URL,
  "https://id.moonwitness.biz.id",
);
const connectSources = Array.from(
  new Set([
    "'self'",
    apiOrigin,
    midOrigin,
    "https://id.moonwitness.biz.id",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
  ]),
).join(" ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    cpus: 1,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "media-src 'self' blob:",
              `connect-src ${connectSources}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              `form-action 'self' ${midOrigin} https://id.moonwitness.biz.id`,
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
