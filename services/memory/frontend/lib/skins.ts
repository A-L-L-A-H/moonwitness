export const MEMORY_SKINS = [
  "default",
  "editorial",
  "technical",
  "riot",
  "archive",
  "transmission",
  "sanctuary",
  "brutalist",
  "noir",
  "kinetic",
] as const;

export type MemorySkin = (typeof MEMORY_SKINS)[number];

export const MEMORY_SKIN_STORAGE_KEY = "mw-memory-skin";

const LEGACY_SKIN_ALIASES: Readonly<Record<string, MemorySkin>> = {
  cinema: "default",
  console: "transmission",
};

export interface MemorySkinMeta {
  readonly label: string;
  readonly grammar: string;
  readonly reducedMotionSafe: true;
}

export const MEMORY_SKIN_META: Readonly<Record<MemorySkin, MemorySkinMeta>> = {
  default: { label: "Moonwitness", grammar: "Analog darkroom zine deck", reducedMotionSafe: true },
  editorial: { label: "Editorial Folio", grammar: "Archival journal broadsheet", reducedMotionSafe: true },
  technical: { label: "Technical Grid", grammar: "Precision telemetry blueprint", reducedMotionSafe: true },
  riot: { label: "Riot Zine", grammar: "Underground stencil tape deck", reducedMotionSafe: true },
  archive: { label: "Archive Deck", grammar: "Analog cassette deck hardware", reducedMotionSafe: true },
  transmission: { label: "Transmission", grammar: "Command strip phosphor HUD", reducedMotionSafe: true },
  sanctuary: { label: "Sanctuary Brass", grammar: "Aniconic geometric sanctuary", reducedMotionSafe: true },
  brutalist: { label: "Brutalist Concrete", grammar: "Raw sharp slab offset shadow", reducedMotionSafe: true },
  noir: { label: "Noir Detective", grammar: "High-contrast silver dossier", reducedMotionSafe: true },
  kinetic: { label: "Kinetic Neon", grammar: "Angular frequency vector", reducedMotionSafe: true },
};

export function resolveMemorySkin(candidate: string | null | undefined): MemorySkin {
  if (!candidate) return "default";
  if (candidate in LEGACY_SKIN_ALIASES) {
    return LEGACY_SKIN_ALIASES[candidate]!;
  }
  return (MEMORY_SKINS as readonly string[]).includes(candidate)
    ? (candidate as MemorySkin)
    : "default";
}

export function nextMemorySkin(current: MemorySkin): MemorySkin {
  const idx = MEMORY_SKINS.indexOf(current);
  return MEMORY_SKINS[(idx + 1) % MEMORY_SKINS.length] ?? "default";
}

export function applyMemorySkin(nextSkin: MemorySkin): void {
  if (typeof document === "undefined") return;
  const apply = () => {
    document.documentElement.dataset.skin = nextSkin;
  };
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => unknown;
  };
  const reduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (typeof doc.startViewTransition === "function" && !reduced) {
    doc.startViewTransition(apply);
  } else {
    apply();
  }
  try {
    window.localStorage.setItem(MEMORY_SKIN_STORAGE_KEY, nextSkin);
  } catch {
    // Ignore storage quota or sandbox restrictions.
  }
}
