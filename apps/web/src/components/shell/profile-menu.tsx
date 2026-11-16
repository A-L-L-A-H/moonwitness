"use client";

import Link from "next/link";
import { WitnessAvatar } from "@moonwitness/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@moonwitness/ui";

interface ProfileMenuProps {
  open: boolean;
  onToggle: () => void;
  identity: string;
  role: string;
  onExit: () => void;
  avatarSeed?: string;
}

export function ProfileMenu({
  open,
  onToggle,
  identity,
  role,
  onExit,
  avatarSeed,
}: ProfileMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onToggle}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Profile menu"
          className="flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--panel-2)]"
        >
          <WitnessAvatar
            seed={avatarSeed ?? identity}
            size={32}
            alt=""
            className="rounded-full border-2 border-[var(--pink)]"
            options={{ radius: 50 }}
          />
          <span className="hidden text-left md:block">
            <span className="block max-w-[140px] truncate text-xs font-bold text-white">
              {identity}
            </span>
            <span className="block text-[10px] text-zinc-500">{role}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2 min-w-[12rem]" side="top" align="end" sideOffset={8}>
        <div className="border-b border-[var(--line)] px-3 py-2">
          <p className="truncate text-xs font-bold text-white">{identity}</p>
          <p className="text-[10px] text-zinc-500">Authorized crew</p>
        </div>
        <DropdownMenuSeparator />
        <Link
          href="/dock"
          className="block min-h-11 rounded px-3 py-2 text-xs text-zinc-300 hover:bg-[var(--panel-2)] hover:text-white"
        >
          Project Universe
        </Link>
        <Link
          href="/id-lab"
          className="block min-h-11 rounded px-3 py-2 text-xs text-[var(--yellow)] hover:bg-[var(--panel-2)] hover:text-white"
        >
          ID Lab — your witness face
        </Link>
        <Link
          href="/"
          className="block min-h-11 rounded px-3 py-2 text-xs text-zinc-300 hover:bg-[var(--panel-2)] hover:text-white"
        >
          Public site
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onExit}
          className="text-[var(--pink)] hover:bg-[var(--panel-2)]"
        >
          Exit the shadow →
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
