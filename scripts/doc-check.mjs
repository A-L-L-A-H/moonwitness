#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ALLOWED_ROOT_MARKDOWN = new Set([
  "README.md",
  "AGENTS.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "WORK_PLAN.md",
]);

export const VALID_STATUSES = new Set([
  "DRAFT",
  "PROPOSED",
  "ACCEPTED",
  "PARTIALLY_IMPLEMENTED",
  "IMPLEMENTED",
  "SUPERSEDED",
  "ARCHIVED",
  "REJECTED",
]);

export const QUARANTINED_STRINGS = [
  "c0a8f1e72b4d912a",
  "bjo163/GOD-PROMISE",
  "The-Batteries/100CENTER",
  "The-Batteries/THE-BATTERIES",
  "The-Batteries/WORLD-MONITOR",
  "The-Batteries/ASMAUL-HUSNA",
  "BRIDGE-ALLAH/CORE-PHILOSOPHY",
  "BRIDGE-ALLAH/SYSTEM-ARCHITECTURE",
  "BRIDGE-ALLAH/DESIGN-SYSTEM",
  "BRIDGE-ALLAH/AI-ENGINE",
  "BRIDGE-ALLAH/SDK",
  "bjo163/allah-hub",
];

const RETIRED_WORKSPACE_PATHS = new Set([
  "apps/a-l-l-a-h",
  "apps/mid",
  "apps/igate",
  "apps/cli",
  "apps/memory",
]);

const HISTORICAL_LINE_MARKERS =
  /\b(historical|superseded|legacy|absorbed|retired|archived|replaced|before consolidation|prior to|was consolidated|consolidated into|formerly|moved to|relocated)\b/i;

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

function listFilesRecursive(dir, ext = ".md") {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".turbo") {
        continue;
      }
      results.push(...listFilesRecursive(full, ext));
    } else if (!ext || entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

function parseFrontmatter(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  if (!match) return { data: null, body: content, bodyStartLine: 1 };
  const raw = match[1];
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    data[key] = val;
  }
  const fmLines = match[0].split(/\r?\n/).length - 1;
  return { data, body: content.slice(match[0].length), bodyStartLine: fmLines + 1 };
}

function stripCodeBlocksAndInline(text) {
  const lines = text.split(/\r?\n/);
  const cleaned = [];
  let inFence = false;
  let fenceMarker = "";
  for (const line of lines) {
    const trimmed = line.trim();
    const fenceMatch = /^(```+|~~~+)/.exec(trimmed);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
        cleaned.push("");
        continue;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = "";
        cleaned.push("");
        continue;
      }
    }
    if (inFence) {
      cleaned.push("");
    } else {
      cleaned.push(line.replace(/`[^`\n]*`/g, "`code`"));
    }
  }
  return cleaned.join("\n");
}

function extractH1Headings(body) {
  const lines = stripCodeBlocksAndInline(body).split(/\r?\n/);
  const h1s = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (/^#\s+\S/.test(lines[i])) {
      h1s.push({ line: i + 1, text: lines[i].trim() });
    }
  }
  return h1s;
}

function extractMarkdownLinks(text) {
  const stripped = stripCodeBlocksAndInline(text);
  const links = [];
  const lines = stripped.split(/\r?\n/);
  const linkRe = /!?\[[^\]]*\]\(([^)]+)\)/g;
  for (let i = 0; i < lines.length; i += 1) {
    let m;
    linkRe.lastIndex = 0;
    while ((m = linkRe.exec(lines[i])) !== null) {
      let rawTarget = m[1].trim();
      if (rawTarget.startsWith("<") && rawTarget.includes(">")) {
        rawTarget = rawTarget.slice(1, rawTarget.indexOf(">"));
      } else {
        rawTarget = rawTarget.split(/\s+/)[0];
      }
      links.push({ line: i + 1, target: rawTarget });
    }
  }
  return links;
}

function isHistoricalDoc(relPosix, content) {
  if (
    relPosix.startsWith("docs/blueprint/") ||
    relPosix.startsWith("docs/legacy-harvest/") ||
    relPosix.startsWith("docs/constitution/") ||
    relPosix.startsWith("engines/") ||
    relPosix.startsWith("content/")
  ) {
    return true;
  }
  const head = content.split(/\r?\n/).slice(0, 20).join("\n");
  return /\b(Historical Baseline|Historical Audit|Historical Point-in-Time|Historical Implementation Plan|Historical Design Spec|Frozen \/ Superseded|EVIDENCE:HISTORICAL|Absorbed Engine)\b/i.test(
    head,
  );
}

function collectActiveDocPaths(rootDir) {
  const active = new Set();
  for (const name of ALLOWED_ROOT_MARKDOWN) {
    const p = path.join(rootDir, name);
    if (existsSync(p)) active.add(name);
  }
  const activeDirs = [
    "docs/governance",
    "docs/architecture",
    "docs/engineering",
    "docs/dna",
    "docs/ui",
  ];
  for (const relDir of activeDirs) {
    for (const full of listFilesRecursive(path.join(rootDir, relDir), ".md")) {
      active.add(toPosix(path.relative(rootDir, full)));
    }
  }
  for (const top of ["apps", "services", "cp", "packages"]) {
    const topDir = path.join(rootDir, top);
    if (!existsSync(topDir)) continue;
    const topReadme = path.join(topDir, "README.md");
    if (existsSync(topReadme)) {
      active.add(`${top}/README.md`);
    }
    for (const entry of readdirSync(topDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const readme = path.join(topDir, entry.name, "README.md");
      if (existsSync(readme)) {
        active.add(`${top}/${entry.name}/README.md`);
      }
      if (top === "packages" && entry.name === "addons") {
        const addonsDir = path.join(topDir, "addons");
        for (const sub of readdirSync(addonsDir, { withFileTypes: true })) {
          if (!sub.isDirectory()) continue;
          const subReadme = path.join(addonsDir, sub.name, "README.md");
          if (existsSync(subReadme)) {
            active.add(`packages/addons/${sub.name}/README.md`);
          }
        }
      }
    }
  }
  return Array.from(active).sort();
}

export function runDocChecks(rootDir, options = {}) {
  const root = path.resolve(rootDir);
  const errors = [];
  const warnings = [];
  const inboundLinks = new Map();

  function fail(rule, file, message) {
    errors.push({ rule, file, message });
  }
  function warn(rule, file, message) {
    warnings.push({ rule, file, message });
  }
  function addInbound(targetRel, fromRel) {
    if (!inboundLinks.has(targetRel)) inboundLinks.set(targetRel, new Set());
    inboundLinks.get(targetRel).add(fromRel);
  }

  // DOC-VAL-010a: Root markdown allowlist
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md") && !ALLOWED_ROOT_MARKDOWN.has(entry.name)) {
      fail(
        "DOC-VAL-010",
        entry.name,
        `Unapproved root markdown file '${entry.name}'. Move under docs/ or allowlist in GOVERNANCE contract.`,
      );
    }
  }

  // Collect all active docs + hub/index docs for inbound link graph
  const activeDocs = collectActiveDocPaths(root);
  const graphSources = new Set(activeDocs);
  for (const extraDir of ["docs/superpowers", "research"]) {
    for (const full of listFilesRecursive(path.join(root, extraDir), ".md")) {
      graphSources.add(toPosix(path.relative(root, full)));
    }
  }
  for (const extraRel of [
    "docs/orm-domain-backlog.md",
    "docs/CONSOLIDATION-CATALOG.md",
    "docs/MASTER-CANON-CROSS-REPO-CODEX.md",
    "docs/ECOSYSTEM-ROADMAP.md",
    "docs/constitution/GOVERNANCE/DOCUMENT-INDEX.md",
    "docs/blueprint/DOCUMENT-CATALOG.md",
    "docs/blueprint/README.md",
    "docs/legacy-harvest/ARCHIVE-MANIFEST.md",
    "docs/design/moonwitness-design-system/README.md",
    "engines/chronicle-os/moonwitness-os/README.md",
  ]) {
    if (existsSync(path.join(root, extraRel))) {
      graphSources.add(extraRel);
    }
  }

  const parsedCache = new Map();
  const contractIds = new Map();
  const adrNumbers = new Map();

  for (const rel of Array.from(graphSources).sort()) {
    const abs = path.join(root, rel);
    const buf = readFileSync(abs);

    // DOC-VAL-003a: Encoding checks (NUL bytes, UTF-16 BOM, U+FFFD replacement char)
    const hasUtf16Le = buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe;
    const hasUtf16Be = buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff;
    const hasNul = buf.includes(0);
    if (hasUtf16Le || hasUtf16Be || hasNul) {
      fail(
        "DOC-VAL-003",
        rel,
        "Invalid text encoding detected (UTF-16 BOM or NUL \\x00 byte); convert to UTF-8.",
      );
      continue;
    }

    const content = buf.toString("utf8");
    if (
      (rel === "WORK_PLAN.md" || rel.startsWith("docs/governance/")) &&
      content.includes("\uFFFD")
    ) {
      fail("DOC-VAL-003", rel, "Unicode replacement character U+FFFD detected in UTF-8 text.");
    }

    const parsed = parseFrontmatter(content);
    parsedCache.set(rel, { content, ...parsed });

    // DOC-VAL-001: Internal link resolution on active docs
    if (activeDocs.includes(rel)) {
      const links = extractMarkdownLinks(content);
      for (const link of links) {
        const target = link.target;
        if (
          !target ||
          target.startsWith("#") ||
          target.startsWith("http://") ||
          target.startsWith("https://") ||
          target.startsWith("mailto:") ||
          target.startsWith("tel:") ||
          target.startsWith("vscode:")
        ) {
          continue;
        }
        const cleanTarget = target.split("#")[0].split("?")[0];
        if (!cleanTarget) continue;
        let decodedTarget = cleanTarget;
        try {
          decodedTarget = decodeURIComponent(cleanTarget);
        } catch {
          // Keep literal target if malformed %-sequence so existsSync reports exact path
        }
        const resolved = path.resolve(path.dirname(abs), decodedTarget);
        const relTarget = toPosix(path.relative(root, resolved));
        if (relTarget.startsWith("..")) {
          fail(
            "DOC-VAL-001",
            rel,
            `Line ${link.line}: link escapes repository root -> '${target}'`,
          );
          continue;
        }
        if (!existsSync(resolved)) {
          fail("DOC-VAL-001", rel, `Line ${link.line}: broken internal link '${target}'`);
          continue;
        }
        const st = statSync(resolved);
        addInbound(relTarget, rel);
        if (st.isDirectory()) {
          const idxReadme = path.posix.join(relTarget, "README.md");
          if (existsSync(path.join(root, idxReadme))) {
            addInbound(idxReadme, rel);
          }
        }
      }
    }

    // Also populate inbound edges from non-active hub docs for DOC-VAL-007
    if (!activeDocs.includes(rel)) {
      for (const link of extractMarkdownLinks(content)) {
        const target = link.target;
        if (!target || target.startsWith("#") || /^[a-z]+:/i.test(target)) continue;
        const clean = target.split("#")[0].split("?")[0];
        if (!clean) continue;
        const resolved = path.resolve(path.dirname(abs), clean);
        const relTarget = toPosix(path.relative(root, resolved));
        if (!relTarget.startsWith("..") && existsSync(resolved)) {
          addInbound(relTarget, rel);
        }
      }
    }

    // DOC-VAL-003b / 004 / 005 / 006: Frontmatter, H1, contract_id, owner, status
    const isGovernance = rel.startsWith("docs/governance/");
    const isArchOrEng = rel.startsWith("docs/architecture/") || rel.startsWith("docs/engineering/");
    if (isGovernance || (parsed.data && isArchOrEng)) {
      if (isGovernance && !parsed.data) {
        fail("DOC-VAL-003", rel, "Missing YAML frontmatter block in docs/governance/ document.");
      } else if (parsed.data) {
        for (const key of ["title", "status", "owner", "last_reviewed"]) {
          if (!parsed.data[key] || parsed.data[key].trim() === "") {
            const rule = key === "owner" ? "DOC-VAL-005" : "DOC-VAL-003";
            fail(rule, rel, `Missing or empty required frontmatter field '${key}'.`);
          }
        }
        if (parsed.data.contract_id && !parsed.data.version) {
          fail("DOC-VAL-003", rel, "Contract document with 'contract_id' must declare 'version'.");
        }
        if (parsed.data.status) {
          if (!VALID_STATUSES.has(parsed.data.status)) {
            fail(
              "DOC-VAL-006",
              rel,
              `Invalid status '${parsed.data.status}'. Allowed: ${Array.from(VALID_STATUSES).join(", ")}.`,
            );
          }
          if (
            ["ACCEPTED", "IMPLEMENTED", "PARTIALLY_IMPLEMENTED"].includes(parsed.data.status) &&
            parsed.data.owner &&
            /^tbd$/i.test(parsed.data.owner.trim())
          ) {
            fail(
              "DOC-VAL-005",
              rel,
              `Owner cannot be 'TBD' on document with status '${parsed.data.status}'.`,
            );
          }
        }
        if (parsed.data.contract_id) {
          const cid = parsed.data.contract_id;
          if (contractIds.has(cid)) {
            fail(
              "DOC-VAL-004",
              rel,
              `Duplicate contract_id '${cid}' (already declared in ${contractIds.get(cid)}).`,
            );
          } else {
            contractIds.set(cid, rel);
          }
        }
      }
    }

    if (isGovernance || (rel.startsWith("docs/architecture/adr-") && activeDocs.includes(rel))) {
      const h1s = extractH1Headings(parsed.body);
      if (h1s.length !== 1) {
        fail("DOC-VAL-003", rel, `Expected exactly 1 '# ' H1 heading, found ${h1s.length}.`);
      }
    }

    // DOC-VAL-009: Unique sequential ADR filenames in docs/architecture/
    const adrMatch = /^docs\/architecture\/adr-(\d{3})-[a-z0-9-]+\.md$/.exec(rel);
    if (adrMatch) {
      const num = adrMatch[1];
      if (adrNumbers.has(num)) {
        fail(
          "DOC-VAL-009",
          rel,
          `Duplicate architecture ADR number 'adr-${num}' (conflicts with ${adrNumbers.get(num)}).`,
        );
      } else {
        adrNumbers.set(num, rel);
      }
    }

    // DOC-VAL-008: Stale workspace path references in active docs/architecture & docs/engineering
    if (
      isArchOrEng &&
      !isHistoricalDoc(rel, content) &&
      rel !== "docs/architecture/engineering-foundation.md"
    ) {
      const bodyLines = stripCodeBlocksAndInline(content).split(/\r?\n/);
      // Check raw lines outside fenced blocks for backticked retired workspace refs
      const rawLines = content.split(/\r?\n/);
      let inFence = false;
      for (let idx = 0; idx < rawLines.length; idx += 1) {
        const l = rawLines[idx];
        if (/^\s*(```|~~~)/.test(l)) {
          inFence = !inFence;
          continue;
        }
        if (inFence) continue;
        if (l.trimStart().startsWith(">") || HISTORICAL_LINE_MARKERS.test(l)) continue;
        const backticked = l.match(/`((?:apps|services|cp|packages)\/[a-z0-9_-]+)`/g) || [];
        for (const token of backticked) {
          const refPath = token.slice(1, -1);
          if (RETIRED_WORKSPACE_PATHS.has(refPath) || !existsSync(path.join(root, refPath))) {
            fail(
              "DOC-VAL-008",
              rel,
              `Line ${idx + 1}: references retired/nonexistent workspace path '${refPath}' outside an explicit Historical/Superseded note.`,
            );
          }
        }
      }
      void bodyLines;
    }

    // DOC-VAL-010b: Quarantined hallucinated repo/SHA strings in active docs
    if (
      activeDocs.includes(rel) &&
      rel !== "docs/governance/DOCUMENTATION_QUALITY_STANDARD.md" &&
      rel !== "docs/governance/DOCUMENTATION-AUDIT-REPORT.md" &&
      rel !== "docs/governance/DOCUMENTATION-VALIDATION-STRATEGY.md"
    ) {
      for (const bad of QUARANTINED_STRINGS) {
        if (content.includes(bad)) {
          fail(
            "DOC-VAL-010",
            rel,
            `Quarantined hallucinated repo or placeholder SHA token '${bad}' found in active documentation.`,
          );
        }
      }
    }
  }

  // DOC-VAL-002: Missing index entries in Level 1 hubs & missing Level 2 workspace READMEs
  const govHubLinks = new Set();
  for (const hub of [
    "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md",
    "docs/governance/DOCUMENTATION-INDEXING-STRATEGY.md",
  ]) {
    if (parsedCache.has(hub)) {
      for (const link of extractMarkdownLinks(parsedCache.get(hub).content)) {
        const clean = link.target.split("#")[0];
        if (!clean || /^[a-z]+:/i.test(clean)) continue;
        govHubLinks.add(
          toPosix(path.relative(root, path.resolve(path.dirname(path.join(root, hub)), clean))),
        );
      }
    }
  }
  const archHub = "docs/architecture/engineering-foundation.md";
  const archHubLinks = new Set();
  if (parsedCache.has(archHub)) {
    for (const link of extractMarkdownLinks(parsedCache.get(archHub).content)) {
      const clean = link.target.split("#")[0];
      if (!clean || /^[a-z]+:/i.test(clean)) continue;
      archHubLinks.add(
        toPosix(path.relative(root, path.resolve(path.dirname(path.join(root, archHub)), clean))),
      );
    }
  }

  for (const rel of activeDocs) {
    if (rel.startsWith("docs/governance/") && rel.endsWith(".md")) {
      if (rel !== "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md" && !govHubLinks.has(rel)) {
        fail(
          "DOC-VAL-002",
          rel,
          `Missing index entry in docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md or DOCUMENTATION-INDEXING-STRATEGY.md.`,
        );
      }
    }
    if (
      (rel.startsWith("docs/architecture/") || rel.startsWith("docs/engineering/")) &&
      rel.endsWith(".md") &&
      rel !== archHub
    ) {
      if (!archHubLinks.has(rel)) {
        fail("DOC-VAL-002", rel, `Missing index entry in '${archHub}'.`);
      }
    }
  }

  // Verify every active workspace directory (apps/*, services/*, cp/*, packages/* with package.json) has README.md
  for (const top of ["apps", "services", "cp"]) {
    const dir = path.join(root, top);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const readme = `${top}/${entry.name}/README.md`;
      if (!existsSync(path.join(root, readme))) {
        fail(
          "DOC-VAL-002",
          `${top}/${entry.name}`,
          `Missing required workspace README.md at '${readme}'.`,
        );
      }
    }
  }
  const pkgsDir = path.join(root, "packages");
  if (existsSync(pkgsDir)) {
    for (const entry of readdirSync(pkgsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pj = path.join(pkgsDir, entry.name, "package.json");
      const readme = `packages/${entry.name}/README.md`;
      if (existsSync(pj) && !existsSync(path.join(root, readme))) {
        fail(
          "DOC-VAL-002",
          `packages/${entry.name}`,
          `Missing required package README.md at '${readme}'.`,
        );
      }
    }
  }

  // DOC-VAL-007: Orphan check across docs/{governance,architecture,engineering,dna,ui} and docs/orm-domain-backlog.md & research/*.md
  const hubEntryPoints = new Set([
    "README.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "WORK_PLAN.md",
  ]);
  const orphanCheckDirs = [
    "docs/governance",
    "docs/architecture",
    "docs/engineering",
    "docs/dna",
    "docs/ui",
    "research",
  ];
  for (const dirRel of orphanCheckDirs) {
    for (const full of listFilesRecursive(path.join(root, dirRel), ".md")) {
      const rel = toPosix(path.relative(root, full));
      if (hubEntryPoints.has(rel)) continue;
      const inbound = inboundLinks.get(rel);
      const nonSelfInbound = inbound ? Array.from(inbound).filter((src) => src !== rel) : [];
      if (nonSelfInbound.length === 0) {
        if (options.strictOrphans !== false) {
          fail(
            "DOC-VAL-007",
            rel,
            `Orphan document: zero inbound links from any Level 0/1/2 index.`,
          );
        } else {
          warn("DOC-VAL-007", rel, `Orphan document: zero inbound links.`);
        }
      }
    }
  }
  if (existsSync(path.join(root, "docs/orm-domain-backlog.md"))) {
    const inbound = inboundLinks.get("docs/orm-domain-backlog.md");
    if (!inbound || inbound.size === 0) {
      fail("DOC-VAL-007", "docs/orm-domain-backlog.md", `Orphan document: zero inbound links.`);
    }
  }

  return {
    ok: errors.length === 0,
    checkedFiles: graphSources.size,
    activeDocsCount: activeDocs.length,
    errors,
    warnings,
  };
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const rootDir = process.cwd();
  const result = runDocChecks(rootDir);

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  console.log(
    `[doc-check] checked=${result.checkedFiles} active=${result.activeDocsCount} errors=${result.errors.length} warnings=${result.warnings.length}`,
  );
  for (const w of result.warnings) {
    console.warn(`WARN  ${w.rule} ${w.file}: ${w.message}`);
  }
  for (const e of result.errors) {
    console.error(`FAIL  ${e.rule} ${e.file}: ${e.message}`);
  }
  if (!result.ok) {
    process.exit(1);
  }
  console.log("PASS  docs:check — all documentation governance checks passed.");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
