import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { GET as getScriptures } from "@/app/api/scriptures/route";
import { NextRequest } from "next/server";

describe("Sanctuary Metadata & API Route Contracts", () => {
  it("exposes valid sitemap entries for all core sanctuary routes", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://a-l-l-a-h.com/");
    expect(urls).toContain("https://a-l-l-a-h.com/scriptures");
    expect(urls).toContain("https://a-l-l-a-h.com/codex");
    expect(urls).toContain("https://a-l-l-a-h.com/mtime");
  });

  it("blocks /api indexing in robots.txt while pointing to sitemap.xml", () => {
    const cfg = robots();
    const firstRule = Array.isArray(cfg.rules) ? cfg.rules[0] : cfg.rules;
    expect(firstRule?.disallow).toContain("/api/");
    expect(cfg.sitemap).toBe("https://a-l-l-a-h.com/sitemap.xml");
  });

  it("publishes standalone PWA manifest with compressed icon assets", () => {
    const m = manifest();
    expect(m.name).toContain("A-L-L-A-H.COM");
    expect(m.display).toBe("standalone");
    expect(m.icons?.some((icon) => icon.src === "/icon-192.png")).toBe(true);
    expect(m.icons?.some((icon) => icon.src === "/icon-512.png")).toBe(true);
  });

  it("serves indexed 6,236-ayah Uthmani witness records and full 18,384-verse 4-corpus bundle from GET /api/scriptures", async () => {
    const req = new NextRequest("https://a-l-l-a-h.com/api/scriptures?q=2:256&limit=5");
    const res = await getScriptures(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      corpusStatus: string;
      totalAyahs: number;
      totalSurahs: number;
      corpusCounts: {
        taurat: number;
        zabur: number;
        injil: number;
        quran: number;
        totalVerses: number;
      };
      hits: Array<{ reference: string; textUthmani: string }>;
      unifiedHits: Array<{ corpusCode: string; reference: string }>;
      crosswalk: { passages: unknown[] } | null;
    };
    expect(body.corpusStatus).toBe("LIVE_INDEXED");
    expect(body.totalAyahs).toBe(6236);
    expect(body.totalSurahs).toBe(114);
    expect(body.corpusCounts).toEqual({
      taurat: 5853,
      zabur: 2527,
      injil: 3768,
      quran: 6236,
      totalVerses: 18384,
    });
    expect(body.hits[0]?.reference).toBe("2:256");
    expect(body.hits[0]?.textUthmani).not.toContain("qt@no");
    expect(
      body.unifiedHits.some((h) => h.corpusCode === "SRC-QUR" && h.reference === "QS 2:256"),
    ).toBe(true);
    expect(body.crosswalk?.passages.length).toBeGreaterThanOrEqual(4);
  });

  it("queries Taurat (Gen 1:1), Zabur (Ps 23:1), and Injil (John 1:1) cleanly via ?corpus filter", async () => {
    const cases: Array<[string, string, string]> = [
      ["SRC-TOR", "Gen 1:1", "Gen 1:1"],
      ["SRC-ZAB", "Ps 23:1", "Ps 23:1"],
      ["SRC-INJ", "John 1:1", "John 1:1"],
    ];
    for (const [corpus, q, expectedRef] of cases) {
      const res = await getScriptures(
        new NextRequest(
          `https://a-l-l-a-h.com/api/scriptures?corpus=${corpus}&q=${encodeURIComponent(q)}`,
        ),
      );
      expect(res.status).toBe(200);
      const data = (await res.json()) as {
        corpusFilter: string;
        unifiedHits: Array<{ corpusCode: string; reference: string; text: string }>;
      };
      expect(data.corpusFilter).toBe(corpus);
      expect(data.unifiedHits[0]?.corpusCode).toBe(corpus);
      expect(data.unifiedHits[0]?.reference).toBe(expectedRef);
      expect(data.unifiedHits[0]?.text.length).toBeGreaterThan(5);
    }
  });
});
