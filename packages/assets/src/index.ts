import type { ArtKey } from "@moonwitness/types";
import { ART_SOURCE_WIDTHS, effectiveWidths, legacySrcSetFor, srcSetFor } from "./optimize";
import catalogue from "./catalogue.json";

function heroLayer(layer: (typeof catalogue.hero)[keyof typeof catalogue.hero]) {
  const widths = effectiveWidths(layer.width);
  return {
    ...layer,
    widths,
    derivatives: widths.map((width) => ({
      width,
      height: Math.round((layer.height * width) / layer.width),
      avif: `/art/${layer.key}-${width}.avif`,
      webp: `/art/${layer.key}-${width}.webp`,
    })),
    srcSet: srcSetFor(layer.key, "avif", widths),
    fallbackSrcSet: srcSetFor(layer.key, "webp", widths),
  };
}

export const HERO_LAYERS = {
  city: heroLayer(catalogue.hero.city),
  moon: heroLayer(catalogue.hero.moon),
  character: heroLayer(catalogue.hero.character),
};

export interface ArtEntry {
  /** PNG sumber di public/art — inilah yang dipakai next/image di apps/web. */
  source: string;
  /** AVIF default source untuk <picture> di packages/ui. */
  src: string;
  srcSet: string;
  /** WebP default source bila browser tidak mendukung AVIF. */
  fallback: string;
  fallbackSrcSet: string;
  alt: string;
  position?: string | undefined;
  /** Nama file di packages/assets/references/ yang jadi acuan visualnya. */
  credit: string;
}

function entry(key: ArtKey, alt: string, position: string | undefined, credit: string): ArtEntry {
  return {
    source: `/art/${key}.png`,
    src: `/art/${key}-1440.avif`,
    srcSet: legacySrcSetFor(key, "avif", ART_SOURCE_WIDTHS[key]),
    fallback: `/art/${key}-1440.webp`,
    fallbackSrcSet: legacySrcSetFor(key, "webp", ART_SOURCE_WIDTHS[key]),
    alt,
    ...(position !== undefined ? { position } : {}),
    credit,
  };
}

export const ARTWORK = {
  "hero-witness": entry(
    "hero-witness",
    "Saksi berjaket magenta menatap bulan di atas kota neon",
    "30% center",
    "01-landing.png",
  ),
  "city-shadow": entry(
    "city-shadow",
    "Kota malam diselimuti bayangan dan papan neon magenta",
    "50% 40%",
    "03-shadow-login.png",
  ),
  "crew-rooftop": entry(
    "crew-rooftop",
    "Kru bertudung berdiri di atap gedung menghadap bulan raksasa biru",
    "50% center",
    "02-mission-control.png",
  ),
  "signal-tunnel": entry(
    "signal-tunnel",
    "Sosok tunggal berjalan masuk ke terowongan bercahaya merah",
    "center",
    "04-dock-timeline.png",
  ),
  "shadow-command": entry(
    "shadow-command",
    "Pusat komando bayangan: layar data di ruangan gelap menghadap kota neon",
    "50% 35%",
    "06-shadow-command-center.png",
  ),
  "night-shift": entry(
    "night-shift",
    "Pekerja shift malam merawat generator di bawah bulan dan kota neon",
    "40% center",
    "05-style-ska-poster.png",
  ),
  "signal-sky": entry(
    "signal-sky",
    "Pita gelombang sinyal cahaya melintasi langit di atas atap kota neon",
    "50% 35%",
    "05-style-ska-poster.png",
  ),
  "fog-voices": entry(
    "fog-voices",
    "Sosok bertudung mengangkat perekam kaset bercahaya di atas desa berkabut",
    "60% center",
    "05-style-ska-poster.png",
  ),
  "mirror-archive": entry(
    "mirror-archive",
    "Ruang arsip kaset dan polaroid dengan cermin yang memantulkan kota neon",
    "center",
    "05-style-ska-poster.png",
  ),
  "crew-wall": entry(
    "crew-wall",
    "Kolase polaroid potret kru muda ditempel selotip di dinding grafiti",
    "center",
    "05-style-ska-poster.png",
  ),
  "crowd-moon": entry(
    "crowd-moon",
    "Kerumunan mengangkat tangan dan bendera mahkota di bawah bulan raksasa",
    "50% 30%",
    "05-style-ska-poster.png",
  ),
  "shadow-command-hero": entry(
    "shadow-command-hero",
    "Dua saksi bertudung di atap menghadap bulan biru raksasa di atas kota neon",
    "70% center",
    "06-shadow-command-center.png",
  ),
  "command-eye": entry(
    "command-eye",
    "Close-up mata manga hitam-putih dengan cipratan magenta dan kuning",
    "72% 30%",
    "06-shadow-command-center.png",
  ),
  "world-map-atlas": entry(
    "world-map-atlas",
    "Peta dunia malam bergaya atlas zine dengan garis sinyal dan penanda mahkota",
    "center",
    "06-shadow-command-center.png",
  ),
  "sidebar-witness": entry(
    "sidebar-witness",
    "Potret vertikal saksi bertudung dengan jaket magenta di depan graffiti mahkota",
    "50% 20%",
    "06-shadow-command-center.png",
  ),
  "dock-chronicle-hero": entry(
    "dock-chronicle-hero",
    "Kerumunan di atap menghadap bulan biru dan skyline neon",
    "62% center",
    "04-dock-timeline.png",
  ),
  "dna-lunar-observatory": entry(
    "dna-lunar-observatory",
    "Kubah observatorium bulan dengan cincin orbital kuningan dan langit malam",
    "center",
    "07-dna-generated-plate",
  ),
  "dna-nexus-hud": entry(
    "dna-nexus-hud",
    "Skema telemetri isometrik ruang kontrol dengan jaringan radar cyan",
    "center",
    "07-dna-generated-plate",
  ),
  "dna-mycelium-spores": entry(
    "dna-mycelium-spores",
    "Jaringan hifa miselium bioluminesen terhubung gulungan pita optik",
    "center",
    "07-dna-generated-plate",
  ),
  "dna-nusantara-nodes": entry(
    "dna-nusantara-nodes",
    "Kepulauan malam terhubung kabel optik bawah laut dan menara relai pesisir",
    "center",
    "07-dna-generated-plate",
  ),
  "editorial-light-plate": entry(
    "editorial-light-plate",
    "Cetak linocut editorial kertas krem dengan antena atap, bulan sabit, dan kaset",
    "center",
    "07-dna-generated-plate",
  ),
  "wallpaper-lunar-rooftop-wide": entry(
    "wallpaper-lunar-rooftop-wide",
    "Latar desktop panorama antena atap di bawah bulan raksasa bermandikan neon",
    "70% center",
    "07-dna-generated-wallpaper",
  ),
  "wallpaper-signal-city-wide": entry(
    "wallpaper-signal-city-wide",
    "Latar desktop menara kota beton biru senja dengan suar antena cyan",
    "70% center",
    "07-dna-generated-wallpaper",
  ),
  "wallpaper-atlas-orbit-wide": entry(
    "wallpaper-atlas-orbit-wide",
    "Latar desktop peta cincin astrolabe kuningan di ruang angkasa gelap",
    "70% center",
    "07-dna-generated-wallpaper",
  ),
  "wallpaper-night-transmission-wide": entry(
    "wallpaper-night-transmission-wide",
    "Latar desktop menara siaran radio malam dengan gelombang fosfor pelabuhan",
    "70% center",
    "07-dna-generated-wallpaper",
  ),
} satisfies Record<ArtKey, ArtEntry>;

export { ART_SOURCES, ART_WIDTHS, outputNames } from "./optimize";

export type WorldPlateKey =
  | "sanctuary-hero"
  | "world-imperium"
  | "world-lunar"
  | "world-rocksoul"
  | "world-nexus"
  | "world-riot"
  | "world-mycelium"
  | "world-nusantara"
  | "story-archive"
  | "story-transmission";

export interface WorldPlateEntry {
  key: WorldPlateKey;
  src: string;
  alt: string;
}

export const WORLD_ART_PLATES: Record<WorldPlateKey, WorldPlateEntry> = {
  "sanctuary-hero": {
    key: "sanctuary-hero",
    src: "/art/celestial-gate-bg.webp",
    alt: "Gerbang kosmik MoonWitness",
  },
  "world-imperium": {
    key: "world-imperium",
    src: "/art/astrolabe-orrery-plate.webp",
    alt: "Plate astrolabe Imperium Lumen",
  },
  "world-lunar": {
    key: "world-lunar",
    src: "/art/world-moonwitness.webp",
    alt: "Dunia Lunar Chronicles MoonWitness",
  },
  "world-rocksoul": {
    key: "world-rocksoul",
    src: "/art/world-rocksoul.webp",
    alt: "Dunia audio dan frekuensi Rocksoul",
  },
  "world-nexus": {
    key: "world-nexus",
    src: "/art/world-arsy.webp",
    alt: "Topologi Nexus Paradox dan Arsy",
  },
  "world-riot": {
    key: "world-riot",
    src: "/art/gate-crowd-moon.webp",
    alt: "Poster kerumunan dan bulan Riot Anarchy",
  },
  "world-mycelium": {
    key: "world-mycelium",
    src: "/art/world-sidra.webp",
    alt: "Jaringan hidup Mycelium Sidra",
  },
  "world-nusantara": {
    key: "world-nusantara",
    src: "/art/world-sincan.webp",
    alt: "Simpul Nusantara warisan kepulauan",
  },
  "story-archive": {
    key: "story-archive",
    src: "/art/story-plate-01.webp",
    alt: "Lempeng kronik arsip pertama",
  },
  "story-transmission": {
    key: "story-transmission",
    src: "/art/story-plate-04.webp",
    alt: "Lempeng transmisi sinyal malam",
  },
};

export type DnaWorldAssetId =
  | "01-imperium-lumen"
  | "02-lunar-chronicles"
  | "03-rocksoul"
  | "04-nexus-paradox"
  | "05-riot-anarchy"
  | "06-mycelium"
  | "09-simpul-nusantara";

export type SkinAssetKey =
  | "default"
  | "riot"
  | "editorial"
  | "technical"
  | "archive"
  | "transmission"
  | "sanctuary"
  | "brutalist"
  | "noir"
  | "kinetic";

export interface DnaWorldArtworkMapping {
  dnaId: DnaWorldAssetId;
  artKey: ArtKey;
  plateSrc: string;
  recommendedSkin: SkinAssetKey;
  cutoutId: string;
}

export const DNA_WORLD_ARTWORK_MAP: Record<DnaWorldAssetId, DnaWorldArtworkMapping> = {
  "01-imperium-lumen": {
    dnaId: "01-imperium-lumen",
    artKey: "wallpaper-atlas-orbit-wide",
    plateSrc: WORLD_ART_PLATES["world-imperium"].src,
    recommendedSkin: "sanctuary",
    cutoutId: "astrolabe-disc",
  },
  "02-lunar-chronicles": {
    dnaId: "02-lunar-chronicles",
    artKey: "dna-lunar-observatory",
    plateSrc: WORLD_ART_PLATES["world-lunar"].src,
    recommendedSkin: "default",
    cutoutId: "lunar-disc",
  },
  "03-rocksoul": {
    dnaId: "03-rocksoul",
    artKey: "night-shift",
    plateSrc: WORLD_ART_PLATES["world-rocksoul"].src,
    recommendedSkin: "riot",
    cutoutId: "mixing-console",
  },
  "04-nexus-paradox": {
    dnaId: "04-nexus-paradox",
    artKey: "dna-nexus-hud",
    plateSrc: WORLD_ART_PLATES["world-nexus"].src,
    recommendedSkin: "technical",
    cutoutId: "radar-sweep",
  },
  "05-riot-anarchy": {
    dnaId: "05-riot-anarchy",
    artKey: "crowd-moon",
    plateSrc: WORLD_ART_PLATES["world-riot"].src,
    recommendedSkin: "riot",
    cutoutId: "signal-radio",
  },
  "06-mycelium": {
    dnaId: "06-mycelium",
    artKey: "dna-mycelium-spores",
    plateSrc: WORLD_ART_PLATES["world-mycelium"].src,
    recommendedSkin: "archive",
    cutoutId: "tape-reel-spools",
  },
  "09-simpul-nusantara": {
    dnaId: "09-simpul-nusantara",
    artKey: "dna-nusantara-nodes",
    plateSrc: WORLD_ART_PLATES["world-nusantara"].src,
    recommendedSkin: "archive",
    cutoutId: "transit-sign",
  },
};

export interface SkinArtworkMapping {
  skin: SkinAssetKey;
  artKey: ArtKey;
  cutoutId: string;
}

export const SKIN_ARTWORK_MAP: Record<SkinAssetKey, SkinArtworkMapping> = {
  default: {
    skin: "default",
    artKey: "dna-lunar-observatory",
    cutoutId: "lunar-disc",
  },
  riot: {
    skin: "riot",
    artKey: "wallpaper-lunar-rooftop-wide",
    cutoutId: "signal-radio",
  },
  editorial: {
    skin: "editorial",
    artKey: "editorial-light-plate",
    cutoutId: "codex-scroll",
  },
  technical: {
    skin: "technical",
    artKey: "dna-nexus-hud",
    cutoutId: "oscilloscope-crt",
  },
  archive: {
    skin: "archive",
    artKey: "dna-mycelium-spores",
    cutoutId: "microfilm-strip",
  },
  transmission: {
    skin: "transmission",
    artKey: "wallpaper-night-transmission-wide",
    cutoutId: "radar-sweep",
  },
  sanctuary: {
    skin: "sanctuary",
    artKey: "wallpaper-atlas-orbit-wide",
    cutoutId: "astrolabe-disc",
  },
  brutalist: {
    skin: "brutalist",
    artKey: "wallpaper-signal-city-wide",
    cutoutId: "server-rack",
  },
  noir: {
    skin: "noir",
    artKey: "city-shadow",
    cutoutId: "cipher-wheel",
  },
  kinetic: {
    skin: "kinetic",
    artKey: "dna-nusantara-nodes",
    cutoutId: "patch-cable-jack",
  },
};

export interface DesignLibraryCategorySummary {
  id:
    | "brand"
    | "ui-kit"
    | "icon-pack"
    | "avatar-pack"
    | "illustrations"
    | "wallpapers"
    | "textures"
    | "cutouts";
  label: string;
  count: number;
}

export const DESIGN_LIBRARY_CATALOGUE = {
  packId: "moonwitness-design-library-v1",
  totalAssets: 196,
  categories: [
    { id: "brand", label: "Brand & Seals", count: 18 },
    { id: "ui-kit", label: "HUD & UI Kit", count: 24 },
    { id: "icon-pack", label: "Sovereign Icons", count: 32 },
    { id: "avatar-pack", label: "Witness Avatars", count: 16 },
    { id: "illustrations", label: "World Illustrations", count: 25 },
    { id: "wallpapers", label: "Screen Wallpapers", count: 24 },
    { id: "textures", label: "Surface Textures", count: 33 },
    { id: "cutouts", label: "Isolated Cutouts", count: 24 },
  ] satisfies readonly DesignLibraryCategorySummary[],
} as const;
