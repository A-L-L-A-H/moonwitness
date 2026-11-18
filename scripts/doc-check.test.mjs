import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runDocChecks } from "./doc-check.mjs";

function writeFile(root, rel, content) {
  const full = path.join(root, rel);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content, typeof content === "string" ? "utf8" : undefined);
}

function createMinimalValidRepo() {
  const root = mkdtempSync(path.join(os.tmpdir(), "mw-doc-check-"));
  writeFile(
    root,
    "README.md",
    "# Root\n\n- [Contract](docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)\n",
  );
  writeFile(
    root,
    "AGENTS.md",
    "# Agents\n\n- [Contract](docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)\n- [Foundation](docs/architecture/engineering-foundation.md)\n",
  );
  writeFile(root, "CONTRIBUTING.md", "# Contributing\n");
  writeFile(root, "CHANGELOG.md", "# Changelog\n");
  writeFile(root, "WORK_PLAN.md", "# Plan\n");
  writeFile(
    root,
    "docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md",
    `---
contract_id: "MW-GOV-DOC-001"
title: "Governance Contract"
status: "ACCEPTED"
owner: "Architecture"
last_reviewed: "2026-11-18"
version: "1.0.0"
---

# Governance Contract

- [Index Strategy](./DOCUMENTATION-INDEXING-STRATEGY.md)
`,
  );
  writeFile(
    root,
    "docs/governance/DOCUMENTATION-INDEXING-STRATEGY.md",
    `---
contract_id: "MW-GOV-ARC-003"
title: "Indexing Strategy"
status: "ACCEPTED"
owner: "Architecture"
last_reviewed: "2026-11-18"
version: "1.0.0"
---

# Indexing Strategy

See [Governance](./DOCUMENTATION_GOVERNANCE_CONTRACT.md).
`,
  );
  writeFile(
    root,
    "docs/architecture/engineering-foundation.md",
    `# Engineering Foundation

- [ADR-001](./adr-001-sample.md)
`,
  );
  writeFile(
    root,
    "docs/architecture/adr-001-sample.md",
    `# ADR-001: Sample

**Status:** Accepted
`,
  );
  return root;
}

test("1. valid repoFixture passes all DOC-VAL checks", () => {
  const root = createMinimalValidRepo();
  try {
    const res = runDocChecks(root);
    assert.equal(res.ok, true, JSON.stringify(res.errors));
    assert.equal(res.errors.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("2. broken internal link fails DOC-VAL-001", () => {
  const root = createMinimalValidRepo();
  try {
    writeFile(
      root,
      "docs/architecture/adr-001-sample.md",
      "# ADR-001: Sample\n\nSee [Missing](./does-not-exist.md).\n",
    );
    const res = runDocChecks(root);
    assert.equal(res.ok, false);
    assert.ok(
      res.errors.some((e) => e.rule === "DOC-VAL-001" && e.file.endsWith("adr-001-sample.md")),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("3. missing index entry fails DOC-VAL-002", () => {
  const root = createMinimalValidRepo();
  try {
    writeFile(root, "apps/web/package.json", JSON.stringify({ name: "@moonwitness/web" }));
    const res = runDocChecks(root);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule === "DOC-VAL-002" && e.file === "apps/web"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("4. UTF-16 BOM / NUL byte encoding fails DOC-VAL-003", () => {
  const root = createMinimalValidRepo();
  try {
    const utf16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("# Plan\n", "utf16le")]);
    writeFile(root, "WORK_PLAN.md", utf16);
    const res = runDocChecks(root);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule === "DOC-VAL-003" && e.file === "WORK_PLAN.md"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("5. duplicate contract_id fails DOC-VAL-004", () => {
  const root = createMinimalValidRepo();
  try {
    writeFile(
      root,
      "docs/governance/DOCUMENTATION-INDEXING-STRATEGY.md",
      `---
contract_id: "MW-GOV-DOC-001"
title: "Duplicate"
status: "ACCEPTED"
owner: "Architecture"
last_reviewed: "2026-11-18"
version: "1.0.0"
---

# Duplicate
`,
    );
    const res = runDocChecks(root);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule === "DOC-VAL-004"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("6. invalid status fails DOC-VAL-006", () => {
  const root = createMinimalValidRepo();
  try {
    writeFile(
      root,
      "docs/governance/DOCUMENTATION-INDEXING-STRATEGY.md",
      `---
contract_id: "MW-GOV-ARC-003"
title: "Indexing Strategy"
status: "APPROVED_BY_VIBES"
owner: "Architecture"
last_reviewed: "2026-11-18"
version: "1.0.0"
---

# Indexing Strategy
`,
    );
    const res = runDocChecks(root);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.rule === "DOC-VAL-006"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("7. orphan document with zero inbound links fails DOC-VAL-007", () => {
  const root = createMinimalValidRepo();
  try {
    writeFile(root, "research/unlinked-note.md", "# Unlinked Note\n\nNo hub links here.\n");
    const res = runDocChecks(root);
    assert.equal(res.ok, false);
    assert.ok(
      res.errors.some((e) => e.rule === "DOC-VAL-007" && e.file === "research/unlinked-note.md"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("8. valid historical document with retired paths passes cleanly", () => {
  const root = createMinimalValidRepo();
  try {
    writeFile(
      root,
      "docs/architecture/engineering-foundation.md",
      `# Engineering Foundation

- [ADR-001](./adr-001-sample.md)
- [Historical Audit](./historical-audit.md)
`,
    );
    writeFile(
      root,
      "docs/architecture/historical-audit.md",
      `# Historical Audit

> **Historical Baseline (\`EVIDENCE:HISTORICAL\`):** Pre-consolidation snapshot of \`apps/a-l-l-a-h\` and \`apps/mid\`.
`,
    );
    const res = runDocChecks(root);
    assert.equal(res.ok, true, JSON.stringify(res.errors));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("9. legitimate external URLs in markdown and code blocks pass DOC-VAL-001", () => {
  const root = createMinimalValidRepo();
  try {
    writeFile(
      root,
      "README.md",
      `# Root

- [Contract](docs/governance/DOCUMENTATION_GOVERNANCE_CONTRACT.md)
- [External](https://moonwitness.biz.id/docs)
- Inline code example: \`[fake](broken/inside/code.md)\`

\`\`\`md
[also-ignored](nonexistent/inside/fence.md)
\`\`\`
`,
    );
    const res = runDocChecks(root);
    assert.equal(res.ok, true, JSON.stringify(res.errors));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
