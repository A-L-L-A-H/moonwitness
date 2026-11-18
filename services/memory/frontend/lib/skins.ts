export const MEMORY_SKINS = [
  "archive",
  "technical",
  "editorial",
  "riot",
  "cinema",
  "console",
  "sanctuary",
  "brutalist",
  "noir",
  "kinetic",
] as const;

export type MemorySkin = (typeof MEMORY_SKINS)[number];

export const MEMORY_SKIN_STORAGE_KEY = "mw-memory-skin";

export interface MemorySkinMeta {
  readonly label: string;
  readonly grammar: string;
  readonly reducedMotionSafe: true;
}

export const MEMORY_SKIN_META: Readonly<Record<MemorySkin, MemorySkinMeta>> = {
  archive: { label: "Archive Deck", grammar: "Analog cassette deck hardware", reducedMotionSafe: true },
  technical: { label: "Technical Grid", grammar: "Precision telemetry blueprint", reducedMotionSafe: true },
  editorial: { label: "Editorial Folio", grammar: "Archival journal broadsheet", reducedMotionSafe: true },
  riot: { label: "Riot Zine", grammar: "Underground stencil tape deck", reducedMotionSafe: true },
  cinema: { label: "Cinema Darkroom", grammar: "Projector tungsten darkroom", reducedMotionSafe: true },
  console: { label: "Console Terminal", grammar: "Command strip phosphor HUD", reducedMotionSafe: true },
  sanctuary: { label: "Sanctuary Brass", grammar: "Aniconic geometric sanctuary", reducedMotionSafe: true },
  brutalist: { label: "Brutalist Concrete", grammar: "Raw sharp slab offset shadow", reducedMotionSafe: true },
  noir: { label: "Noir Detective", grammar: "High-contrast silver dossier", reducedMotionSafe: true },
  kinetic: { label: "Kinetic Neon", grammar: "Angular frequency vector", reducedMotionSafe: true },
};

export function resolveMemorySkin(candidate: string | null | undefined): MemorySkin {
  if (!candidate) return "archive";
  return (MEMORY_SKINS as readonly string[]).includes(candidate)
    ? (candidate as MemorySkin)
    : "archive";
}

export function nextMemorySkin(current: MemorySkin): MemorySkin {
  const idx = MEMORY_SKINS.indexOf(current);
  return MEMORY_SKINS[(idx + 1) % MEMORY_SKINS.length] ?? "archive";
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
