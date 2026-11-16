import fs from "node:fs";
import path from "node:path";
import { loadDataset } from "../src/lib/load.js";
import { webDataPath } from "../src/lib/paths.js";
import {
  loadConflicts,
  loadCorpusRegistry,
  loadDocumentationRegistry,
  loadGenealogy,
  loadPreferenceDataset,
  loadSourceEditions,
  loadTimeline,
} from "../src/lib/load-v2.js";
import { matchAllProphets } from "../src/engine/semantic.js";
import { auditProfiles } from "../src/engine/profile-audit.js";
import { validateDataset } from "../src/engine/validate.js";
import { validateV2 } from "../src/engine/validate-v2.js";
import { scoreAllProfiles, scoreAllRelations } from "../src/engine/scoring.js";
import { dataConfidenceLeaderboard, traitEvidenceLeaderboard, worldTraitLeaderboard } from "../src/engine/leaderboard.js";
import { contextLeaderboard } from "../src/engine/context-scoring.js";
import { buildProvenanceIndex, claimsForProphet } from "../src/engine/provenance.js";
import { buildEventGraph } from "../src/engine/timeline.js";
import { uncertaintyForProphet } from "../src/engine/uncertainty.js";
import { preferenceReport } from "../src/engine/preference.js";
import { auditScoring } from "../src/engine/scoring-audit.js";

const d = loadDataset();
const c = loadCorpusRegistry();
const g = loadGenealogy();
const t = loadTimeline();
const x = loadConflicts();
const pd = loadPreferenceDataset();
const docs = loadDocumentationRegistry();
const sourceEditions = loadSourceEditions();
const m = matchAllProphets(d);
const a = auditProfiles(d);
const lv = validateDataset(d);
const v = validateV2(d, c, g, t, x, pd);
const scores = scoreAllRelations(d);
const ps = scoreAllProfiles(d);
const ctx = contextLeaderboard(d);
const prov = buildProvenanceIndex(d);
const events = buildEventGraph(d, t);
const pref = preferenceReport(pd);
const scoringAudit = auditScoring(d);
const unc = d.prophet_order
  .map(id => uncertaintyForProphet(d, id, claimsForProphet(prov, id), x))
  .filter(Boolean);
const leaders = {
  trait_evidence: traitEvidenceLeaderboard(d),
  data_confidence: dataConfidenceLeaderboard(d),
  world_trait_salience: worldTraitLeaderboard(d),
  context_evidence: ctx,
  human_preference: pref,
  composite: {
    status: pref.status === "CALIBRATED" ? "READY_FOR_EXPLICIT_COMPOSITE_REQUEST" : "DISABLED_UNTIL_PREFERENCE_CALIBRATION",
    score: null,
  },
};

const root = process.cwd();
const rp = path.join(root, "reports/current");
const wp = path.join(root, "web/public");
fs.mkdirSync(path.dirname(webDataPath), { recursive: true });
fs.mkdirSync(rp, { recursive: true });
fs.mkdirSync(wp, { recursive: true });
fs.writeFileSync(webDataPath, JSON.stringify(d, null, 2), "utf8");

const outs: [string, unknown][] = [
  ["semantic-matches.v2.0.json", m],
  ["profile-audit.v2.0.json", a],
  ["validation.v2.0.json", { legacy: lv, v2: v, ok: lv.ok && v.ok }],
  ["relation-scores.v2.0.json", scores],
  ["profile-data-scores.v2.0.json", ps],
  ["leaderboards.v2.0.json", leaders],
  ["context-scores.v2.0.json", ctx],
  ["provenance-index.v2.0.json", prov],
  ["events.v2.0.json", events],
  ["genealogy.v2.0.json", g],
  ["timeline.v2.0.json", t],
  ["conflicts.v2.0.json", x],
  ["uncertainty.v2.0.json", unc],
  ["human-preference-report.v2.0.json", pref],
  ["corpus-registry.v2.0.json", c],
  ["documentation-registry.v2.3.json", docs],
  ["scoring-audit.v2.3.json", scoringAudit],
  ["source-editions.v2.0.json", sourceEditions],
  ["release.v2.3.json", {
    release_version: d.runtime?.version ?? "2.3.2",
    schema_version: d.schema_version,
    api_major: "v2",
    documentation_status: docs.status,
    open_todo_path: docs.governance?.todo_path ?? "docs/project/TODO.md",
  }],
];

for (const [name, value] of outs) {
  fs.writeFileSync(path.join(wp, name), JSON.stringify(value, null, 2), "utf8");
  fs.writeFileSync(path.join(rp, name), JSON.stringify(value, null, 2), "utf8");
}

const lines = [
  "# Prophet Research Engine — v2.3.2",
  "",
  "> Audit Hardening Release over research schema 2.0.",
  "> Evidence/research indices only; never prophetic-worth rankings.",
  "",
  `Validation: **${lv.ok && v.ok ? "PASS" : "FAIL"}**`,
  `Profiles: **${d.prophet_order.length}**`,
  `Provenance claims: **${prov.claims.length}**`,
  `Event nodes: **${events.length}**`,
  `Genealogy relations: **${g.relations.length}**`,
  `Conflict cases: **${x.cases.length}**`,
  `Documentation: **${docs.status}**`,
  `Registered documents: **${docs.documents.length}**`,
  `Human preference: **${pref.status}**`,
  "",
  "Open work: `docs/project/TODO.md`",
];
fs.writeFileSync(path.join(rp, "FINAL-AUDIT-v2.3.md"), lines.join("\n") + "\n", "utf8");
console.log(webDataPath);
