import type { Metadata } from "next";
import localFont from "next/font/local";
import { SkinRoot } from "@moonwitness/ui/imperium";
import { SanctuaryLocaleProvider } from "@/lib/sanctuary-locale";
import "./globals.css";

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
    template: "%s | A-L-L-A-H.COM",
  },
  description:
    "In the Name of Allah. A-L-L-A-H.COM (Accountable Life, Learning & Action Hub) — Empire of the Light. A neutral sanctuary uniting witness chronicles, comparative study across Taurat, Zabur, Injīl & Al-Qur’ān, explainable M-Time, and open engineering.",
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
      "Neutral monocentric sanctuary uniting four revealed scriptural witnesses (Taurat, Zabur, Injīl, Al-Qur’ān), explainable calendrics, and accountable craft.",
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
      "Neutral sanctuary uniting Taurat, Zabur, Injīl & Al-Qur’ān comparative study, M-Time calendrics, and open engineering.",
    images: ["/og-empire-light.jpg"],
  },
  other: {
    "page-type": "software",
    "site-kind": "software",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-type="software"
      data-radius="soft"
      data-buttons="solid"
      data-motion="live"
      className={`min-h-screen antialiased ${cinzel.variable}`}
    >
      <body className="min-h-screen antialiased bg-[var(--dna-canvas,#08090d)] text-[var(--dna-text,#fff8e8)]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:border-2 focus:border-[var(--dna-accent,#f6d438)] focus:bg-[var(--dna-canvas,#08090d)] focus:px-4 focus:py-2 focus:font-sans focus:text-xs focus:font-bold focus:tracking-[0.12em] focus:text-[var(--dna-text,#fff8e8)] focus:uppercase"
        >
          Skip to main content
        </a>
        <SkinRoot dnaId="01-imperium-lumen">
          <SanctuaryLocaleProvider>{children}</SanctuaryLocaleProvider>
        </SkinRoot>
      </body>
    </html>
  );
}
