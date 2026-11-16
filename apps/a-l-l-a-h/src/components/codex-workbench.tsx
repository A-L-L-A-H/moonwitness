"use client";

import { useMemo, useState } from "react";
import {
  DHGS_13_STEPS,
  evaluateDhgsAssuranceLoop,
  evaluateSrgblModel,
  evaluateWsiSemanticFrame,
  queryOxDxHierarchy,
  tokenizeAndParseAqel,
  type SrgblCriterionWeight,
} from "@moonwitness/canon";
import { DnaButton, DnaChamber, SacredCornerBrackets } from "@moonwitness/ui/imperium";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";

type WorkbenchTab = "wsi" | "srgbl" | "oxdx" | "aqel";

const DEFAULT_AQEL_SOURCE = `# نظام التحقق المعرفي — عقد الصدق
عرّف المعيار = "الميزان"
حقيقة الشاهد = "2:256"
قاعدة العدل
تحقق "لا إكراه في الدين"
استنتج الأمانة`;

const INITIAL_SRGBL_ROWS: readonly SrgblCriterionWeight[] = [
  { weight: 1.0, confidence: 0.95, intensity: 1.0, direction: 1.5 },
  { weight: 0.85, confidence: 0.9, intensity: 1.0, direction: 1.0 },
  { weight: 0.7, confidence: 0.8, intensity: 0.9, direction: 0.5 },
];

export function CodexWorkbench() {
  const { locale } = useSanctuaryLocale();
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("wsi");

  // 1. WSI Semantic & 7-Swing State (#32)
  const [wsiStatement, setWsiStatement] = useState<string>(
    "All primary witness claims require explicit attribution and zero coercion.",
  );
  const [wsiSourceRef, setWsiSourceRef] = useState<string>("QS 2:256 / SRC-QUR");
  const [wsiAgent, setWsiAgent] = useState<string>("Steward / Witness");
  const [wsiRecipient, setWsiRecipient] = useState<string>("Human Community");
  const [wsiDomain, setWsiDomain] = useState<string>("Moral Governance");
  const [wsiScope, setWsiScope] = useState<string>("Universal Voluntary Covenant");
  const [wsiGenre, setWsiGenre] = useState<string>("Primary Normative Invariant");
  const [wsiDepth, setWsiDepth] = useState<number>(2);

  const wsiResult = useMemo(
    () =>
      evaluateWsiSemanticFrame({
        statement: wsiStatement,
        sourceRef: wsiSourceRef,
        agent: wsiAgent,
        recipient: wsiRecipient,
        domain: wsiDomain,
        scope: wsiScope,
        genre: wsiGenre,
        swingDepth: wsiDepth,
      }),
    [wsiStatement, wsiSourceRef, wsiAgent, wsiRecipient, wsiDomain, wsiScope, wsiGenre, wsiDepth],
  );

  // 2. SRGBL v8 State (#33)
  const [srgblQuestion, setSrgblQuestion] = useState<string>(
    "How should an architectural steward resolve competing witness claims?",
  );
  const [r1Text, setR1Text] = useState<string>(
    "Primary classical corpus tuples\nTimestamped build & edge telemetry",
  );
  const [g2Text, setG2Text] = useState<string>(
    "Zero fabricated data invariant\nExplicit UNKNOWN gate on missing evidence",
  );
  const [b3Text, setB3Text] = useState<string>(
    "Auditors, readers, and local communities\nFull agency without coercion",
  );
  const [l4Text, setL4Text] = useState<string>(
    "Publish reproducible source citations\nAudit privacy on-device before deploy",
  );
  const [srgblRows, setSrgblRows] = useState<readonly SrgblCriterionWeight[]>(INITIAL_SRGBL_ROWS);

  const srgblResult = useMemo(
    () =>
      evaluateSrgblModel({
        question: srgblQuestion,
        observations: r1Text.split("\n"),
        governanceRules: g2Text.split("\n"),
        actorsAndMeanings: b3Text.split("\n"),
        responsibleActions: l4Text.split("\n"),
        weightedCriteria: srgblRows,
      }),
    [srgblQuestion, r1Text, g2Text, b3Text, l4Text, srgblRows],
  );

  // 3. OX-DX 49 & DHGS-13 State (#34)
  const [oxdxQuery, setOxdxQuery] = useState<string>("");
  const [doneDhgsCodes, setDoneDhgsCodes] = useState<readonly string[]>([
    "QUESTION",
    "PRIMARY_SOURCES",
    "TRACEABLE_WITNESS",
  ]);
  const oxdxHits = useMemo(() => queryOxDxHierarchy(oxdxQuery), [oxdxQuery]);
  const dhgsResult = useMemo(() => evaluateDhgsAssuranceLoop(doneDhgsCodes), [doneDhgsCodes]);

  // 4. AQEL v0.1 State (#35)
  const [aqelSource, setAqelSource] = useState<string>(DEFAULT_AQEL_SOURCE);
  const aqelResult = useMemo(() => tokenizeAndParseAqel(aqelSource), [aqelSource]);

  const tabs: readonly { id: WorkbenchTab; code: string; label: string }[] = [
    { id: "wsi", code: "WSI-P18", label: "WSI SEMANTIC & SWING" },
    { id: "srgbl", code: "SRGBL-v8", label: "SRGBL v8 EVALUATOR" },
    { id: "oxdx", code: "OX-DX/DHGS", label: "OX-DX 49 & DHGS-13" },
    { id: "aqel", code: "AQEL-v0.1", label: "AQEL ARABIC LEXER" },
  ];

  const toggleDhgsStep = (code: string) => {
    setDoneDhgsCodes((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  };

  return (
    <DnaChamber cornerBrackets className="mt-8 p-6 sm:p-8 space-y-6">
      <SacredCornerBrackets />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d6b46c]/25 pb-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-[#dfc07b] uppercase">
            @MOONWITNESS/CANON · DETERMINISTIC CLIENT ENGINE WORKBENCH
          </div>
          <h3 className="mt-1 font-monument text-base sm:text-lg tracking-[0.14em] text-[#fff6df] uppercase">
            {locale === "id"
              ? "LABORATORIUM EKSEKUSI WSI · SRGBL v8 · OX-DX 49 · AQEL"
              : "LIVE EXECUTION BENCH: WSI · SRGBL v8 · OX-DX 49 · AQEL"}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase cursor-pointer ${
                  selected
                    ? "border border-[#f5dfa6] bg-[#d6b46c]/20 text-[#fff8e6]"
                    : "btn-luxe-secondary text-[#cfc5b0]"
                }`}
              >
                {tab.code} · {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: WSI SEMANTIC & SWING (#32) */}
      {activeTab === "wsi" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block font-mono text-[10px] text-[#dfc07b]">
              CLAIM STATEMENT
              <textarea
                rows={2}
                value={wsiStatement}
                onChange={(e) => setWsiStatement(e.target.value)}
                className="mt-1 w-full border border-[#d6b46c]/35 bg-[#05070e] p-2.5 font-serif text-xs text-[#fff6df] focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                { label: "SOURCE REF", val: wsiSourceRef, set: setWsiSourceRef },
                { label: "1. AGENT", val: wsiAgent, set: setWsiAgent },
                { label: "2. RECIPIENT", val: wsiRecipient, set: setWsiRecipient },
                { label: "3. DOMAIN", val: wsiDomain, set: setWsiDomain },
                { label: "4. SCOPE", val: wsiScope, set: setWsiScope },
                { label: "5. GENRE", val: wsiGenre, set: setWsiGenre },
              ].map((field) => (
                <label key={field.label} className="block font-mono text-[10px] text-[#cfc5b0]">
                  {field.label}
                  <input
                    type="text"
                    value={field.val}
                    onChange={(e) => field.set(e.target.value)}
                    className="mt-1 w-full border border-[#d6b46c]/30 bg-[#05070e] px-2.5 py-1.5 font-mono text-[11px] text-[#fff6df] focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <label className="block font-mono text-[10px] text-[#dfc07b]">
              BOUNDED SWING DEPTH (MAX 3 HOPS): {wsiDepth}
              <input
                type="range"
                min={0}
                max={3}
                value={wsiDepth}
                onChange={(e) => setWsiDepth(Number(e.target.value))}
                className="mt-1 block w-full accent-[#d6b46c]"
              />
            </label>
          </div>

          <div className="border border-[#d6b46c]/25 bg-[#070b15] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-2.5">
              <span className="font-mono text-[10.5px] text-[#dfc07b]">P18 AUDIT VERDICT</span>
              <span
                className={`border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                  wsiResult.frameStatus === "ONSIDE"
                    ? "border-[#7ee7b8]/50 bg-[#7ee7b8]/10 text-[#9cf4cb]"
                    : "border-[#f5a97f]/60 bg-[#f5a97f]/15 text-[#ffd1b8]"
                }`}
              >
                {wsiResult.frameStatus}
              </span>
            </div>
            <div className="font-mono text-[10.5px] text-[#dfd6c3]">
              MISSING DIMENSIONS:{" "}
              {wsiResult.missingDimensions.length === 0
                ? "NONE (ALL 5 MANDATORY SLOTS POPULATED)"
                : wsiResult.missingDimensions.join(", ")}
            </div>
            <div className="space-y-2">
              {wsiResult.rotations.map((rot) => (
                <div key={rot.hop} className="border border-[#d6b46c]/20 bg-[#0b101d] p-3">
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#f5dfa6]">
                    <span>
                      HOP {rot.hop} · {rot.operator}
                    </span>
                    <span className="text-[#dfc07b]">{rot.status}</span>
                  </div>
                  <p className="mt-1 font-serif text-xs text-[#e6decb]">{rot.prompt}</p>
                </div>
              ))}
            </div>
            <div className="font-mono text-[10px] text-[#cfc5b0]">{wsiResult.invariant}</div>
          </div>
        </div>
      )}

      {/* TAB 2: SRGBL v8 EVALUATOR (#33) */}
      {activeTab === "srgbl" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block font-mono text-[10px] text-[#dfc07b]">
              INQUIRY QUESTION
              <input
                type="text"
                value={srgblQuestion}
                onChange={(e) => setSrgblQuestion(e.target.value)}
                className="mt-1 w-full border border-[#d6b46c]/30 bg-[#05070e] px-3 py-1.5 font-serif text-xs text-[#fff6df] focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                { label: "R1 REALITY (ONE PER LINE)", val: r1Text, set: setR1Text },
                { label: "G2 GOVERNING ORDER", val: g2Text, set: setG2Text },
                { label: "B3 BEING & AGENTS", val: b3Text, set: setB3Text },
                { label: "L4 LIGHT & ACTION", val: l4Text, set: setL4Text },
              ].map((stage) => (
                <label key={stage.label} className="block font-mono text-[10px] text-[#cfc5b0]">
                  {stage.label}
                  <textarea
                    rows={2}
                    value={stage.val}
                    onChange={(e) => stage.set(e.target.value)}
                    className="mt-1 w-full border border-[#d6b46c]/30 bg-[#05070e] p-2 font-serif text-xs text-[#fff6df] focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <DnaButton
                tone="secondary"
                onClick={() =>
                  setSrgblRows([{ weight: 0, confidence: 0, intensity: 0, direction: 1 }])
                }
                className="px-3 py-1 font-mono text-[10px] text-[#ffd1b8]"
              >
                TEST ZERO-DENOMINATOR GUARD (0/0 &rarr; UNKNOWN)
              </DnaButton>
              <DnaButton
                tone="secondary"
                onClick={() => setSrgblRows(INITIAL_SRGBL_ROWS)}
                className="px-3 py-1 font-mono text-[10px] text-[#e6decb]"
              >
                RESET BALANCED WEIGHTS
              </DnaButton>
            </div>
          </div>

          <div className="border border-[#d6b46c]/25 bg-[#070b15] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-2.5">
              <span className="font-mono text-[10.5px] text-[#dfc07b]">
                CUMULATIVE COMPLETENESS: {srgblResult.completeness.filledLevels}/4 (
                {Math.round(srgblResult.completeness.ratio * 100)}%)
              </span>
              <span className="border border-[#d6b46c]/40 bg-[#d6b46c]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#fff8e6]">
                SCORE: {srgblResult.weightedScore}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { key: "R1 REALITY", items: srgblResult.stages.R1_Reality },
                { key: "G2 GOVERNANCE", items: srgblResult.stages.G2_GoverningOrder },
                { key: "B3 BEING", items: srgblResult.stages.B3_Being },
                { key: "L4 LIGHT", items: srgblResult.stages.L4_Light },
              ].map((block) => (
                <div key={block.key} className="border border-[#d6b46c]/20 bg-[#0b101d] p-3">
                  <div className="font-mono text-[10px] text-[#f5dfa6]">{block.key}</div>
                  <ul className="mt-1 space-y-1 font-serif text-xs text-[#e6decb]">
                    {block.items.map((line, idx) => (
                      <li key={idx}>• {line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="font-mono text-[10px] text-[#cfc5b0]">
              {srgblResult.neutralityInvariant}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OX-DX 49 & DHGS-13 (#34) */}
      {activeTab === "oxdx" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block font-mono text-[10px] text-[#dfc07b]">
              QUERY OX-DX 49 ONTOLOGICAL LEVELS ({oxdxHits.length} MATCHED)
              <input
                type="search"
                value={oxdxQuery}
                onChange={(e) => setOxdxQuery(e.target.value)}
                placeholder="Origin, Covenant, Sovereign, Physics, AI..."
                className="mt-1 w-full border border-[#d6b46c]/35 bg-[#05070e] px-3 py-2 font-mono text-xs text-[#fff6df] focus:outline-none"
              />
            </label>
            <div className="max-h-56 overflow-y-auto border border-[#d6b46c]/25 bg-[#070b15] p-3 space-y-1.5">
              {oxdxHits.slice(0, 14).map((hit, idx) => (
                <div
                  key={`${hit.zoneIndex}-${hit.level}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/10 pb-1.5 font-mono text-[10.5px]"
                >
                  <span className="text-[#f5dfa6]">
                    Z0{hit.zoneIndex} · {hit.zoneName}
                  </span>
                  <span className="text-[#e6decb]">{hit.level}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#d6b46c]/25 bg-[#070b15] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-2.5">
              <span className="font-mono text-[10.5px] text-[#dfc07b]">
                DHGS 13-STEP VERIFICATION LOOP ({dhgsResult.completedCount}/{dhgsResult.totalSteps})
              </span>
              <span
                className={`border px-2 py-0.5 font-mono text-[10px] font-bold ${
                  dhgsResult.status === "VERIFIED_LOOP"
                    ? "border-[#7ee7b8]/50 bg-[#7ee7b8]/10 text-[#9cf4cb]"
                    : "border-[#d6b46c]/40 bg-[#d6b46c]/10 text-[#f5dfa6]"
                }`}
              >
                {dhgsResult.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DHGS_13_STEPS.map((step) => {
                const checked = doneDhgsCodes.includes(step.code);
                return (
                  <button
                    key={step.code}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleDhgsStep(step.code)}
                    className={`px-2 py-1 font-mono text-[9.5px] cursor-pointer ${
                      checked
                        ? "border border-[#7ee7b8]/60 bg-[#7ee7b8]/15 text-[#9cf4cb]"
                        : "border border-[#d6b46c]/25 bg-[#0b101d] text-[#cfc5b0]"
                    }`}
                  >
                    {String(step.stepNumber).padStart(2, "0")}·{step.code}
                  </button>
                );
              })}
            </div>
            <div className="font-mono text-[10.5px] text-[#dfd6c3]">
              NEXT REQUIRED STEP: {dhgsResult.nextRequiredStep ?? "COMPLETE · LOOP VERIFIED"}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AQEL v0.1 ARABIC LEXER / AST (#35) */}
      {activeTab === "aqel" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block font-mono text-[10px] text-[#dfc07b]">
              AQEL v0.1 SOURCE BUFFER (DETERMINISTIC ARABIC-FIRST GRAMMAR)
              <textarea
                dir="rtl"
                lang="ar"
                rows={7}
                value={aqelSource}
                onChange={(e) => setAqelSource(e.target.value)}
                className="mt-1 w-full border border-[#d6b46c]/35 bg-[#05070e] p-3 font-serif text-base leading-relaxed text-[#fff8e6] focus:outline-none"
              />
            </label>
          </div>
          <div className="border border-[#d6b46c]/25 bg-[#070b15] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d6b46c]/20 pb-2.5 font-mono text-[10.5px]">
              <span className="text-[#dfc07b]">
                TOKENS: {aqelResult.tokens.length} · AST STATEMENTS: {aqelResult.statements.length}
              </span>
              <span className="text-[#9cf4cb]">
                DIAGNOSTICS: {aqelResult.diagnostics.length} ERRORS
              </span>
            </div>
            <div className="space-y-1.5">
              {aqelResult.statements.map((st, idx) => (
                <div
                  key={`${st.line}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-2 border border-[#d6b46c]/20 bg-[#0b101d] px-3 py-1.5 font-mono text-[11px]"
                >
                  <span className="text-[#f5dfa6]">
                    L{st.line} · KEYWORD [{st.keyword}]
                  </span>
                  <span dir="rtl" lang="ar" className="text-[#fff8e6]">
                    {st.target}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {aqelResult.tokens.slice(0, 18).map((tok, i) => (
                <span
                  key={i}
                  className="border border-[#d6b46c]/20 bg-[#0a0f1d] px-2 py-0.5 font-mono text-[9.5px] text-[#cfc5b0]"
                >
                  {tok.kind}: {tok.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </DnaChamber>
  );
}
