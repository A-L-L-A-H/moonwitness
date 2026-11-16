"use client";

import Link from "next/link";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";
import { OctagramMandalaIcon } from "./sacred-icons";
import { SanctuaryIdentityControl } from "./sanctuary-identity-control";

export function SiteSubpageHeader({
  activeRoute,
}: {
  readonly activeRoute: "scriptures" | "codex" | "mtime";
}) {
  const { locale, toggleLocale } = useSanctuaryLocale();

  const links = [
    { href: "/", id: "home", label: locale === "id" ? "GERBANG UTAMA" : "GATE HOME" },
    {
      href: "/scriptures",
      id: "scriptures",
      label: locale === "id" ? "EMPAT KITAB" : "FOUR SCRIPTURES",
    },
    { href: "/codex", id: "codex", label: "CODEX DOORS" },
    { href: "/mtime", id: "mtime", label: "M-TIME · MĪQĀT" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-[#d6b46c]/25 bg-[#040509]/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Link href="/" className="flex min-h-[44px] items-center gap-3 focus:outline-none">
          <OctagramMandalaIcon className="h-8 w-8 shrink-0" />
          <div className="flex flex-col">
            <span className="font-monument text-sm tracking-[0.16em] text-[#fff6df]">
              A-L-L-A-H.COM
            </span>
            <span className="font-mono text-[9.5px] tracking-[0.2em] text-[#dfc07b] uppercase">
              EMPIRE OF THE LIGHT
            </span>
          </div>
        </Link>

        <nav aria-label="Sanctuary Portal Links" className="flex flex-wrap items-center gap-2">
          {links.map((item) => {
            const isCurrent = item.id === activeRoute;
            return (
              <Link
                key={item.id}
                href={item.href}
                data-active={isCurrent ? "true" : "false"}
                className={`btn-luxe-secondary inline-flex items-center px-3.5 py-1.5 font-mono text-[10px] tracking-[0.16em] uppercase ${
                  isCurrent ? "text-[#fff8e6]" : "text-[#d8ceba] hover:text-[#fff6df]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggleLocale}
            aria-label={locale === "en" ? "Switch to Indonesian" : "Ganti ke Bahasa Inggris"}
            className="btn-luxe-secondary px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-[#f5dfa6] uppercase cursor-pointer"
          >
            {locale.toUpperCase()}
          </button>
          <SanctuaryIdentityControl />
        </nav>
      </div>
    </header>
  );
}
