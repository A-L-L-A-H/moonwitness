"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { Crown, Menu, SearchIcon } from "@moonwitness/ui/icons";
import { Input } from "@moonwitness/ui";
import { SkinSwitcher } from "@/components/skin-switcher";

interface TopbarProps {
  breadcrumb: string;
  search: { value: string; onChange: (v: string) => void; placeholder: string };
  onOpenSidebar: () => void;
  notifications: ReactNode;
  profileMenu: ReactNode;
  containerRef: RefObject<HTMLDivElement | null>;
  rootLabel?: string;
  rootHref?: string;
}

export function Topbar({
  breadcrumb,
  search,
  onOpenSidebar,
  notifications,
  profileMenu,
  containerRef,
  rootLabel = "The Empire",
  rootHref = "/",
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b-2 border-[var(--line)] bg-[rgba(11,11,16,0.9)] px-4 backdrop-blur-md">
      <button
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-1.5 text-zinc-300 lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open sidebar"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="hidden items-center gap-2 text-sm text-zinc-400 sm:flex">
        <Crown className="h-4 w-6 text-[var(--blue)]" />
        <Link href={rootHref} className="hover:text-white">
          {rootLabel}
        </Link>
        <span aria-hidden>›</span>
        <span className="text-zinc-200">{breadcrumb}</span>
      </div>

      <div className="relative ml-auto w-full max-w-xs sm:max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={search.placeholder}
          aria-label={search.placeholder}
          className="min-h-11 rounded-full py-2 pl-9 pr-4 text-xs"
        />
      </div>

      <div className="relative flex items-center gap-1" ref={containerRef}>
        <SkinSwitcher />
        {notifications}
        {profileMenu}
      </div>
    </header>
  );
}
