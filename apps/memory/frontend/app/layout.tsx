import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "How U Remind Me — a MoonWitness product",
  description:
    "Search chat exports, find useful knowledge, and trace each record to its source messages.",
  applicationName: "How U Remind Me by MoonWitness",
  openGraph: {
    title: "How U Remind Me — a MoonWitness product",
    description:
      "Search chat exports, find useful knowledge, and trace each record to its source messages.",
    type: "website",
    siteName: "MoonWitness",
  },
  other: {
    "page-type": "software",
    "site-kind": "software",
  },
};

export const viewport: Viewport = {
  themeColor: "#100e0b",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-type="software" suppressHydrationWarning>
      <body>
        <Script
          id="howu-remind-me-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              'try { const saved = localStorage.getItem("mw-memory-theme"); document.documentElement.dataset.theme = saved === "light" ? "light" : "dark"; } catch { document.documentElement.dataset.theme = "dark"; }',
          }}
        />
        {children}
      </body>
    </html>
  );
}
