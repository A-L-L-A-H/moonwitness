export type ServiceHealthState = "online" | "degraded" | "offline";

export interface EcosystemServiceStatus {
  readonly id: "web" | "api" | "arsy" | "memory";
  readonly name: string;
  readonly url: string;
  readonly status: ServiceHealthState;
  readonly httpStatus: number | null;
  readonly latencyMs: number | null;
}

export interface EcosystemGitStatus {
  readonly available: boolean;
  readonly branch: string | null;
  readonly headShort: string | null;
  readonly dirtyCount: number;
  readonly lastCommitSubject: string | null;
  readonly lastCommitAge: string | null;
}

export interface EcosystemSnapshot {
  readonly generatedAt: string;
  readonly status: "online" | "offline";
  readonly databaseStatus: string | null;
  readonly timelineTotal: number | null;
  readonly erasCount: number | null;
  readonly services: readonly EcosystemServiceStatus[];
  readonly git: EcosystemGitStatus;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
export type GitRunnerLike = (args: readonly string[]) => Promise<string | null>;

const PROBE_TIMEOUT_MS = 1200;

interface ProbeTarget {
  readonly id: EcosystemServiceStatus["id"];
  readonly name: string;
  readonly displayUrl: string;
  readonly probeUrl: string;
}

function buildProbeTargets(): readonly ProbeTarget[] {
  const webBase = (process.env.WEB_INTERNAL_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
  const apiBase = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3002").replace(/\/+$/, "");
  const arsyBase = (process.env.ARSY_URL ?? "http://127.0.0.1:8787").replace(/\/+$/, "");
  const memoryBase = (process.env.MEMORY_API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

  return [
    { id: "web", name: "Web Portal", displayUrl: webBase, probeUrl: webBase },
    {
      id: "api",
      name: "Core API",
      displayUrl: apiBase,
      probeUrl: `${apiBase}/api/v1/healthz`,
    },
    { id: "arsy", name: "ARSY Control", displayUrl: arsyBase, probeUrl: `${arsyBase}/v1/health` },
    {
      id: "memory",
      name: "Memory Engine",
      displayUrl: memoryBase,
      probeUrl: `${memoryBase}/health`,
    },
  ];
}

async function defaultGitRunner(args: readonly string[]): Promise<string | null> {
  if (
    typeof process === "undefined" ||
    !process.versions?.node ||
    typeof process.cwd !== "function"
  ) {
    return null;
  }
  try {
    const [{ execFile }, { promisify }] = await Promise.all([
      import("node:child_process"),
      import("node:util"),
    ]);
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync("git", [...args], {
      cwd: process.cwd(),
      timeout: PROBE_TIMEOUT_MS,
      windowsHide: true,
    });
    return stdout.trimEnd();
  } catch {
    return null;
  }
}

export async function probeLocalGit(
  gitRunner: GitRunnerLike = defaultGitRunner,
): Promise<EcosystemGitStatus> {
  const [branchRaw, headRaw, statusRaw, logRaw] = await Promise.all([
    gitRunner(["rev-parse", "--abbrev-ref", "HEAD"]),
    gitRunner(["rev-parse", "--short", "HEAD"]),
    gitRunner(["status", "--porcelain"]),
    gitRunner(["log", "-1", "--format=%s\x1f%ar"]),
  ]);

  if (!branchRaw && !headRaw) {
    return {
      available: false,
      branch: null,
      headShort: null,
      dirtyCount: 0,
      lastCommitSubject: null,
      lastCommitAge: null,
    };
  }

  const dirtyCount = statusRaw
    ? statusRaw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean).length
    : 0;

  const [subjectPart, agePart] = (logRaw ?? "").split("\x1f");

  return {
    available: true,
    branch: branchRaw || null,
    headShort: headRaw || null,
    dirtyCount,
    lastCommitSubject: subjectPart ? subjectPart : null,
    lastCommitAge: agePart ? agePart : null,
  };
}

async function probeServiceTarget(
  target: ProbeTarget,
  fetchFn: FetchLike,
): Promise<EcosystemServiceStatus> {
  const startedAt = Date.now();
  try {
    const response = await fetchFn(target.probeUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    const latencyMs = Math.max(0, Date.now() - startedAt);
    return {
      id: target.id,
      name: target.name,
      url: target.displayUrl,
      status: response.ok ? "online" : "degraded",
      httpStatus: response.status,
      latencyMs,
    };
  } catch {
    return {
      id: target.id,
      name: target.name,
      url: target.displayUrl,
      status: "offline",
      httpStatus: null,
      latencyMs: null,
    };
  }
}

async function fetchJsonSafe(fetchFn: FetchLike, url: string): Promise<unknown> {
  try {
    const response = await fetchFn(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function probeEcosystemHealth(options?: {
  readonly fetchFn?: FetchLike;
  readonly gitRunner?: GitRunnerLike;
}): Promise<EcosystemSnapshot> {
  const fetchFn = options?.fetchFn ?? ((input: string, init?: RequestInit) => fetch(input, init));
  const gitRunner = options?.gitRunner ?? defaultGitRunner;
  const targets = buildProbeTargets();
  const apiBase = targets.find((item) => item.id === "api")!.displayUrl;

  const [services, git, readyPayload, statsPayload, erasPayload] = await Promise.all([
    Promise.all(targets.map((target) => probeServiceTarget(target, fetchFn))),
    probeLocalGit(gitRunner),
    fetchJsonSafe(fetchFn, `${apiBase}/api/v1/readyz`),
    fetchJsonSafe(fetchFn, `${apiBase}/api/v1/timeline/stats`),
    fetchJsonSafe(fetchFn, `${apiBase}/api/v1/timeline/eras`),
  ]);

  const apiService = services.find((item) => item.id === "api");
  const apiOnline = apiService?.status === "online";

  let databaseStatus: string | null = null;
  if (readyPayload && typeof readyPayload === "object" && "database" in readyPayload) {
    const rawDb = (readyPayload as { database?: unknown }).database;
    databaseStatus = typeof rawDb === "string" ? rawDb : apiOnline ? "ready" : null;
  } else if (apiOnline) {
    databaseStatus = "ready";
  }

  let timelineTotal: number | null = null;
  if (statsPayload && typeof statsPayload === "object" && "data" in statsPayload) {
    const total = (statsPayload as { data?: { total?: unknown } }).data?.total;
    if (typeof total === "number") timelineTotal = total;
  }

  let erasCount: number | null = null;
  if (erasPayload && typeof erasPayload === "object" && "data" in erasPayload) {
    const list = (erasPayload as { data?: unknown }).data;
    if (Array.isArray(list)) erasCount = list.length;
  }

  return {
    generatedAt: new Date().toISOString(),
    status: apiOnline ? "online" : "offline",
    databaseStatus,
    timelineTotal,
    erasCount,
    services,
    git,
  };
}
