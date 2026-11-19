import { z } from "zod";
import type { Migration } from "@moonwitness/orm";

export const ADDON_NAME_REGEX = /^[a-z_][a-z0-9_-]*$/;

/**
 * Strict SemVer 2.0.0 pattern: `major.minor.patch[-prerelease][+build]`.
 */
export const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export interface ParsedSemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: Array<number | string>;
  build: string[];
}

export interface ParsedDependencySpec {
  name: string;
  range: string | null;
}

export function isValidSemVer(version: string): boolean {
  return SEMVER_REGEX.test(version);
}

export function parseSemVer(version: string): ParsedSemVer | null {
  const match = SEMVER_REGEX.exec(version);
  if (!match) return null;
  const [, majorStr, minorStr, patchStr, preStr, buildStr] = match;
  const prerelease: Array<number | string> = preStr
    ? preStr.split(".").map((part) => (/^(0|[1-9]\d*)$/.test(part) ? Number(part) : part))
    : [];
  const build = buildStr ? buildStr.split(".") : [];
  return {
    major: Number(majorStr),
    minor: Number(minorStr),
    patch: Number(patchStr),
    prerelease,
    build,
  };
}

function compareCoreAndPre(a: ParsedSemVer, b: ParsedSemVer): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;

  const aPre = a.prerelease;
  const bPre = b.prerelease;
  if (aPre.length === 0 && bPre.length === 0) return 0;
  if (aPre.length === 0) return 1;
  if (bPre.length === 0) return -1;

  const len = Math.max(aPre.length, bPre.length);
  for (let i = 0; i < len; i++) {
    const ai = aPre[i];
    const bi = bPre[i];
    if (ai === undefined) return -1;
    if (bi === undefined) return 1;
    if (ai === bi) continue;
    const aNum = typeof ai === "number";
    const bNum = typeof bi === "number";
    if (aNum && bNum) return ai - bi;
    if (aNum) return -1;
    if (bNum) return 1;
    return String(ai) < String(bi) ? -1 : 1;
  }
  return 0;
}

export function compareSemVer(a: string, b: string): number {
  const pa = parseSemVer(a);
  const pb = parseSemVer(b);
  if (!pa || !pb) {
    throw new AddonRegistryError(`Invalid SemVer comparison: '${a}' vs '${b}'.`);
  }
  return compareCoreAndPre(pa, pb);
}

interface Comparator {
  op: "=" | "<" | "<=" | ">" | ">=";
  target: ParsedSemVer;
}

const PARTIAL_VERSION_REGEX =
  /^(?:v)?(0|[1-9]\d*|x|X|\*)(?:\.(0|[1-9]\d*|x|X|\*)(?:\.(0|[1-9]\d*|x|X|\*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)?)?$/;

function isWildcardToken(token: string | undefined): boolean {
  return token === undefined || token === "*" || token === "x" || token === "X";
}

function parsePrereleaseList(preStr: string | undefined): Array<number | string> {
  if (!preStr) return [];
  return preStr.split(".").map((part) => (/^(0|[1-9]\d*)$/.test(part) ? Number(part) : part));
}

function makeBoundary(major: number, minor: number, patch: number, preZero = false): ParsedSemVer {
  return {
    major,
    minor,
    patch,
    prerelease: preZero ? [0] : [],
    build: [],
  };
}

function expandTokenToComparators(token: string): Comparator[] | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  if (trimmed === "*" || trimmed === "x" || trimmed === "X") {
    return [{ op: ">=", target: makeBoundary(0, 0, 0) }];
  }

  let prefix: "" | "^" | "~" | "=" | "<" | "<=" | ">" | ">=" = "";
  let rest = trimmed;
  for (const cand of [">=", "<=", ">", "<", "=", "^", "~"] as const) {
    if (trimmed.startsWith(cand)) {
      prefix = cand;
      rest = trimmed.slice(cand.length).trim();
      break;
    }
  }

  const m = PARTIAL_VERSION_REGEX.exec(rest);
  if (!m) return null;
  const [, rawMajor, rawMinor, rawPatch, preStr] = m;

  if (isWildcardToken(rawMajor)) {
    if (prefix === ">" || prefix === "<") return null;
    return [{ op: ">=", target: makeBoundary(0, 0, 0) }];
  }

  const major = Number(rawMajor);
  const hasMinor = !isWildcardToken(rawMinor);
  const hasPatch = hasMinor && !isWildcardToken(rawPatch);
  const minor = hasMinor ? Number(rawMinor) : 0;
  const patch = hasPatch ? Number(rawPatch) : 0;
  const prerelease = hasPatch ? parsePrereleaseList(preStr) : [];

  if (prefix === "^") {
    const lower: ParsedSemVer = { major, minor, patch, prerelease, build: [] };
    let upper: ParsedSemVer;
    if (!hasMinor || major > 0) {
      upper = makeBoundary(major + 1, 0, 0, true);
    } else if (!hasPatch || minor > 0) {
      upper = makeBoundary(0, minor + 1, 0, true);
    } else {
      upper = makeBoundary(0, 0, patch + 1, true);
    }
    return [
      { op: ">=", target: lower },
      { op: "<", target: upper },
    ];
  }

  if (prefix === "~") {
    const lower: ParsedSemVer = { major, minor, patch, prerelease, build: [] };
    const upper = !hasMinor
      ? makeBoundary(major + 1, 0, 0, true)
      : makeBoundary(major, minor + 1, 0, true);
    return [
      { op: ">=", target: lower },
      { op: "<", target: upper },
    ];
  }

  if (!hasMinor) {
    if (prefix === ">" || prefix === ">=") {
      return [
        {
          op: ">=",
          target: prefix === ">" ? makeBoundary(major + 1, 0, 0) : makeBoundary(major, 0, 0),
        },
      ];
    }
    if (prefix === "<" || prefix === "<=") {
      return [
        {
          op: "<",
          target:
            prefix === "<=" ? makeBoundary(major + 1, 0, 0, true) : makeBoundary(major, 0, 0, true),
        },
      ];
    }
    return [
      { op: ">=", target: makeBoundary(major, 0, 0) },
      { op: "<", target: makeBoundary(major + 1, 0, 0, true) },
    ];
  }

  if (!hasPatch) {
    if (prefix === ">" || prefix === ">=") {
      return [
        {
          op: ">=",
          target:
            prefix === ">" ? makeBoundary(major, minor + 1, 0) : makeBoundary(major, minor, 0),
        },
      ];
    }
    if (prefix === "<" || prefix === "<=") {
      return [
        {
          op: "<",
          target:
            prefix === "<="
              ? makeBoundary(major, minor + 1, 0, true)
              : makeBoundary(major, minor, 0, true),
        },
      ];
    }
    return [
      { op: ">=", target: makeBoundary(major, minor, 0) },
      { op: "<", target: makeBoundary(major, minor + 1, 0, true) },
    ];
  }

  const target: ParsedSemVer = { major, minor, patch, prerelease, build: [] };
  const op = prefix === "" ? "=" : prefix;
  return [{ op, target }];
}

function parseComparatorSet(clause: string): Comparator[] | null {
  const trimmed = clause.trim();
  if (!trimmed) return null;

  // Support hyphen ranges: "1.0.0 - 2.0.0"
  const hyphenParts = trimmed.split(/\s+-\s+/);
  if (hyphenParts.length === 2) {
    const low = expandTokenToComparators(`>=${hyphenParts[0]!.trim()}`);
    const high = expandTokenToComparators(`<=${hyphenParts[1]!.trim()}`);
    if (!low || !high) return null;
    return [...low, ...high];
  }
  if (hyphenParts.length > 2) return null;

  // Normalize spaces after operators like ">= 1.0.0" -> ">=1.0.0"
  const normalized = trimmed.replace(/(>=|<=|>|<|=|\^|~)\s+/g, "$1");
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const comparators: Comparator[] = [];
  for (const token of tokens) {
    const expanded = expandTokenToComparators(token);
    if (!expanded) return null;
    comparators.push(...expanded);
  }
  return comparators;
}

function parseSemVerRange(range: string): Comparator[][] | null {
  const trimmed = range.trim();
  if (!trimmed) return null;
  const clauses = trimmed.split("||");
  const parsed: Comparator[][] = [];
  for (const clause of clauses) {
    const set = parseComparatorSet(clause);
    if (!set) return null;
    parsed.push(set);
  }
  return parsed;
}

export function isValidSemVerRange(range: string): boolean {
  return parseSemVerRange(range) !== null;
}

function matchesComparator(ver: ParsedSemVer, cmp: Comparator): boolean {
  const diff = compareCoreAndPre(ver, cmp.target);
  switch (cmp.op) {
    case "=":
      return diff === 0;
    case "<":
      return diff < 0;
    case "<=":
      return diff <= 0;
    case ">":
      return diff > 0;
    case ">=":
      return diff >= 0;
  }
}

function matchesComparatorSet(ver: ParsedSemVer, set: Comparator[]): boolean {
  for (const cmp of set) {
    if (!matchesComparator(ver, cmp)) return false;
  }
  if (ver.prerelease.length > 0) {
    const hasMatchingPrereleaseTuple = set.some(
      (cmp) =>
        cmp.target.prerelease.length > 0 &&
        cmp.target.major === ver.major &&
        cmp.target.minor === ver.minor &&
        cmp.target.patch === ver.patch,
    );
    if (!hasMatchingPrereleaseTuple) return false;
  }
  return true;
}

export function satisfiesSemVer(version: string, range: string): boolean {
  const ver = parseSemVer(version);
  if (!ver) return false;
  const sets = parseSemVerRange(range);
  if (!sets) return false;
  return sets.some((set) => matchesComparatorSet(ver, set));
}

function tryParseDependencySpec(dep: string): ParsedDependencySpec | null {
  const trimmed = dep.trim();
  if (!trimmed) return null;
  const atIdx = trimmed.indexOf("@");
  if (atIdx === -1) {
    return ADDON_NAME_REGEX.test(trimmed) ? { name: trimmed, range: null } : null;
  }
  const name = trimmed.slice(0, atIdx).trim();
  const range = trimmed.slice(atIdx + 1).trim();
  if (!ADDON_NAME_REGEX.test(name) || !range || !isValidSemVerRange(range)) {
    return null;
  }
  return { name, range };
}

export function parseDependencySpec(dep: string): ParsedDependencySpec {
  const parsed = tryParseDependencySpec(dep);
  if (!parsed) {
    throw new AddonRegistryError(
      `Invalid addon dependency specification '${dep}': expected '<addon>' or '<addon>@<semver-range>'.`,
    );
  }
  return parsed;
}

export const AddonManifestSignatureSchema = z.object({
  algorithm: z.enum(["ed25519", "hmac-sha256"]),
  keyId: z.string().min(1),
  digest: z.string().min(1),
  signedAt: z.string().optional(),
});
export type AddonManifestSignature = z.infer<typeof AddonManifestSignatureSchema>;

/**
 * Addon manifest contract. Every addon declares its identity, SemVer version,
 * dependencies (plain name or `<name>@<semver-range>`), and what it provides
 * so the registry can validate and load it deterministically.
 */
export const AddonManifestSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(ADDON_NAME_REGEX, "addon name must be lowercase alphanumeric with _ or -"),
  version: z
    .string()
    .min(1)
    .regex(
      SEMVER_REGEX,
      "addon version must follow strict SemVer (major.minor.patch[-prerelease][+build])",
    ),
  description: z.string().optional(),
  category: z.string().optional(),
  autoInstall: z.boolean().default(false),
  defaultEnabled: z.boolean().default(true),
  depends: z
    .array(
      z
        .string()
        .min(1)
        .refine(
          (dep) => tryParseDependencySpec(dep) !== null,
          "dependency must be '<name>' or '<name>@<semver-range>'",
        ),
    )
    .default([]),
  capabilities: z.array(z.string().min(1)).default([]),
  signature: AddonManifestSignatureSchema.optional(),
  provides: z
    .object({
      routes: z.array(z.string().min(1)).default([]),
      models: z.array(z.string().min(1)).default([]),
      extends: z.array(z.string().min(1)).default([]),
      migrations: z.array(z.string().min(1)).default([]),
      seeds: z.array(z.string().min(1)).default([]),
      permissions: z.array(z.string().min(1)).default([]),
      auditActions: z.array(z.string().min(1)).default([]),
    })
    .prefault({}),
});
export type AddonManifest = z.infer<typeof AddonManifestSchema>;

export interface RegisteredAddon {
  manifest: AddonManifestInput;
  /** Optional ORM SQL migrations owned by this addon. */
  migrations?: Migration[];
  /** The addon's registration callback, invoked in dependency order. */
  register: (ctx: AddonContext) => Promise<void> | void;
}

export type AddonManifestInput = z.input<typeof AddonManifestSchema>;

export interface AddonContext {
  /** Names of addons already registered before this one. */
  loaded: string[];
  /** Merge-safe registry state owned by the caller. */
  state: RegistryState;
}

export interface RegistryState {
  routes: Set<string>;
  models: Set<string>;
  migrations: Set<string>;
  seeds: Set<string>;
  permissions: Set<string>;
  capabilities: Set<string>;
}

export class AddonRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AddonRegistryError";
  }
}

function emptyState(): RegistryState {
  return {
    routes: new Set(),
    models: new Set(),
    migrations: new Set(),
    seeds: new Set(),
    permissions: new Set(),
    capabilities: new Set(),
  };
}

function assertUniqueStrings(items: string[], label: string, addonName: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item)) {
      throw new AddonRegistryError(`Addon '${addonName}' declares duplicate ${label} '${item}'.`);
    }
    seen.add(item);
  }
}

function validateAddonMigrations(
  addonName: string,
  manifest: AddonManifest,
  migrations?: Migration[],
): string[] {
  assertUniqueStrings(manifest.provides.migrations, "provides.migrations", addonName);

  if (!migrations) {
    return [...manifest.provides.migrations];
  }

  const migrationIds = migrations.map((m) => m.id);
  assertUniqueStrings(migrationIds, "migration", addonName);

  for (const migration of migrations) {
    if (!migration.id || !migration.id.trim()) {
      throw new AddonRegistryError(`Addon '${addonName}' declares a migration with an empty id.`);
    }
    if (migration.owner !== undefined && migration.owner !== addonName) {
      throw new AddonRegistryError(
        `Addon '${addonName}' migration '${migration.id}' has owner '${migration.owner}' which does not match '${addonName}'.`,
      );
    }
  }

  if (manifest.provides.migrations.length > 0) {
    const declared = manifest.provides.migrations;
    const mismatch =
      declared.length !== migrationIds.length ||
      declared.some((id, index) => migrationIds[index] !== id);
    if (mismatch) {
      throw new AddonRegistryError(
        `Addon '${addonName}' manifest.provides.migrations [${declared.join(", ")}] does not match migrations [${migrationIds.join(", ")}].`,
      );
    }
  }

  return migrationIds;
}

/**
 * Deterministic addon registry: validates manifests & SemVer dependencies,
 * detects duplicate names/capabilities/migrations/routes/models, missing
 * dependencies, incompatible version ranges, and cycles, and loads addons
 * in topological order.
 */
export class AddonRegistry {
  private readonly addons = new Map<
    string,
    { manifest: AddonManifest; migrations: Migration[]; register: RegisteredAddon["register"] }
  >();

  add(addon: RegisteredAddon): this {
    const parsed = AddonManifestSchema.parse(addon.manifest);
    if (this.addons.has(parsed.name)) {
      throw new AddonRegistryError(`Duplicate addon name '${parsed.name}'.`);
    }
    validateAddonMigrations(parsed.name, parsed, addon.migrations);
    assertUniqueStrings(parsed.capabilities, "capability", parsed.name);
    this.addons.set(parsed.name, {
      manifest: parsed,
      migrations: addon.migrations ? [...addon.migrations] : [],
      register: addon.register,
    });
    return this;
  }

  getManifest(name: string): AddonManifest | undefined {
    return this.addons.get(name)?.manifest;
  }

  getMigrations(name: string): Migration[] {
    return [...(this.addons.get(name)?.migrations ?? [])];
  }

  /** Resolve deterministic topological load order; throws on missing, cycle, or incompatible version. */
  resolveOrder(): string[] {
    const order: string[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (name: string, path: string[]) => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new AddonRegistryError(`Circular addon dependency: ${[...path, name].join(" -> ")}.`);
      }
      const addon = this.addons.get(name);
      if (!addon) {
        throw new AddonRegistryError(
          `Missing addon dependency '${name}'${path.length ? ` (required by ${path.join(" -> ")})` : ""}.`,
        );
      }
      visiting.add(name);
      const nextPath = [...path, name];
      const sortedDeps = [...addon.manifest.depends].sort((a, b) =>
        parseDependencySpec(a).name.localeCompare(parseDependencySpec(b).name),
      );
      for (const depRaw of sortedDeps) {
        const dep = parseDependencySpec(depRaw);
        if (visiting.has(dep.name)) {
          throw new AddonRegistryError(
            `Circular addon dependency: ${[...nextPath, dep.name].join(" -> ")}.`,
          );
        }
        const depAddon = this.addons.get(dep.name);
        if (!depAddon) {
          throw new AddonRegistryError(
            `Missing addon dependency '${dep.name}' (required by ${nextPath.join(" -> ")}).`,
          );
        }
        if (dep.range !== null && !satisfiesSemVer(depAddon.manifest.version, dep.range)) {
          throw new AddonRegistryError(
            `Incompatible addon dependency version: '${nextPath.join(" -> ")} -> ${dep.name}' requires '${dep.range}', but '${dep.name}' is at '${depAddon.manifest.version}'.`,
          );
        }
        visit(dep.name, nextPath);
      }
      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    const sortedNames = [...this.addons.keys()].sort((a, b) => a.localeCompare(b));
    for (const name of sortedNames) visit(name, []);
    return order;
  }

  /** Validate the whole registry without registering: order + collisions + extends targets. */
  validate(): string[] {
    const order = this.resolveOrder();
    const state = emptyState();
    const owners: Record<keyof RegistryState, Map<string, string>> = {
      routes: new Map(),
      models: new Map(),
      migrations: new Map(),
      seeds: new Map(),
      permissions: new Map(),
      capabilities: new Map(),
    };
    for (const name of order) {
      const entry = this.addons.get(name)!;
      this.claim(state, name, entry.manifest, entry.migrations, owners);
    }
    return order;
  }

  private claim(
    state: RegistryState,
    addonName: string,
    manifest: AddonManifest,
    migrations: Migration[] = [],
    owners?: Record<keyof RegistryState, Map<string, string>>,
  ): void {
    const migrationIds = validateAddonMigrations(addonName, manifest, migrations);
    const groups: Array<[keyof RegistryState, string[]]> = [
      ["routes", manifest.provides.routes],
      ["models", manifest.provides.models],
      ["migrations", migrationIds],
      ["seeds", manifest.provides.seeds],
      ["permissions", manifest.provides.permissions],
      ["capabilities", manifest.capabilities],
    ];
    for (const [group, items] of groups) {
      for (const item of items) {
        if (state[group].has(item)) {
          const owner = owners?.[group].get(item);
          throw new AddonRegistryError(
            `Addon '${addonName}' provides ${group} '${item}' which is already claimed by another addon${owner ? ` ('${owner}')` : ""}.`,
          );
        }
        state[group].add(item);
        owners?.[group].set(item, addonName);
      }
    }

    for (const targetModel of manifest.provides.extends) {
      if (!state.models.has(targetModel)) {
        throw new AddonRegistryError(
          `Addon '${addonName}' declares extends '${targetModel}' which is not provided by any loaded dependency.`,
        );
      }
    }
  }

  /** Load addons in dependency order, invoking each register callback. */
  async load(): Promise<RegistryState> {
    const order = this.resolveOrder();
    const state = emptyState();
    const owners: Record<keyof RegistryState, Map<string, string>> = {
      routes: new Map(),
      models: new Map(),
      migrations: new Map(),
      seeds: new Map(),
      permissions: new Map(),
      capabilities: new Map(),
    };
    const loaded: string[] = [];

    for (const name of order) {
      const addon = this.addons.get(name)!;
      this.claim(state, name, addon.manifest, addon.migrations, owners);
      await addon.register({ loaded: [...loaded], state });
      loaded.push(name);
    }

    return state;
  }
}

export type InstalledAddonSnapshot =
  | string
  | null
  | undefined
  | {
      version?: string | null;
      state?: string | null;
    };

export type UpgradePlanInputAddon =
  | AddonManifestInput
  | {
      manifest: AddonManifestInput;
      migrations?: Migration[];
      register?: RegisteredAddon["register"];
    };

export interface UpgradePlanAction {
  name: string;
  action: "install" | "upgrade" | "unchanged";
  fromVersion: string | null;
  toVersion: string;
  affectedDependents: string[];
  declaredMigrations: string[];
}

export interface UpgradePlan {
  order: string[];
  installs: string[];
  upgrades: string[];
  unchanged: string[];
  affectedDependents: Record<string, string[]>;
  declaredMigrationIds: string[];
  migrationsByAddon: Record<string, string[]>;
  steps: UpgradePlanAction[];
}

/**
 * Pure dry-run upgrade/install planner: validates SemVer dependencies, cycles,
 * missing dependencies, capabilities, and declared migrations without mutating
 * any database or runtime state.
 */
export function planUpgrade(
  addons: UpgradePlanInputAddon[],
  installedVersions: Record<string, InstalledAddonSnapshot> = {},
): UpgradePlan {
  const registry = new AddonRegistry();
  for (const item of addons) {
    if ("manifest" in item) {
      registry.add({
        manifest: item.manifest,
        migrations: item.migrations,
        register: item.register ?? (() => {}),
      });
    } else {
      registry.add({
        manifest: item,
        register: () => {},
      });
    }
  }

  const order = registry.validate();
  const orderIndex = new Map(order.map((name, idx) => [name, idx]));

  const dependentsMap = new Map<string, Set<string>>();
  for (const name of order) {
    dependentsMap.set(name, new Set());
  }
  for (const name of order) {
    const manifest = registry.getManifest(name)!;
    for (const depRaw of manifest.depends) {
      const dep = parseDependencySpec(depRaw);
      dependentsMap.get(dep.name)?.add(name);
    }
  }

  const collectTransitiveDependents = (root: string): string[] => {
    const seen = new Set<string>();
    const queue = [...(dependentsMap.get(root) ?? [])];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (seen.has(current)) continue;
      seen.add(current);
      for (const next of dependentsMap.get(current) ?? []) {
        if (!seen.has(next)) queue.push(next);
      }
    }
    return [...seen].sort((a, b) => (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0));
  };

  const installs: string[] = [];
  const upgrades: string[] = [];
  const unchanged: string[] = [];
  const affectedDependents: Record<string, string[]> = {};
  const declaredMigrationIds: string[] = [];
  const migrationsByAddon: Record<string, string[]> = {};
  const steps: UpgradePlanAction[] = [];

  for (const name of order) {
    const manifest = registry.getManifest(name)!;
    const migrations = registry.getMigrations(name);
    const declaredMigrations =
      migrations.length > 0 ? migrations.map((m) => m.id) : [...manifest.provides.migrations];
    migrationsByAddon[name] = declaredMigrations;

    const snapshot = installedVersions[name];
    let fromVersion: string | null = null;
    let prevState: string | null = null;
    if (typeof snapshot === "string") {
      fromVersion = snapshot;
    } else if (snapshot && typeof snapshot === "object") {
      fromVersion = snapshot.version ?? null;
      prevState = snapshot.state ?? null;
    }

    let action: UpgradePlanAction["action"];
    if (!fromVersion || prevState === "discovered" || prevState === "installing") {
      action = "install";
      installs.push(name);
    } else if (
      fromVersion !== manifest.version ||
      prevState === "upgrade_pending" ||
      prevState === "error" ||
      prevState === "disabled"
    ) {
      action = "upgrade";
      upgrades.push(name);
    } else {
      action = "unchanged";
      unchanged.push(name);
    }

    const dependents = collectTransitiveDependents(name);
    if (action !== "unchanged") {
      affectedDependents[name] = dependents;
      declaredMigrationIds.push(...declaredMigrations);
    }

    steps.push({
      name,
      action,
      fromVersion,
      toVersion: manifest.version,
      affectedDependents: dependents,
      declaredMigrations,
    });
  }

  return {
    order,
    installs,
    upgrades,
    unchanged,
    affectedDependents,
    declaredMigrationIds,
    migrationsByAddon,
    steps,
  };
}
