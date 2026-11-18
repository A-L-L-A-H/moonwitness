"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { navHref, type NavItem } from "./nav-items";
import {
  Compass,
  Edit,
  FileText,
  Home,
  Image as ImageIcon,
  Layout,
  MemoryTapeNode,
  MtimeHorizon,
  RadiusKey,
  ScriptureFolio,
  Settings,
  SkinPalette,
  Smiley,
  SnmpProbe,
  StorageBucket,
  SyslogStream,
  Terminal,
  User,
  VpnTunnel,
  type DnaIconProps,
} from "@moonwitness/ui/icons";
import type { ComponentType } from "react";
import { DnaBrandLogo, Stack, useSkin, type BrandLogoId } from "@moonwitness/ui";
import { artSrc } from "@/lib/art";
import { SanctuaryGateLink } from "@/components/sanctuary-gate-link";

const SIDEBAR_ICON_MAP: Record<string, ComponentType<DnaIconProps>> = {
  dashboard: Home,
  "story-studio": Edit,
  episodes: FileText,
  "poster-forge": ImageIcon,
  collections: Layout,
  research: Compass,
  crew: User,
  "mission-log": Terminal,
  intelligence: MtimeHorizon,
  "id-lab": ScriptureFolio,
  "skin-lab": SkinPalette,
  archive: MemoryTapeNode,
  settings: Settings,
  control: Settings,
  vpn: VpnTunnel,
  syslog: SyslogStream,
  snmp: SnmpProbe,
  storage: StorageBucket,
  radius: RadiusKey,
};

function SidebarItemIcon({ id }: { readonly id: string }) {
  const Icon = SIDEBAR_ICON_MAP[id] ?? Compass;
  return <Icon className="h-5 w-5 shrink-0" />;
}

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
  const { dnaId } = useSkin();
  const activeClass =
    accentColor === "blue"
      ? "bg-[var(--primary)] font-bold text-[var(--primary-foreground)] shadow-[3px_3px_0_rgba(0,0,0,0.5)]"
      : "bg-[var(--primary)] font-bold text-[var(--primary-foreground)] shadow-[3px_3px_0_rgba(0,0,0,0.5)]";

  return (
    <div className="flex h-full flex-col text-[var(--foreground)]">
      <Link href={brandHref} className="block border-b-2 border-[var(--border)] px-5 py-5">
        <div className="flex items-center gap-2.5">
          <DnaBrandLogo id={(dnaId as BrandLogoId) ?? "moonwitness"} variant="mark" size={30} decorative />
          <span className="font-brush text-2xl leading-none text-[var(--foreground)]">
            MOON
            <span className="text-[var(--primary)]">
              WITNESS
            </span>
          </span>
        </div>
        <div className="mt-2 font-hand text-base text-[var(--muted-foreground)]">{subtitle}</div>
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
                    : "text-[var(--foreground)]/80 hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <SidebarItemIcon id={item.id} />
                {item.label}
              </Link>
            );
          })}
        </Stack>
      </nav>
      <div className="border-t-2 border-[var(--border)] p-4">
        <div className="mb-3 flex flex-col gap-2">
          <SanctuaryGateLink className="flex min-h-10 items-center justify-between border border-[var(--border)] bg-[var(--background)]/40 px-3 py-1.5 font-mono text-[11px] tracking-wider text-[var(--primary)] transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)]">
            <span>IMPERIUM GATE</span>
            <span>↗</span>
          </SanctuaryGateLink>
          <Link
            href="/moonwitness"
            onClick={() => onNavigate?.()}
            className="flex min-h-10 items-center justify-between border border-[var(--border)] bg-[var(--background)]/40 px-3 py-1.5 font-mono text-[11px] tracking-wider text-[var(--foreground)]/80 transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)]"
          >
            <span>MOONWITNESS</span>
            <span>↗</span>
          </Link>
        </div>
        <div className="relative mb-3 hidden h-28 overflow-hidden border border-[var(--border)] lg:block">
          <Image
            src={artSrc("sidebar-witness")}
            alt=""
            fill
            sizes="240px"
            className="object-cover object-[50%_18%] opacity-85"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/90 via-transparent to-transparent"
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
            <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--muted-foreground)]">
              <Smiley className="h-4 w-4 text-[var(--primary)]" />
              WITNESS THE REAL.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
