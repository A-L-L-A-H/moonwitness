import type { Metadata } from "next";
import { SkipLink } from "@moonwitness/ui";
import "./globals.css";

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
    <html lang="en" className="min-h-screen antialiased">
      <body className="min-h-screen antialiased bg-[#040509] text-[#f5efe2]">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
