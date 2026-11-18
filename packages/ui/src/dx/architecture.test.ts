import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { dnaWorldCssVariables, MASTER_DNA_IDS, MASTER_DNA_WORLDS } from "../skin/dna-worlds";
import {
  IMPERIUM_LUMEN_TOKENS,
  imperiumLumenCssVariables,
  MASTER_DNA_PALETTES,
} from "../skin/imperium-tokens";

/**
 * UI architecture gate. Enforces that `packages/ui` is the single authority for
 * design tokens, DNA skins and shared components. Runs inside `pnpm test`, so it is
 * part of every gate (`gate:local`, `gate:push`).
 */

const UI_ROOT = resolve(__dirname, "../..");
const REPO_ROOT = resolve(UI_ROOT, "../..");
const APPS_ROOT = join(REPO_ROOT, "apps");
const SKINS_DIR = join(UI_ROOT, "src/skins");
const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".turbo",
  ".cloudflare",
  ".open-next",
  "dist",
  "coverage",
  "target",
  "venv",
  "public",
  "src-tauri",
  "e2e",
]);

/**
 * Applications that consume @moonwitness/ui but still carry local palette literals.
 * Values are RATCHET CEILINGS (current measured counts): they may only go down.
 * Every entry is tracked in the "Remaining duplication report".
 */
const LEGACY_HEX_CEILINGS: Readonly<Record<string, number>> = {
  rocksoul: 59,
};

/** Apps whose CSS must not contain any palette literal (TSX is ratcheted separately). */
const STRICT_TOKEN_APPS: readonly string[] = ["web"];

/** 6-digit only in TSX: 3-digit matches collide with editorial labels such as "#014". */
const TSX_HEX_LITERAL = /#[0-9a-fA-F]{6}\b/g;

/**
 * Component names re-declared locally although @moonwitness/ui owns them. Each entry is a
 * tracked duplication; the test fails if an entry is resolved without being removed here,
 * and fails on any new duplicate.
 */
const KNOWN_COMPONENT_DUPLICATES: readonly string[] = [];
function walk(dir: string, extensions: readonly string[]): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const info = statSync(full);
    if (info.isDirectory()) found.push(...walk(full, extensions));
    else if (extensions.some((extension) => entry.endsWith(extension))) found.push(full);
  }
  return found;
}

function appSources(appName: string, extensions: readonly string[]): string[] {
  return walk(join(APPS_ROOT, appName, "src"), extensions).filter(
    (file) => !/\.test\.(ts|tsx)$/.test(file),
  );
}

function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripJsComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** Returns every rule prelude (selector list) outside of at-rule preludes and keyframe steps. */
function selectorPreludes(css: string): string[] {
  const preludes: string[] = [];
  let buffer = "";
  const stack: boolean[] = [];
  for (const char of stripCssComments(css)) {
    if (char === "{") {
      const prelude = buffer.trim();
      const isAtRule = prelude.startsWith("@");
      const insideKeyframes = stack.includes(true);
      if (!isAtRule && !insideKeyframes) preludes.push(prelude);
      stack.push(isAtRule && /^@(-\w+-)?keyframes/.test(prelude));
      buffer = "";
    } else if (char === "}") {
      stack.pop();
      buffer = "";
    } else if (char === ";") {
      buffer = "";
    } else {
      buffer += char;
    }
  }
  return preludes;
}

/** Splits a selector list on commas that are not nested inside parentheses. */
function splitTopLevel(prelude: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of prelude) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

const HEX_LITERAL = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

function appNames(): string[] {
  return readdirSync(APPS_ROOT).filter((name) => existsSync(join(APPS_ROOT, name, "src")));
}

describe("UI architecture: DNA CSS scoping", () => {
  const skinFiles = readdirSync(SKINS_DIR).filter((file) => file.endsWith(".css"));

  it("ships at least the base and imperium skins", () => {
    expect(skinFiles).toEqual(expect.arrayContaining(["dna-base.css", "imperium.css"]));
  });

  for (const file of skinFiles) {
    it(`${file}: every rule selector is scoped under [data-dna]`, () => {
      const css = readFileSync(join(SKINS_DIR, file), "utf8");
      const unscoped: string[] = [];
      for (const prelude of selectorPreludes(css)) {
        for (const selector of splitTopLevel(prelude)) {
          if (selector && !selector.startsWith("[data-dna")) unscoped.push(selector);
        }
      }
      expect(unscoped).toEqual([]);
    });
  }
});

describe("UI architecture: single token source parity", () => {
  it("keeps imperium.css brand variables identical to imperium-tokens.ts", () => {
    const css = readFileSync(join(SKINS_DIR, "imperium.css"), "utf8");
    const readVar = (name: string): string | undefined =>
      new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]?.toLowerCase();
    const { brand, semantic } = IMPERIUM_LUMEN_TOKENS;
    expect(readVar("--brand-ink")).toBe(brand.ink);
    expect(readVar("--brand-paper")).toBe(brand.paper);
    expect(readVar("--brand-yellow")).toBe(brand.yellow);
    expect(readVar("--brand-pink")).toBe(brand.pink);
    expect(readVar("--brand-blue")).toBe(brand.blue);
    expect(readVar("--brand-white")).toBe(brand.white);
    expect(readVar("--celestial-midnight")).toBe(semantic.surface);
    expect(readVar("--celestial-sanctum")).toBe(semantic.surfaceElevated);
    expect(readVar("--celestial-silver")).toBe(semantic.textMuted);
  });

  it("derives the server-safe variable map and SkinRoot variables from the same tokens", () => {
    const serverSafe = imperiumLumenCssVariables();
    const runtime = dnaWorldCssVariables(MASTER_DNA_WORLDS["01-imperium-lumen"]) as Record<
      string,
      string
    >;
    for (const [name, value] of Object.entries(runtime)) {
      expect(serverSafe[name as `--${string}`]).toBe(value);
    }
  });

  it("registers exactly the seven master DNA identities with distinct shape languages and token-sourced palettes", () => {
    expect(MASTER_DNA_IDS).toHaveLength(7);
    const shapes = new Set(MASTER_DNA_IDS.map((id) => MASTER_DNA_WORLDS[id].shapeLanguage));
    const motions = new Set(MASTER_DNA_IDS.map((id) => MASTER_DNA_WORLDS[id].motionGrammar));
    expect(shapes.size).toBe(7);
    expect(motions.size).toBe(7);
    for (const id of MASTER_DNA_IDS) {
      expect(MASTER_DNA_WORLDS[id].palette).toEqual(MASTER_DNA_PALETTES[id]);
    }
    const dnaWorldsSource = readFileSync(join(UI_ROOT, "src/skin/dna-worlds.tsx"), "utf8");
    expect(dnaWorldsSource.match(TSX_HEX_LITERAL)).toBeNull();
  });
});

describe("UI architecture: consumer applications", () => {
  it("never redefine authoritative --dna-* or --brand-* variables", () => {
    const offenders: string[] = [];
    for (const app of appNames()) {
      for (const file of appSources(app, [".css", ".ts", ".tsx"])) {
        const source = readFileSync(file, "utf8");
        if (/(^|[\s{;"'`])--(dna|brand)-[\w-]+\s*:/m.test(stripJsComments(source))) {
          offenders.push(relative(REPO_ROOT, file));
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  for (const app of STRICT_TOKEN_APPS) {
    it(`${app}: contains no hard-coded palette literals in CSS`, () => {
      const offenders: string[] = [];
      for (const file of appSources(app, [".css"])) {
        const source = stripCssComments(readFileSync(file, "utf8"));
        const hits = source.match(HEX_LITERAL);
        if (hits) offenders.push(`${relative(REPO_ROOT, file)} (${hits.length})`);
      }
      expect(offenders).toEqual([]);
    });
  }

  for (const [app, ceiling] of Object.entries(LEGACY_HEX_CEILINGS)) {
    it(`${app}: legacy palette literals stay at or below the ratchet ceiling (${ceiling})`, () => {
      let total = 0;
      for (const file of appSources(app, [".css"])) {
        total += stripCssComments(readFileSync(file, "utf8")).match(HEX_LITERAL)?.length ?? 0;
      }
      expect(total).toBeLessThanOrEqual(ceiling);
    });
  }

  for (const app of ["web"] as const) {
    it(`${app}: contains no hard-coded palette literals in TSX`, () => {
      const offenders: string[] = [];
      for (const file of appSources(app, [".tsx"])) {
        const hits = stripJsComments(readFileSync(file, "utf8")).match(TSX_HEX_LITERAL);
        if (hits) offenders.push(`${relative(REPO_ROOT, file)} (${hits.length})`);
      }
      expect(offenders).toEqual([]);
    });
  }

  it("keeps html/body/:root rules free of literal colors and font stacks", () => {
    const offenders: string[] = [];
    for (const app of STRICT_TOKEN_APPS) {
      for (const file of appSources(app, [".css"])) {
        const css = stripCssComments(readFileSync(file, "utf8"));
        const globalRule = /(?:^|\})\s*(html|body|:root)\s*\{([^}]*)\}/g;
        for (const match of css.matchAll(globalRule)) {
          const declarations = match[2] ?? "";
          if (
            /(color|background[\w-]*|font-family)\s*:[^;]*(#[0-9a-fA-F]{3,6}\b|rgba?\()/.test(
              declarations,
            )
          ) {
            offenders.push(`${relative(REPO_ROOT, file)} :: ${match[1] ?? ""}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("import the UI package only through its public exports", () => {
    const offenders: string[] = [];
    const bypass =
      /from\s+["'](?:@moonwitness\/ui\/src\/|(?:\.\.\/)+packages\/ui\/|[^"']*packages\/ui\/src)/;
    for (const app of appNames()) {
      for (const file of appSources(app, [".ts", ".tsx"])) {
        if (bypass.test(readFileSync(file, "utf8"))) offenders.push(relative(REPO_ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("do not re-declare components already owned by @moonwitness/ui", () => {
    const owned = new Set<string>();
    const ownedSources = [
      join(UI_ROOT, "src/skin/imperium.tsx"),
      ...walk(join(UI_ROOT, "src/components/ui"), [".tsx"]),
      ...walk(join(UI_ROOT, "src/primitives"), [".tsx"]),
      ...walk(join(UI_ROOT, "src/composites"), [".tsx"]),
    ].filter((file) => !/\.test\./.test(file));
    for (const file of ownedSources) {
      const src = readFileSync(file, "utf8");
      for (const match of src.matchAll(/export\s+(?:const|function)\s+([A-Z][A-Za-z0-9]+)/g)) {
        if (match[1]) owned.add(match[1]);
      }
      // Also capture `export { Button, Card, ... }` named re-export lists in component barrels
      for (const block of src.matchAll(/export\s*\{([^}]+)\}(?!\s*from)/g)) {
        for (const item of (block[1] ?? "").split(",")) {
          const sym = item
            .trim()
            .replace(/^type\s+/, "")
            .split(/\s+as\s+/)
            .pop()
            ?.trim();
          if (sym && /^[A-Z][A-Za-z0-9]+$/.test(sym)) owned.add(sym);
        }
      }
    }
    const duplicates: string[] = [];
    for (const app of appNames()) {
      for (const file of appSources(app, [".tsx"])) {
        for (const match of stripJsComments(readFileSync(file, "utf8")).matchAll(
          /(?:^|\n)\s*(?:export\s+)?(?:const|function)\s+([A-Z][A-Za-z0-9]+)\s*[=(]/g,
        )) {
          if (match[1] && owned.has(match[1])) {
            duplicates.push(`${app}::${match[1]}`);
          }
        }
      }
    }
    expect([...new Set(duplicates)].sort()).toEqual([...KNOWN_COMPONENT_DUPLICATES].sort());
  });
});

describe("UI architecture: package boundaries", () => {
  it("packages/ui source imports only declared leaf workspace packages and never apps", () => {
    const manifest = JSON.parse(readFileSync(join(UI_ROOT, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const declared = new Set(Object.keys(manifest.dependencies ?? {}));
    const offenders: string[] = [];
    for (const file of walk(join(UI_ROOT, "src"), [".ts", ".tsx"])) {
      const source = readFileSync(file, "utf8");
      if (/from\s+["'](?:\.\.\/)+(?:apps|packages)\//.test(source)) {
        offenders.push(relative(REPO_ROOT, file));
      }
      for (const match of source.matchAll(/from\s+["'](@moonwitness\/[\w-]+)/g)) {
        const name = match[1] ?? "";
        if (name !== "@moonwitness/ui" && !declared.has(name)) {
          offenders.push(`${relative(REPO_ROOT, file)} -> ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("imperium-tokens.ts stays free of React and client directives", () => {
    const source = readFileSync(join(UI_ROOT, "src/skin/imperium-tokens.ts"), "utf8");
    expect(source).not.toMatch(/from\s+["']react/);
    expect(source).not.toMatch(/^\s*["']use client["']/m);
  });
});

describe("UI architecture: unified web & sovereign DNA icon governance", () => {
  it("GATE-01: enforces single web frontend app boundary in apps/web", () => {
    const retiredDir = join(APPS_ROOT, "a-l-l-a-h");
    expect(existsSync(join(retiredDir, "package.json"))).toBe(false);
    expect(existsSync(join(retiredDir, "src"))).toBe(false);
    if (existsSync(retiredDir)) {
      expect(readdirSync(retiredDir)).toEqual([]);
    }

    const appsWithTsx = readdirSync(APPS_ROOT)
      .filter((dir) => existsSync(join(APPS_ROOT, dir, "src")))
      .filter((dir) => walk(join(APPS_ROOT, dir, "src"), [".tsx"]).length > 0)
      .sort();
    expect(appsWithTsx).toEqual(["rocksoul", "web"]);
  });

  it("GATE-02: forbids generic external icon libraries in @moonwitness/ui and @moonwitness/web", () => {
    const bannedDeps = ["lucide-react", "@heroicons/react", "react-icons", "@tabler/icons-react"];
    for (const manifestPath of [
      join(UI_ROOT, "package.json"),
      join(APPS_ROOT, "web/package.json"),
    ]) {
      const pkg = JSON.parse(readFileSync(manifestPath, "utf8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
      for (const banned of bannedDeps) {
        expect(
          allDeps,
          `${relative(REPO_ROOT, manifestPath)} declares ${banned}`,
        ).not.toHaveProperty(banned);
      }
    }

    const bannedImportRe = /from\s+["'](?:lucide-react|@heroicons\/|react-icons|@tabler\/icons)/;
    const filesToScan = [
      ...walk(join(UI_ROOT, "src"), [".ts", ".tsx"]),
      ...walk(join(APPS_ROOT, "web/src"), [".ts", ".tsx"]),
    ].filter((file) => !/\.test\.(ts|tsx)$/.test(file));
    const offenders: string[] = [];
    for (const file of filesToScan) {
      if (bannedImportRe.test(stripJsComments(readFileSync(file, "utf8")))) {
        offenders.push(relative(REPO_ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("GATE-03: enforces sovereign DNA icon token purity in packages/ui/src/icons", () => {
    const forbiddenColorRe = /#[0-9a-fA-F]{3,6}\b|rgba?\(|hsla?\(/g;
    const offenders: string[] = [];
    for (const file of walk(join(UI_ROOT, "src/icons"), [".ts", ".tsx"])) {
      if (/\.test\.(ts|tsx)$/.test(file)) continue;
      const hits = stripJsComments(readFileSync(file, "utf8")).match(forbiddenColorRe);
      if (hits) offenders.push(`${relative(REPO_ROOT, file)} (${hits.join(", ")})`);
    }
    expect(offenders).toEqual([]);
  });

  it("GATE-04: enforces centralized icon ownership in @moonwitness/ui/icons", () => {
    const offenders: string[] = [];
    for (const file of appSources("web", [".tsx"])) {
      const source = stripJsComments(readFileSync(file, "utf8"));
      if (
        /export\s+(?:const|function)\s+[A-Za-z0-9]*(?:Icon|Emblem)\b/.test(source) &&
        source.includes("<svg")
      ) {
        offenders.push(relative(REPO_ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("GATE-05: verifies Vuexy route-group topology in apps/web", () => {
    expect(existsSync(join(APPS_ROOT, "web/src/app/(sanctuary)/layout.tsx"))).toBe(true);
    expect(existsSync(join(APPS_ROOT, "web/src/app/(sanctuary)/page.tsx"))).toBe(true);
    expect(existsSync(join(APPS_ROOT, "web/src/app/(console)/layout.tsx"))).toBe(true);
    expect(existsSync(join(APPS_ROOT, "web/src/app/(console)/moonwitness/page.tsx"))).toBe(true);
  });
});

describe("UI & SDK consistency gates (GATE-06..GATE-11)", () => {
  it("GATE-06: enforces single-door @moonwitness/contracts/sdk transport in apps/web/src", () => {
    const offenders: string[] = [];
    for (const file of appSources("web", [".ts", ".tsx"])) {
      const rel = relative(REPO_ROOT, file).replace(/\\/g, "/");
      if (rel.startsWith("apps/web/src/app/api/") || rel.endsWith("/lib/ecosystem-probe.ts")) {
        continue;
      }
      const source = stripJsComments(readFileSync(file, "utf8"));
      if (/(^|[^.\w])fetch\s*\(/m.test(source)) {
        offenders.push(rel);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("GATE-07: enforces zero raw <select> in apps/web and zero raw controls in composites/meta", () => {
    const selectOffenders: string[] = [];
    for (const file of appSources("web", [".tsx"])) {
      const source = stripJsComments(readFileSync(file, "utf8"));
      if (/<select\b/.test(source)) {
        selectOffenders.push(relative(REPO_ROOT, file).replace(/\\/g, "/"));
      }
    }
    expect(selectOffenders).toEqual([]);

    const metaAndCompositeFiles = [
      join(UI_ROOT, "src/composites/auto-model-view.tsx"),
      ...walk(join(APPS_ROOT, "web/src/components/meta"), [".tsx"]),
    ].filter((file) => !/\.test\.tsx$/.test(file));
    const rawControlOffenders: string[] = [];
    for (const file of metaAndCompositeFiles) {
      const source = stripJsComments(readFileSync(file, "utf8"));
      if (/<(select|textarea|input|button)\b/.test(source)) {
        rawControlOffenders.push(relative(REPO_ROOT, file).replace(/\\/g, "/"));
      }
    }
    expect(rawControlOffenders).toEqual([]);
  });

  it("GATE-08: ratchets legacy raw controls, dialogs, bespoke CSS classes, and inline SVGs in apps/web", () => {
    let rawButton = 0;
    let rawInput = 0;
    let rawDialog = 0;
    let legacyZineClasses = 0;
    let rawSvg = 0;
    for (const file of appSources("web", [".tsx"])) {
      const lines = stripJsComments(readFileSync(file, "utf8")).split(/\r?\n/);
      for (const line of lines) {
        if (/<button\b/.test(line)) rawButton += 1;
        if (/<input\b/.test(line)) rawInput += 1;
        if (/role="dialog"|aria-modal="true"/.test(line)) rawDialog += 1;
        if (/className=.*\b(btn-zine|zine-card|btn-luxe-|btn-chamfer)\b/.test(line)) {
          legacyZineClasses += 1;
        }
        if (/<svg\b/.test(line)) rawSvg += 1;
      }
    }
    expect(rawButton).toBeLessThanOrEqual(184);
    expect(rawInput).toBeLessThanOrEqual(50);
    expect(rawDialog).toBeLessThanOrEqual(13);
    expect(legacyZineClasses).toBeLessThanOrEqual(80);
    expect(rawSvg).toBeLessThanOrEqual(8);
  });

  it("GATE-09: enforces Odoo addon menu & icon parity across i18n, probes, and resolveNavIconPath", async () => {
    const { resolveNavIconPath } = await import("../lib/nav-icons");
    for (const key of [
      "snmp",
      "vpn",
      "syslog",
      "storage",
      "radius",
      "scripture",
      "mtime",
      "memory",
      "ai",
      "probes",
      "i18n",
      "dot",
    ]) {
      expect(resolveNavIconPath(key)).toMatch(/^M/);
    }
    const i18nSrc = readFileSync(join(REPO_ROOT, "packages/addons/i18n/src/index.ts"), "utf8");
    const probesSrc = readFileSync(join(REPO_ROOT, "packages/addons/probes/src/index.ts"), "utf8");
    expect(i18nSrc).toMatch(/\bmenus:\s*i18nMenus\b/);
    expect(probesSrc).toMatch(/\bmenus:\s*probesMenus\b/);
  });

  it("GATE-10: forbids raw /art/*.{png,webp} literals in apps/web/src", () => {
    const offenders: string[] = [];
    for (const file of appSources("web", [".ts", ".tsx"])) {
      const source = stripJsComments(readFileSync(file, "utf8"));
      if (/["']\/art\/[^"']+\.(?:png|webp)["']/.test(source)) {
        offenders.push(relative(REPO_ROOT, file).replace(/\\/g, "/"));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("GATE-11: enforces single brand mark in console-shell-adapter headerStart without duplicate Crown", () => {
    const src = readFileSync(
      join(APPS_ROOT, "web/src/components/shell/console-shell-adapter.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/headerStart=\{[\s\S]{0,200}<Crown\b/);
  });
});
