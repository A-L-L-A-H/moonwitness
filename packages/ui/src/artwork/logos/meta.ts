import type { SVGProps } from "react";

export const BRAND_LOGO_IDS = [
  "moonwitness",
  "01-imperium-lumen",
  "02-lunar-chronicles",
  "03-rocksoul",
  "04-nexus-paradox",
  "05-riot-anarchy",
  "06-mycelium",
  "09-simpul-nusantara",
  "arsy",
  "memory",
  "mission-control",
  "dock-chronicle",
  "scriptures-codex",
  "mtime-horizon",
  "id-lab",
  "addon-studio",
  "shadow-frequency",
  "noc-gateway",
] as const;

export type BrandLogoId = (typeof BRAND_LOGO_IDS)[number];

export type BrandLogoVariant = "mark" | "lockup" | "wordmark" | "stamp";

export interface BrandLogoProps extends Omit<SVGProps<SVGSVGElement>, "children" | "id"> {
  variant?: BrandLogoVariant;
  size?: number | string;
  label?: string;
  decorative?: boolean;
}

export interface DnaBrandLogoProps extends BrandLogoProps {
  id: BrandLogoId;
}

interface LogoMeta {
  id: BrandLogoId;
  title: string;
  subtitle: string;
  defaultLabel: string;
}

export const LOGO_META: Record<BrandLogoId, LogoMeta> = {
  moonwitness: {
    id: "moonwitness",
    title: "MOONWITNESS",
    subtitle: "SOVEREIGN PLATFORM",
    defaultLabel: "MoonWitness brand logo",
  },
  "01-imperium-lumen": {
    id: "01-imperium-lumen",
    title: "IMPERIUM LUMEN",
    subtitle: "CITADEL ARCHITECTURE",
    defaultLabel: "Imperium Lumen brand logo",
  },
  "02-lunar-chronicles": {
    id: "02-lunar-chronicles",
    title: "LUNAR CHRONICLES",
    subtitle: "NOCTURNAL ARCHIVE",
    defaultLabel: "Lunar Chronicles brand logo",
  },
  "03-rocksoul": {
    id: "03-rocksoul",
    title: "ROCKSOUL",
    subtitle: "AUDIO CORE",
    defaultLabel: "Rocksoul brand logo",
  },
  "04-nexus-paradox": {
    id: "04-nexus-paradox",
    title: "NEXUS PARADOX",
    subtitle: "SYSTEMS TOPOLOGY",
    defaultLabel: "Nexus Paradox brand logo",
  },
  "05-riot-anarchy": {
    id: "05-riot-anarchy",
    title: "RIOT ANARCHY",
    subtitle: "STREET ZINE ENGINE",
    defaultLabel: "Riot Anarchy brand logo",
  },
  "06-mycelium": {
    id: "06-mycelium",
    title: "MYCELIUM",
    subtitle: "LIVING NETWORK",
    defaultLabel: "Mycelium brand logo",
  },
  "09-simpul-nusantara": {
    id: "09-simpul-nusantara",
    title: "SIMPUL NUSANTARA",
    subtitle: "ARCHIPELAGO HERITAGE",
    defaultLabel: "Simpul Nusantara brand logo",
  },
  arsy: {
    id: "arsy",
    title: "ARSY",
    subtitle: "AUTONOMOUS RELAY",
    defaultLabel: "Arsy brand logo",
  },
  memory: {
    id: "memory",
    title: "MEMORY",
    subtitle: "TAPE CONTINUITY",
    defaultLabel: "Memory brand logo",
  },
  "mission-control": {
    id: "mission-control",
    title: "MISSION CONTROL",
    subtitle: "SHADOW OPERATIONS",
    defaultLabel: "Mission Control brand logo",
  },
  "dock-chronicle": {
    id: "dock-chronicle",
    title: "DOCK CHRONICLE",
    subtitle: "TIMELINE ARCHIVE",
    defaultLabel: "Dock Chronicle brand logo",
  },
  "scriptures-codex": {
    id: "scriptures-codex",
    title: "SCRIPTURES CODEX",
    subtitle: "FOUR REVEALED WITNESSES",
    defaultLabel: "Scriptures Codex brand logo",
  },
  "mtime-horizon": {
    id: "mtime-horizon",
    title: "MTIME HORIZON",
    subtitle: "LUNAR EPOCH OBSERVATORY",
    defaultLabel: "M-Time Horizon brand logo",
  },
  "id-lab": {
    id: "id-lab",
    title: "IDENTITY LAB",
    subtitle: "WITNESS SIGNET ENGINE",
    defaultLabel: "ID Lab brand logo",
  },
  "addon-studio": {
    id: "addon-studio",
    title: "ADDON STUDIO",
    subtitle: "EXTENSIBLE REGISTRY",
    defaultLabel: "Addon Studio brand logo",
  },
  "shadow-frequency": {
    id: "shadow-frequency",
    title: "SHADOW FREQUENCY",
    subtitle: "LEVEL 4 TRANSMISSION",
    defaultLabel: "Shadow Frequency brand logo",
  },
  "noc-gateway": {
    id: "noc-gateway",
    title: "NOC GATEWAY",
    subtitle: "EDGE PROBE PLANE",
    defaultLabel: "NOC Gateway brand logo",
  },
};
