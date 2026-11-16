import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { openStore } from "./db.js";

const root = process.env.PROPHET_RESEARCH_ROOT ?? process.cwd();
const store = openStore(root);
const port = Number(process.env.PORT ?? 4310);
const webDist = resolve(root, "apps/web/dist");
const allowedDevOrigins = new Set(["http://127.0.0.1:5173", "http://localhost:5173"]);

function setCommonHeaders(res: ServerResponse) {
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("referrer-policy", "no-referrer");
}

function json(req: IncomingMessage, res: ServerResponse, status: number, body?: unknown) {
  setCommonHeaders(res);
  const origin = typeof req.headers?.origin === "string" ? req.headers.origin : null;
  if (origin && allowedDevOrigins.has(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "Origin");
  }
  res.setHeader("access-control-allow-headers", "content-type");
  res.setHeader("access-control-allow-methods", "GET, OPTIONS");
  res.statusCode = status;
  if (status === 204) return res.end();
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body ?? null));
}

function scopedDocument(document: unknown, id: string, key: string, predicate: (value: Record<string, unknown>) => boolean) {
  const raw = Array.isArray(document)
    ? document
    : typeof document === "object" && document !== null
      ? (document as Record<string, unknown>)[key]
      : [];
  const values = Array.isArray(raw)
    ? raw.filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null && predicate(value as Record<string, unknown>))
    : [];
  return { prophet_id: id, [key]: values };
}

function handleApi(req: IncomingMessage, res: ServerResponse, pathname: string): boolean {
  if (!pathname.startsWith("/api/")) return false;
  if (req.method === "OPTIONS") { json(req, res, 204); return true; }
  if (req.method !== "GET") { json(req, res, 405, { error: "method_not_allowed" }); return true; }

  if (pathname === "/api/v2/health") { json(req, res, 200, store.health()); return true; }
  if (pathname === "/api/v2/prophets") { json(req, res, 200, store.listProphets()); return true; }
  if (pathname === "/api/v2/leaderboards") { json(req, res, 200, store.getLeaderboards()); return true; }
  if (pathname === "/api/v2/corpus") { json(req, res, 200, store.getCorpus()); return true; }
  if (pathname === "/api/v2/docs") { json(req, res, 200, store.getDocs()); return true; }
  if (pathname === "/api/v2/provenance") { json(req, res, 200, store.getDocument("provenance")); return true; }
  if (pathname === "/api/v2/timeline") { json(req, res, 200, store.getDocument("timeline")); return true; }
  if (pathname === "/api/v2/events") { json(req, res, 200, store.getDocument("events")); return true; }
  if (pathname === "/api/v2/genealogy") { json(req, res, 200, store.getDocument("genealogy")); return true; }
  if (pathname === "/api/v2/uncertainty") { json(req, res, 200, store.getDocument("uncertainty")); return true; }
  if (pathname === "/api/v2/validation") { json(req, res, 200, store.getDocument("validation")); return true; }
  if (pathname === "/api/v2/scoring-audit") { json(req, res, 200, store.getDocument("scoring-audit")); return true; }
  if (pathname === "/api/v2/source-editions") { json(req, res, 200, store.getDocument("source-editions")); return true; }
  if (pathname === "/api/v2/conflicts") { json(req, res, 200, store.getDocument("conflicts")); return true; }
  if (pathname === "/api/v2/preference/status") { json(req, res, 200, store.getDocument("human-preference")); return true; }
  if (pathname === "/api/v2/relation-scores") { json(req, res, 200, store.getDocument("relation-scores")); return true; }
  if (pathname === "/api/v2/profile-data-scores") { json(req, res, 200, store.getDocument("profile-data-scores")); return true; }

  const scoped = pathname.match(/^\/api\/v2\/prophets\/([^/]+)\/(provenance|events|relations|timeline)$/);
  if (scoped) {
    const id = decodeURIComponent(scoped[1] ?? "");
    if (!store.getProphet(id)) { json(req, res, 404, { error: "prophet_not_found" }); return true; }
    const kind = scoped[2];
    if (kind === "provenance") {
      const doc = store.getDocument("provenance");
      json(req, res, 200, scopedDocument(doc, id, "claims", (value) => value.prophet_id === id));
      return true;
    }
    if (kind === "events") {
      const doc = store.getDocument("events");
      json(req, res, 200, scopedDocument(doc, id, "events", (value) => value.prophet_id === id));
      return true;
    }
    if (kind === "relations") {
      const doc = store.getDocument("genealogy");
      json(req, res, 200, scopedDocument(doc, id, "relations", (value) => String(value.from ?? "") === `prophet:${id}` || String(value.to ?? "") === `prophet:${id}`));
      return true;
    }
    const doc = store.getDocument("timeline");
    const eras = typeof doc === "object" && doc !== null && !Array.isArray(doc) && typeof doc.eras === "object" && doc.eras !== null
      ? doc.eras as Record<string, unknown>
      : {};
    json(req, res, 200, { prophet_id: id, era: eras[id] ?? null });
    return true;
  }

  const detail = pathname.match(/^\/api\/v2\/prophets\/([^/]+)$/);
  if (detail) {
    const id = decodeURIComponent(detail[1] ?? "");
    const prophet = store.getProphet(id);
    json(req, res, prophet ? 200 : 404, prophet ?? { error: "prophet_not_found" });
    return true;
  }

  json(req, res, 404, { error: "not_found" });
  return true;
}

function mime(path: string): string {
  if (path.endsWith(".html")) return "text/html; charset=utf-8";
  if (path.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (path.endsWith(".css")) return "text/css; charset=utf-8";
  if (path.endsWith(".json")) return "application/json; charset=utf-8";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function serveStatic(res: ServerResponse, pathname: string, headOnly = false) {
  setCommonHeaders(res);
  if (!existsSync(resolve(webDist, "index.html"))) {
    res.statusCode = 503;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Frontend build is missing. Run npm run web:build first.");
    return;
  }

  let decoded = "/";
  try { decoded = decodeURIComponent(pathname); } catch { decoded = "/"; }
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  let file = resolve(webDist, relative);
  const safePrefix = webDist.endsWith(sep) ? webDist : `${webDist}${sep}`;
  if (file !== webDist && !file.startsWith(safePrefix)) {
    res.statusCode = 400;
    res.end("Bad path");
    return;
  }
  if (!existsSync(file)) {
    if (extname(relative)) { res.statusCode = 404; res.setHeader("content-type", "text/plain; charset=utf-8"); res.end("Not found"); return; }
    file = resolve(webDist, "index.html");
  }
  const body = readFileSync(file);
  res.statusCode = 200;
  res.setHeader("content-type", mime(file));
  res.setHeader("cache-control", file.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable");
  res.end(headOnly ? undefined : body);
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
  if (handleApi(req, res, url.pathname)) return;
  if (req.method !== "GET" && req.method !== "HEAD") return json(req, res, 405, { error: "method_not_allowed" });
  serveStatic(res, url.pathname, req.method === "HEAD");
});

function shutdown() {
  server.close(() => {
    store.db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(port, "127.0.0.1", () => {
  console.log(`Prophet Research local app v2.3.2 listening on http://127.0.0.1:${port}`);
});
