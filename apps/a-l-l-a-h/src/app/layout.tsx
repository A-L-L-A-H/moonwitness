import type { Metadata } from "next";
import localFont from "next/font/local";
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
    "In the Name of Allah. A-L-L-A-H.COM (Accountable Life, Learning & Action Hub) — Empire of the Light. A neutral sanctuary uniting witness chronicles, comparative study across Taurat, Zabur, Injīl & Al-Qur'ān, and sovereign engineering.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`min-h-screen antialiased ${cinzel.variable}`}>
      <body className="min-h-screen antialiased bg-[#040509] text-[#f5efe2]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:border focus:border-[#dfc07b] focus:bg-[#040509] focus:px-4 focus:py-2 focus:font-serif focus:text-xs focus:tracking-[0.2em] focus:text-[#fff6df] focus:uppercase"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
