import type { Metadata } from "next";
import localFont from "next/font/local";
import { SkipLink } from "@moonwitness/ui";
import "./globals.css";

// Saksi — proprietary MoonWitness type family (see packages/assets/fonts).
const brush = localFont({
  src: [
    { path: "../../public/fonts/saksi-marker-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/saksi-marker-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-brush",
  display: "swap",
});
const hand = localFont({
  src: [
    { path: "../../public/fonts/saksi-hand-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/saksi-hand-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-hand",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "../../public/fonts/saksi-mono-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/saksi-mono-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});
const cinzel = localFont({
  src: [
    { path: "../../public/fonts/cinzel-400.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/cinzel-600.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/cinzel-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://a-l-l-a-h.com"),
  title: {
    default: "A-L-L-A-H.COM — Empire of the Light",
    template: "%s | Moonwitness Ecosystem",
  },
  description:
    "In the Name of Allah. A-L-L-A-H.COM (Accountable Life, Learning & Action Hub) — Empire of the Light & MoonWitness Universe.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "https://a-l-l-a-h.com",
    siteName: "A-L-L-A-H.COM — Empire of the Light",
    title: "A-L-L-A-H.COM — Empire of the Light",
    description:
      "Neutral monocentric sanctuary uniting four revealed scriptural witnesses (Taurat, Zabur, Injīl, Al-Qur’ān), explainable M-Time, and MoonWitness engineering.",
    images: [
      {
        url: "/og-empire-light.jpg",
        width: 1200,
        height: 630,
        alt: "A-L-L-A-H.COM — Empire of the Light",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "A-L-L-A-H.COM — Empire of the Light",
    description:
      "Neutral sanctuary uniting Taurat, Zabur, Injīl & Al-Qur’ān comparative study, M-Time calendrics, and open MoonWitness engineering.",
    images: ["/og-empire-light.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${brush.variable} ${hand.variable} ${mono.variable} ${cinzel.variable}`}
    >
      <body className="min-h-screen antialiased">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
