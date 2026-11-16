"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { navHref, type NavItem } from "./nav-items";
import { Crown, Smiley } from "@moonwitness/ui/icons";
import { Stack } from "@moonwitness/ui";
import { artSrc } from "@/lib/art";
import { IMPERIUM_GATE_URL } from "@/lib/sanctuary-url";

interface SidebarProps {
  items: NavItem[];
  active: string;
  activeSection: string | null;
  onNavigate?: () => void;
  brandHref?: string;
  subtitle?: string;
  navLabel?: string;
  accentColor?: "pink" | "blue";
  footerSlot?: ReactNode;
}

export function Sidebar({
  items,
  active,
  activeSection,
  onNavigate,
  brandHref = "/",
  subtitle = "Empire of the light",
  navLabel = "Empire",
  accentColor = "pink",
  footerSlot,
}: SidebarProps) {
  const activeClass =
    accentColor === "blue"
      ? "bg-[var(--blue)] font-bold text-black shadow-[3px_3px_0_rgba(0,0,0,0.5)]"
      : "bg-[var(--pink)] font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.5)]";

  return (
    <div className="flex h-full flex-col">
      <Link href={brandHref} className="block border-b-2 border-[var(--line)] px-5 py-5">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-9 text-[var(--yellow)]" />
          <span className="font-brush text-2xl leading-none text-white">
            MOON
            <span className={accentColor === "blue" ? "text-[var(--blue)]" : "text-[var(--pink)]"}>
              WITNESS
            </span>
          </span>
        </div>
        <div className="mt-2 font-hand text-base text-zinc-400">{subtitle}</div>
      </Link>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label={navLabel}>
        <Stack gap={1}>
          {items.map((item) => {
            const isActive = item.id === active || item.id === activeSection;
            return (
              <Link
                key={item.id}
                href={navHref(item)}
                onClick={() => onNavigate?.()}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? activeClass
                    : "text-zinc-300 hover:bg-[var(--panel-2)] hover:text-white"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </Stack>
      </nav>
      <div className="border-t-2 border-[var(--line)] p-4">
        <a
          href={IMPERIUM_GATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 flex min-h-10 items-center justify-between border border-[var(--line)] bg-black/25 px-3 py-1.5 font-mono text-[11px] tracking-wider text-[var(--yellow)] transition-colors hover:border-[var(--yellow)] hover:text-white"
        >
          <span>IMPERIUM GATE</span>
          <span>↗</span>
        </a>
        <div className="relative mb-3 hidden h-28 overflow-hidden border border-[var(--line)] lg:block">
          <Image
            src={artSrc("sidebar-witness")}
            alt=""
            fill
            sizes="240px"
            className="object-cover object-[50%_18%] opacity-85"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[rgba(7,7,12,0.85)] via-transparent to-transparent"
          />
          <span className="sticker sticker-yellow absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-1 font-hand text-[11px] leading-tight">
            WITNESS THE REAL.
          </span>
        </div>
        {footerSlot ?? (
          <>
            <div className="sticker -rotate-2 px-3 pb-4 pt-2 font-hand text-base font-bold leading-tight">
              DIFFERENT PEOPLE.
              <br />
              SAME SKY.
              <br />
              STORIES BEYOND BORDERS.
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-400">
              <Smiley className="h-4 w-4 text-[var(--yellow)]" />
              WITNESS THE REAL.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
