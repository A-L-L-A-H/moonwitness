import type { Metadata } from "next";
import localFont from "next/font/local";
import { SkipLink } from "@moonwitness/ui";
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
  title: {
    default: "A-L-L-A-H.COM — Empire of the Light",
    template: "%s | A-L-L-A-H.COM",
  },
  description:
    "In the Name of Allah. A-L-L-A-H.COM — Empire of the Light. A world to witness. A world to learn. A world to build.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`min-h-screen antialiased ${cinzel.variable}`}>
      <body className="min-h-screen antialiased bg-[#040509] text-[#f5efe2]">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
