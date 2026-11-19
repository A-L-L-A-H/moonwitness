import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  AddonManifestSchema,
  AddonRegistry,
  AddonRegistryError,
  planUpgrade,
  satisfiesSemVer,
  type AddonManifestInput,
} from "./registry.js";

function addon(
  name: string,
  depends: string[] = [],
  provides: Record<string, string[]> = {},
  version = "0.1.0",
  capabilities: string[] = [],
) {
  return {
    manifest: { name, version, depends, provides, capabilities },
    register: vi.fn(async () => {}),
  };
}

describe("AddonManifestSchema", () => {
  it("applies defaults for optional provides/depends", () => {
    const parsed = AddonManifestSchema.parse({ name: "x", version: "1.0.0" });
    expect(parsed.depends).toEqual([]);
    expect(parsed.provides.routes).toEqual([]);
  });

  it("rejects an invalid addon name", () => {
    expect(() => AddonManifestSchema.parse({ name: "Bad Name", version: "1.0.0" })).toThrow();
  });

  it("validates strict SemVer versions and rejects non-SemVer strings", () => {
    expect(AddonManifestSchema.parse({ name: "ok_a", version: "1.2.3" }).version).toBe("1.2.3");
    expect(
      AddonManifestSchema.parse({ name: "ok_b", version: "2.0.0-beta.1+exp.sha.5114f85" }).version,
    ).toBe("2.0.0-beta.1+exp.sha.5114f85");

    for (const bad of ["1", "1.0", "v1.0.0", "01.0.0", "1.0.0-", "1.0.0+", "latest", ""]) {
      expect(() => AddonManifestSchema.parse({ name: "bad_ver", version: bad })).toThrow();
    }
  });

  it("validates every first-party manifest in packages/addons/src/*/manifest.json", () => {
    const addonsDir = resolve(__dirname, "../../addons/src");
    const manifests: AddonManifestInput[] = [];
    for (const dir of readdirSync(addonsDir)) {
      const manifestPath = resolve(addonsDir, dir, "manifest.json");
      if (existsSync(manifestPath)) {
        const raw = JSON.parse(readFileSync(manifestPath, "utf8")) as AddonManifestInput;
        manifests.push(raw);
      }
    }
    expect(manifests.length).toBeGreaterThanOrEqual(25);

    const registry = new AddonRegistry();
    registry.add(
      addon("__base", [], { routes: ["_meta", "health"], models: ["users", "settings"] }, "0.1.0"),
    );
    for (const manifest of manifests) {
      expect(() => AddonManifestSchema.parse(manifest)).not.toThrow();
      registry.add({ manifest, register: () => {} });
    }
    expect(() => registry.validate()).not.toThrow();
  });
});

describe("SemVer range matching", () => {
  it("evaluates caret, tilde, comparator bounds, and unions accurately", () => {
    expect(satisfiesSemVer("0.1.5", "^0.1.0")).toBe(true);
    expect(satisfiesSemVer("0.2.0", "^0.1.0")).toBe(false);
    expect(satisfiesSemVer("1.9.0", "^1.2.3")).toBe(true);
    expect(satisfiesSemVer("2.0.0", "^1.2.3")).toBe(false);
    expect(satisfiesSemVer("2.0.0-alpha.1", "^1.2.3")).toBe(false);

    expect(satisfiesSemVer("1.2.9", "~1.2.0")).toBe(true);
    expect(satisfiesSemVer("1.3.0", "~1.2.0")).toBe(false);

    expect(satisfiesSemVer("0.5.0", ">=0.1.0 <1.0.0")).toBe(true);
    expect(satisfiesSemVer("1.0.0", ">=0.1.0 <1.0.0")).toBe(false);
    expect(satisfiesSemVer("1.0.0-rc.1", ">=0.1.0 <1.0.0")).toBe(false);

    expect(satisfiesSemVer("0.2.1", "^0.1.0 || ^0.2.0")).toBe(true);
  });
});

describe("AddonRegistry", () => {
  it("loads __base before a dependent addon", async () => {
    const registry = new AddonRegistry();
    const timeline = addon("timeline", ["__base"], { routes: ["timeline"] });
    const base = addon("__base", [], { routes: ["health"], models: ["users"] });
    registry.add(timeline).add(base);

    const loaded: string[] = [];
    base.register.mockImplementation(async () => void loaded.push("__base"));
    timeline.register.mockImplementation(async () => void loaded.push("timeline"));

    await registry.load();
    expect(loaded).toEqual(["__base", "timeline"]);
  });

  it("detects a missing dependency with full path", () => {
    const registry = new AddonRegistry().add(addon("leaf", ["mid"])).add(addon("mid", ["__base"]));
    expect(() => registry.resolveOrder()).toThrow(AddonRegistryError);
    expect(() => registry.resolveOrder()).toThrow(/Missing addon dependency '__base'.*leaf -> mid/);
  });

  it("detects a dependency cycle with full path", () => {
    const registry = new AddonRegistry().add(addon("a", ["b"])).add(addon("b", ["a"]));
    expect(() => registry.resolveOrder()).toThrow(/Circular addon dependency: a -> b -> a/);
  });

  it("rejects duplicate addon names", () => {
    const registry = new AddonRegistry().add(addon("a"));
    expect(() => registry.add(addon("a"))).toThrow(/Duplicate addon name/);
  });

  it("rejects route/model/capability collisions across addons", () => {
    const routeConflict = new AddonRegistry()
      .add(addon("a", [], { routes: ["shared"] }))
      .add(addon("b", [], { routes: ["shared"] }));
    expect(() => routeConflict.validate()).toThrow(/already claimed/);

    const capConflict = new AddonRegistry()
      .add(addon("a", [], {}, "1.0.0", ["crm.pipeline"]))
      .add(addon("b", ["a"], {}, "1.0.0", ["crm.pipeline"]));
    expect(() => capConflict.validate()).toThrow(
      /capabilities 'crm\.pipeline'.*already claimed by another addon \('a'\)/,
    );
  });

  it("resolves versioned dependencies and rejects incompatible version ranges before loading", async () => {
    const ok = new AddonRegistry()
      .add(addon("__base", [], {}, "0.1.0"))
      .add(addon("auth", ["__base@^0.1.0"], {}, "0.1.4"))
      .add(addon("ai", ["__base@>=0.1.0 <1.0.0", "auth@~0.1.0"], {}, "1.0.0"));
    expect(ok.resolveOrder()).toEqual(["__base", "auth", "ai"]);

    const bad = new AddonRegistry()
      .add(addon("__base", [], {}, "0.1.0"))
      .add(addon("auth", ["__base@^0.1.0"], {}, "0.1.4"))
      .add(addon("ai", ["auth@^0.2.0"], {}, "1.0.0"));
    expect(() => bad.resolveOrder()).toThrow(
      /Incompatible addon dependency version: 'ai -> auth' requires '\^0\.2\.0', but 'auth' is at '0\.1\.4'/,
    );
    await expect(bad.load()).rejects.toThrow(/Incompatible addon dependency version/);
  });

  it("exposes the loaded set to each register callback", async () => {
    const registry = new AddonRegistry();
    let seen: string[] = [];
    registry.add(addon("__base")).add({
      manifest: { name: "timeline", version: "1.0.0", depends: ["__base"], provides: {} },
      register: (ctx) => {
        seen = ctx.loaded;
      },
    });
    await registry.load();
    expect(seen).toEqual(["__base"]);
  });

  it("plans installs and upgrades deterministically with affected dependents and migrations", () => {
    const plan = planUpgrade(
      [
        {
          manifest: {
            name: "billing",
            version: "1.0.0",
            depends: ["auth@^0.2.0"],
            provides: { migrations: ["billing_001_init"] },
          },
          migrations: [{ id: "billing_001_init", up: "CREATE TABLE t_billing (id TEXT)" }],
        },
        {
          manifest: {
            name: "ai",
            version: "0.1.0",
            depends: ["__base@^0.1.0", "auth@>=0.1.0 <1.0.0"],
          },
        },
        {
          manifest: {
            name: "auth",
            version: "0.2.0",
            depends: ["__base@^0.1.0"],
            provides: { migrations: ["auth_001_init", "auth_002_oidc"] },
          },
          migrations: [
            { id: "auth_001_init", up: "SELECT 1" },
            { id: "auth_002_oidc", up: "SELECT 2" },
          ],
        },
        {
          manifest: { name: "__base", version: "0.1.0", depends: [] },
        },
      ],
      {
        __base: "0.1.0",
        auth: "0.1.0",
        ai: "0.1.0",
      },
    );

    expect(plan.order).toEqual(["__base", "auth", "ai", "billing"]);
    expect(plan.unchanged).toEqual(["__base", "ai"]);
    expect(plan.upgrades).toEqual(["auth"]);
    expect(plan.installs).toEqual(["billing"]);
    expect(plan.affectedDependents.auth).toEqual(["ai", "billing"]);
    expect(plan.affectedDependents.billing).toEqual([]);
    expect(plan.declaredMigrationIds).toEqual([
      "auth_001_init",
      "auth_002_oidc",
      "billing_001_init",
    ]);
  });
});
