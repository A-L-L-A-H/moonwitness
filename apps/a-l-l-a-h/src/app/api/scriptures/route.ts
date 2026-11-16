import { type NextRequest, NextResponse } from "next/server";
import {
  searchCompactQuranTuples,
  type ClassicalWitnessExcerpt,
  type CompactQuranTuple,
} from "@moonwitness/canon";
import { loadPublicJsonAsset } from "@/lib/cloudflare-runtime";

interface WitnessCrosswalkPayload {
  readonly invariant: string;
  readonly note: string;
  readonly passages: readonly ClassicalWitnessExcerpt[];
}

let cachedQuranTuples: readonly CompactQuranTuple[] | null = null;
let cachedWitnessCrosswalk: WitnessCrosswalkPayload | null = null;

async function getQuranTuples(): Promise<readonly CompactQuranTuple[]> {
  if (cachedQuranTuples) return cachedQuranTuples;
  const loaded = await loadPublicJsonAsset<readonly CompactQuranTuple[]>(
    "/data/quran-uthmani.json",
  );
  if (Array.isArray(loaded)) {
    cachedQuranTuples = loaded;
    return loaded;
  }
  return [];
}

async function getWitnessCrosswalk(): Promise<WitnessCrosswalkPayload | null> {
  if (cachedWitnessCrosswalk) return cachedWitnessCrosswalk;
  const loaded = await loadPublicJsonAsset<WitnessCrosswalkPayload>(
    "/data/four-corpus-witnesses.json",
  );
  if (loaded) {
    cachedWitnessCrosswalk = loaded;
  }
  return loaded;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").slice(0, 120);
  const limitRaw = Number(searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(36, Math.round(limitRaw))) : 12;

  const [tuples, crosswalk] = await Promise.all([getQuranTuples(), getWitnessCrosswalk()]);
  const hits = searchCompactQuranTuples(tuples, query, limit);
  const surahsCount = tuples.length > 0 ? 114 : 0;

  return NextResponse.json(
    {
      corpusStatus: tuples.length > 0 ? "LIVE_INDEXED" : "UNAVAILABLE",
      totalAyahs: tuples.length,
      totalSurahs: surahsCount,
      query,
      hits,
      crosswalk,
    },
    {
      headers: {
        "cache-control": "public, max-age=300, stale-while-revalidate=3600",
      },
    },
  );
}
