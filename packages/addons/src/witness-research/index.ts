import { createHash, randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  evaluateWsiSemanticFrame,
  queryOxDxHierarchy,
  validateOntologyHierarchyContract,
  validateWitnessDerivationContract,
} from "@moonwitness/canon";
import {
  defaultFailClosedAuthBridge,
  resolveActorContextFromBridge,
  resolveActorTenantFromBridge,
  type AddonDataRecord,
  type AddonDefinition,
  type AddonManifestInput,
  type BaseAddonAuthBridge,
  type IrMenuInput,
  type IrRuleInput,
  type IrViewInput,
} from "@moonwitness/addon-runtime";
import manifestData from "./manifest.json" with { type: "json" };
import {
  knowledgeSourceModel,
  researchRunModel,
  sidraEdgeModel,
  witnessClaimModel,
  wxAsmaulHusnaModel,
  wxEngineRunModel,
  wxFigureModel,
  wxPassageModel,
  wxRootModel,
} from "./models.js";

export const witnessResearchManifest = manifestData as AddonManifestInput;
export * from "./models.js";

export const witnessResearchRules: IrRuleInput[] = [
  { model_name: "knowledge.source", role: "viewer", can_read: true },
  {
    model_name: "knowledge.source",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "knowledge.source",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "witness.claim", role: "viewer", can_read: true },
  {
    model_name: "witness.claim",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "witness.claim",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "research.run", role: "viewer", can_read: true },
  {
    model_name: "research.run",
    role: "editor",
    can_read: true,
    can_create: true,
    can_update: true,
  },
  {
    model_name: "research.run",
    role: "admin",
    can_read: true,
    can_create: true,
    can_update: true,
    can_delete: true,
  },
  { model_name: "sidra.edge", role: "viewer", can_read: true },
  { model_name: "sidra.edge", role: "editor", can_read: true, can_create: true, can_update: true },
  { model_name: "wx.passage", role: "public", can_read: true },
  { model_name: "wx.passage", role: "viewer", can_read: true },
  { model_name: "wx.passage", role: "editor", can_read: true, can_create: true, can_update: true },
  { model_name: "wx.root", role: "public", can_read: true },
  { model_name: "wx.root", role: "viewer", can_read: true },
  { model_name: "wx.root", role: "editor", can_read: true, can_create: true, can_update: true },
  { model_name: "wx.figure", role: "public", can_read: true },
  { model_name: "wx.figure", role: "viewer", can_read: true },
  { model_name: "wx.figure", role: "editor", can_read: true, can_create: true, can_update: true },
  { model_name: "wx.asmaul.husna", role: "public", can_read: true },
  { model_name: "wx.asmaul.husna", role: "viewer", can_read: true },
  { model_name: "wx.engine.run", role: "viewer", can_read: true },
  { model_name: "wx.engine.run", role: "editor", can_read: true, can_create: true },
];

export const WITNESS_ENGINE_MODULES = [
  { code: "revelation-query", version: "1.0.0", label: "Revelation & Passage Query" },
  { code: "cross-scripture", version: "1.0.0", label: "Cross-Scripture Parallels" },
  { code: "figure-analysis", version: "1.0.0", label: "Historical Figure Graph Analysis" },
  { code: "tradition-transmission", version: "1.0.0", label: "Isnad & Transmission Chain" },
  { code: "lexical-analysis", version: "1.0.0", label: "Triliteral Root Lexical Analysis" },
  { code: "concept-evidence", version: "1.0.0", label: "Concept & Evidence Binding" },
  { code: "divine-expression", version: "1.0.0", label: "Divine Names & Expressions" },
  { code: "research-hypothesis", version: "1.0.0", label: "Hypothesis Verification Engine" },
  { code: "ai-research-synthesis", version: "1.0.0", label: "Prophetic Research Synthesis" },
] as const;

export const witnessData: AddonDataRecord[] = [
  {
    id: "asma_01_ar_rahman",
    model: "wx.asmaul.husna",
    key: { number_order: 1 },
    noupdate: true,
    values: {
      number_order: 1,
      arabic: "الرحمن",
      transliteration: "Ar-Rahman",
      meaning_en: "The Exceedingly Compassionate",
      meaning_id: "Maha Pengasih",
      quran_refs_json: '["QS 1:1","QS 55:1"]',
    },
  },
  {
    id: "asma_02_ar_rahim",
    model: "wx.asmaul.husna",
    key: { number_order: 2 },
    noupdate: true,
    values: {
      number_order: 2,
      arabic: "الرحيم",
      transliteration: "Ar-Rahim",
      meaning_en: "The Exceedingly Merciful",
      meaning_id: "Maha Penyayang",
      quran_refs_json: '["QS 1:1","QS 33:43"]',
    },
  },
  {
    id: "asma_03_al_malik",
    model: "wx.asmaul.husna",
    key: { number_order: 3 },
    noupdate: true,
    values: {
      number_order: 3,
      arabic: "الملك",
      transliteration: "Al-Malik",
      meaning_en: "The Sovereign King",
      meaning_id: "Maha Merajai",
      quran_refs_json: '["QS 59:23"]',
    },
  },
  {
    id: "root_ktb",
    model: "wx.root",
    key: { root_key: "k-t-b" },
    noupdate: true,
    values: {
      root_key: "k-t-b",
      arabic_letters: "ك ت ب",
      transliteration: "k-t-b",
      core_meaning: "to write, prescribe, record",
      occurrence_count: 319,
    },
  },
  {
    id: "root_qra",
    model: "wx.root",
    key: { root_key: "q-r-a" },
    noupdate: true,
    values: {
      root_key: "q-r-a",
      arabic_letters: "ق ر أ",
      transliteration: "q-r-a",
      core_meaning: "to recite, proclaim, read",
      occurrence_count: 88,
    },
  },
  {
    id: "root_slm",
    model: "wx.root",
    key: { root_key: "s-l-m" },
    noupdate: true,
    values: {
      root_key: "s-l-m",
      arabic_letters: "س ل م",
      transliteration: "s-l-m",
      core_meaning: "peace, wholeness, submission",
      occurrence_count: 140,
    },
  },
  {
    id: "root_wzn",
    model: "wx.root",
    key: { root_key: "w-z-n" },
    noupdate: true,
    values: {
      root_key: "w-z-n",
      arabic_letters: "و ز ن",
      transliteration: "w-z-n",
      core_meaning: "balance, scale, weigh equitably",
      occurrence_count: 23,
    },
  },
  {
    id: "passage_qs_9_36",
    model: "wx.passage",
    key: { reference: "QS 9:36" },
    noupdate: true,
    values: {
      reference: "QS 9:36",
      scripture_code: "QURAN",
      book_code: "At-Taubah",
      chapter_num: 9,
      verse_num: 36,
      arabic_text: "إن عدة الشهور عند الله اثنا عشر شهرا",
      translation_text: "Indeed, the number of months with Allah is twelve lunar months.",
      root_keys_json: '["k-t-b"]',
    },
  },
  {
    id: "passage_qs_55_7_9",
    model: "wx.passage",
    key: { reference: "QS 55:7-9" },
    noupdate: true,
    values: {
      reference: "QS 55:7-9",
      scripture_code: "QURAN",
      book_code: "Ar-Rahman",
      chapter_num: 55,
      verse_num: 7,
      arabic_text: "والسماء رفعها ووضع الميزان",
      translation_text: "And the heaven He raised and imposed the Balance (al-Mizan).",
      root_keys_json: '["w-z-n"]',
    },
  },
];

async function runDeterministicWitnessEngine(
  moduleCode: string,
  input: Record<string, unknown>,
  tenantId: string,
): Promise<{ module: string; findings: Array<Record<string, unknown>>; summary: string }> {
  const q = typeof input.q === "string" ? input.q.trim() : "";
  if (moduleCode === "lexical-analysis") {
    const roots = await wxRootModel.repository.find({}, { tenantId, ...(q ? { q } : {}), limit: 20 });
    return {
      module: moduleCode,
      findings: roots.map((r) => ({ kind: "root", key: r.root_key, meaning: r.core_meaning })),
      summary: `Analyzed ${roots.length} Semitic root entries.`,
    };
  }
  if (moduleCode === "divine-expression") {
    const names = await wxAsmaulHusnaModel.repository.find({}, { tenantId, ...(q ? { q } : {}), limit: 20 });
    return {
      module: moduleCode,
      findings: names.map((n) => ({ kind: "asma", order: n.number_order, name: n.transliteration })),
      summary: `Resolved ${names.length} Divine Name occurrences.`,
    };
  }
  if (moduleCode === "figure-analysis") {
    const figs = await wxFigureModel.repository.find({}, { tenantId, ...(q ? { q } : {}), limit: 20 });
    return {
      module: moduleCode,
      findings: figs.map((f) => ({ kind: "figure", key: f.figure_key, name: f.canonical_name })),
      summary: `Evaluated ${figs.length} historical figure nodes.`,
    };
  }
  const passages = await wxPassageModel.repository.find({}, { tenantId, ...(q ? { q } : {}), limit: 20 });
  return {
    module: moduleCode,
    findings: passages.map((p) => ({
      kind: "passage",
      reference: p.reference,
      scripture: p.scripture_code,
    })),
    summary: `Executed '${moduleCode}' over ${passages.length} indexed passages.`,
  };
}

export const witnessResearchViews: IrViewInput[] = [
  {
    model_name: "witness.claim",
    view_type: "list",
    spec: {
      title: "Witness Claims",
      description: "Verified empirical claims anchored by source tier and SIDRA edges.",
      domainIcon: "simpul",
      columns: ["claim_key", "statement", "tier", "confidence", "verdict"],
    },
  },
  {
    model_name: "knowledge.source",
    view_type: "list",
    spec: {
      title: "Knowledge Sources",
      description: "Primary & secondary references indexed for witness research.",
      domainIcon: "scripture",
      columns: ["source_key", "title", "tier", "verified"],
    },
  },
];

export const witnessResearchMenus: IrMenuInput[] = [
  {
    menu_key: "witness.claims",
    label: "Witness Claims",
    href: "/models/witness.claim",
    icon: "simpul",
    plane: "creator",
    sort_order: 55,
    min_role: "viewer",
  },
];

export function createWitnessResearchAddon(
  options: { prefix?: string; auth?: BaseAddonAuthBridge } = {},
): AddonDefinition {
  const prefix = (options.prefix ?? "/api/v1").replace(/\/+$/, "");
  const auth = options.auth ?? defaultFailClosedAuthBridge;

  return {
    manifest: witnessResearchManifest,
    models: [
      knowledgeSourceModel,
      witnessClaimModel,
      researchRunModel,
      sidraEdgeModel,
      wxPassageModel,
      wxRootModel,
      wxFigureModel,
      wxAsmaulHusnaModel,
      wxEngineRunModel,
    ],
    rules: witnessResearchRules,
    views: witnessResearchViews,
    menus: witnessResearchMenus,
    data: witnessData,
    registerRoutes: async (scope: FastifyInstance) => {
      scope.get(`${prefix}/witness/summary`, { preHandler: auth.authenticate }, async (request) => {
        const tenantId = resolveActorTenantFromBridge(auth, request);
        const [sources, claims, runs, edges, passages, roots] = await Promise.all([
          knowledgeSourceModel.repository.count({}, { tenantId }),
          witnessClaimModel.repository.count({}, { tenantId }),
          researchRunModel.repository.count({}, { tenantId }),
          sidraEdgeModel.repository.count({}, { tenantId }),
          wxPassageModel.repository.count({}, { tenantId }),
          wxRootModel.repository.count({}, { tenantId }),
        ]);
        return { sources, claims, runs, edges, passages, roots };
      });

      scope.get(
        `${prefix}/witness/engine/modules`,
        { preHandler: auth.authenticate },
        async () => ({ modules: WITNESS_ENGINE_MODULES }),
      );

      const engineRunSchema = z.object({
        moduleCode: z.string().min(1),
        moduleVersion: z.string().default("1.0.0"),
        input: z.record(z.string(), z.unknown()).default({}),
      });

      scope.post<{ Body: unknown }>(
        `${prefix}/witness/engine/run`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const parsed = engineRunSchema.safeParse(request.body);
          if (!parsed.success) {
            return reply
              .code(400)
              .send({ error: parsed.error.issues[0]?.message ?? "Invalid engine run payload" });
          }
          const validMod = WITNESS_ENGINE_MODULES.find((m) => m.code === parsed.data.moduleCode);
          if (!validMod) {
            return reply.code(404).send({ error: `Unknown witness engine '${parsed.data.moduleCode}'` });
          }
          const actor = resolveActorContextFromBridge(auth, request);
          const tenantId = actor.tenantId ?? resolveActorTenantFromBridge(auth, request);
          const output = await runDeterministicWitnessEngine(
            parsed.data.moduleCode,
            parsed.data.input,
            tenantId,
          );
          const inputJson = JSON.stringify(parsed.data.input);
          const outputJson = JSON.stringify(output);
          const digest = createHash("sha256")
            .update(`${parsed.data.moduleCode}:${inputJson}`)
            .digest("hex");
          const saved = await wxEngineRunModel.repository.create(
            {
              run_key: `run-${randomUUID()}`,
              module_code: parsed.data.moduleCode,
              module_version: parsed.data.moduleVersion,
              input_json: inputJson,
              output_json: outputJson,
              findings_count: output.findings.length,
              digest,
              run_status: "completed",
            },
            actor,
          );
          return reply.code(201).send({ run: saved, output });
        },
      );

      scope.post<{ Params: { runKey: string } }>(
        `${prefix}/witness/engine/runs/:runKey/replay`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const tenantId = resolveActorTenantFromBridge(auth, request);
          const existing = (
            await wxEngineRunModel.repository.find(
              { run_key: request.params.runKey },
              { tenantId, limit: 1 },
            )
          )[0];
          if (!existing) return reply.code(404).send({ error: "Engine run not found" });
          const parsedInput = JSON.parse(existing.input_json) as Record<string, unknown>;
          const replayedOutput = await runDeterministicWitnessEngine(
            existing.module_code,
            parsedInput,
            tenantId,
          );
          return {
            run: existing,
            replayedOutput,
            deterministicMatch: JSON.stringify(replayedOutput) === existing.output_json,
          };
        },
      );

      scope.get<{ Querystring: { q?: string } }>(
        `${prefix}/witness/ontology/zones`,
        { preHandler: auth.authenticate },
        async (request) => {
          const levels = queryOxDxHierarchy(request.query.q ?? "");
          const contract = validateOntologyHierarchyContract();
          return { contract, levels };
        },
      );

      const evaluateFrameSchema = z.object({
        statement: z.string().min(1),
        sourceRef: z.string().min(1),
        agent: z.string().optional(),
        recipient: z.string().optional(),
        domain: z.string().optional(),
        scope: z.string().optional(),
        genre: z.string().optional(),
        swingDepth: z.number().int().min(0).max(3).optional(),
      });

      scope.post<{ Body: unknown }>(
        `${prefix}/witness/evaluate-frame`,
        { preHandler: auth.requireRole("admin", "editor") },
        async (request, reply) => {
          const parsed = evaluateFrameSchema.safeParse(request.body);
          if (!parsed.success) {
            return reply
              .code(400)
              .send({ error: parsed.error.issues[0]?.message ?? "Invalid semantic frame input" });
          }
          const frame = evaluateWsiSemanticFrame(parsed.data);
          const contract = validateWitnessDerivationContract({
            mode: "RESEARCH",
            semanticRecordId: parsed.data.sourceRef,
            sourceSemanticRecordId: parsed.data.sourceRef,
            derivationMode: "RESEARCH",
            frames: [
              {
                id: "frame-1",
                reviewStatus: "RESEARCHED",
                conceptIds: frame.frameStatus === "ONSIDE" ? ["c_grounded"] : [],
              },
            ],
            patterns: [{ id: "wsi-p18", triggerConcepts: ["c_grounded"] }],
            derivedTargets: ["c_verified"],
            witnesses: [
              {
                id: "w-candidate-1",
                patternId: "wsi-p18",
                reviewStatus: "CANDIDATE",
                observedFrameIds: ["frame-1"],
                responseStatus: frame.frameStatus === "ONSIDE" ? "RESOLVED" : "UNRESOLVED",
                positiveDirectionStatus: frame.frameStatus === "ONSIDE" ? "RESOLVED" : "UNRESOLVED",
                ...(frame.frameStatus === "ONSIDE"
                  ? { positiveTargetConceptId: "c_verified" }
                  : {}),
              },
            ],
          });
          return { frame, contract };
        },
      );
    },
  };
}

export const witnessResearchAddon = createWitnessResearchAddon();
