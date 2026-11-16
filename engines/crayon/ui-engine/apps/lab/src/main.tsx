import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderRIRForAgent } from "allah-crayon-agent";
import { inspectRepresentation } from "allah-crayon-inspector";
import {
  buildEvidenceGraph,
  createTemporalFrames,
  diffRIRSemantics,
  profilePipeline,
  type PipelineProfile,
} from "allah-crayon-lab-tools";
import {
  planSituationRepresentation,
  renderRIRAsText,
} from "allah-crayon-rir";
import { createSemanticSnapshot } from "allah-crayon-snapshot";
import { renderRIRForVoice } from "allah-crayon-voice";
import { SafeRIRView } from "allah-crayon-react/safe";
import "allah-crayon-react/styles.css";
import "./styles.css";
import "./v04.css";
import { scenarios } from "./scenarios.js";
import {
  LAB_DETAIL_LEVELS,
  LAB_INSPECT_VIEWS,
  parseLabPresentationState,
  withLabPresentationState,
  type InspectView,
  type VisualTheme,
} from "./url-state.js";

const THEME_STORAGE_KEY = "crayon-lab-theme";

function storedTheme(): VisualTheme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "dark";
  } catch {
    return "dark";
  }
}

function initialPresentation() {
  return parseLabPresentationState({
    url: typeof window === "undefined" ? "https://crayon.invalid/" : window.location.href,
    scenarioIds: scenarios.map((item) => item.id),
    fallbackTheme: storedTheme(),
  });
}

function App() {
  const [initial] = useState(initialPresentation);
  const [scenarioId, setScenarioId] = useState(initial.scenarioId);
  const [inspect, setInspect] = useState<InspectView>(initial.inspect);
  const [detail, setDetail] = useState(initial.detail);
  const [theme, setTheme] = useState<VisualTheme>(initial.theme);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [compareScenarioId, setCompareScenarioId] = useState(
    scenarios[1]?.id ?? scenarios[0].id,
  );
  const [profile, setProfile] = useState<PipelineProfile | null>(null);
  const [profileRun, setProfileRun] = useState(0);
  const scenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#070a0f" : "#f4f1e9");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme persistence is optional; the semantic representation must still render.
    }
  }, [theme]);

  useEffect(() => {
    const url = withLabPresentationState(window.location.href, {
      scenarioId,
      theme,
      detail,
      inspect,
    });
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [scenarioId, theme, detail, inspect]);

  const snapshot = useMemo(
    () =>
      createSemanticSnapshot({
        situation: scenario.situation,
        actor: scenario.actor,
        authorityRules: scenario.authorityRules,
        temporalRecords: scenario.temporalRecords,
        consequenceContext: scenario.consequenceContext,
      }),
    [scenario],
  );

  const rir = useMemo(
    () => planSituationRepresentation({ situation: scenario.situation, snapshot }),
    [scenario, snapshot],
  );
  const text = useMemo(() => renderRIRAsText(rir), [rir]);
  const agent = useMemo(() => renderRIRForAgent(rir), [rir]);
  const voice = useMemo(() => renderRIRForVoice(rir), [rir]);
  const possibility = snapshot.possibilities[0];
  const path = rir.nodes.find((node) => node.kind === "path");
  const inspection = useMemo(
    () =>
      inspectRepresentation({
        situation: scenario.situation,
        snapshot,
        document: rir,
        nodeId: path?.id,
      }),
    [scenario, snapshot, rir, path?.id],
  );
  const temporalFrames = useMemo(
    () => createTemporalFrames(scenario.temporalRecords ?? []),
    [scenario],
  );
  const evidenceGraph = useMemo(
    () => buildEvidenceGraph(scenario.temporalRecords ?? [], scenario.situation.knowledge),
    [scenario],
  );
  const activeHistoryIndex = Math.min(
    Math.max(historyIndex, 0),
    Math.max(temporalFrames.length - 1, 0),
  );
  const historicalFrame = temporalFrames[activeHistoryIndex];

  const compareScenario = scenarios.find((item) => item.id === compareScenarioId) ?? scenarios[0];
  const compareRir = useMemo(() => {
    const compareSnapshot = createSemanticSnapshot({
      situation: compareScenario.situation,
      actor: compareScenario.actor,
      authorityRules: compareScenario.authorityRules,
      temporalRecords: compareScenario.temporalRecords,
      consequenceContext: compareScenario.consequenceContext,
    });
    return planSituationRepresentation({ situation: compareScenario.situation, snapshot: compareSnapshot });
  }, [compareScenario]);
  const semanticDiff = useMemo(() => diffRIRSemantics(rir, compareRir), [rir, compareRir]);

  useEffect(() => {
    let cancelled = false;
    let measuredSnapshot: ReturnType<typeof createSemanticSnapshot> | undefined;
    let measuredRir: ReturnType<typeof planSituationRepresentation> | undefined;
    void profilePipeline([
      {
        name: "snapshot",
        run: () => {
          measuredSnapshot = createSemanticSnapshot({
            situation: scenario.situation,
            actor: scenario.actor,
            authorityRules: scenario.authorityRules,
            temporalRecords: scenario.temporalRecords,
            consequenceContext: scenario.consequenceContext,
          });
          return measuredSnapshot;
        },
      },
      {
        name: "rir",
        run: () => {
          if (!measuredSnapshot) throw new Error("Profiler snapshot stage did not run.");
          measuredRir = planSituationRepresentation({ situation: scenario.situation, snapshot: measuredSnapshot });
          return measuredRir;
        },
      },
      {
        name: "inspector",
        run: () => {
          if (!measuredSnapshot || !measuredRir) throw new Error("Profiler semantic stages did not run.");
          const measuredPath = measuredRir.nodes.find((node) => node.kind === "path");
          return inspectRepresentation({
            situation: scenario.situation,
            snapshot: measuredSnapshot,
            document: measuredRir,
            nodeId: measuredPath?.id,
          });
        },
      },
    ]).then(({ profile: measuredProfile }) => {
      if (!cancelled) setProfile(measuredProfile);
    });
    return () => {
      cancelled = true;
    };
  }, [scenario, profileRun]);

  useEffect(() => {
    setHistoryIndex(0);
    if (compareScenarioId === scenario.id) {
      setCompareScenarioId(scenarios.find((item) => item.id !== scenario.id)?.id ?? scenario.id);
    }
  }, [scenario.id, compareScenarioId]);

  const anchor = scenario.situation.entities.find(
    (item) => item.id === scenario.situation.anchor.id,
  );
  const semanticPossibility = scenario.situation.possibilities[0];
  const witnessState = snapshot.history.at(-1)?.witness.status ?? "none yet";

  const inspectPayload = inspect === "inspector"
    ? JSON.stringify(inspection, null, 2)
    : inspect === "snapshot"
      ? JSON.stringify(snapshot, null, 2)
      : inspect === "rir"
        ? JSON.stringify(rir, null, 2)
        : inspect === "text"
          ? text
          : inspect === "agent"
            ? JSON.stringify(agent, null, 2)
            : inspect === "voice"
              ? voice.text
              : inspect === "history"
                ? JSON.stringify({
                    viewing: historicalFrame ? "historical-frame" : "no-history",
                    currentTruthRemains: scenario.situation.now,
                    selectedFrameAt: historicalFrame?.at ?? null,
                    factsKnownByThen: historicalFrame?.facts ?? [],
                    evidenceAvailableByThen: historicalFrame?.evidenceIds ?? [],
                    sourcesAvailableByThen: historicalFrame?.sourceIds ?? [],
                    witnessesEstablishedByThen: historicalFrame?.witness ?? [],
                    retryAssessmentsEstablishedByThen: historicalFrame?.retry ?? [],
                    futureKnowledgeIncluded: false,
                  }, null, 2)
                : inspect === "diff"
                  ? JSON.stringify({
                      baselineScenario: scenario.id,
                      comparisonScenario: compareScenario.id,
                      comparisonBasis: "RIR semantic fields; human labels and pixels excluded",
                      changes: semanticDiff,
                    }, null, 2)
                  : inspect === "evidence"
                    ? JSON.stringify(evidenceGraph, null, 2)
                    : JSON.stringify({
                        diagnosticOnly: true,
                        representationMeaningUnaffected: true,
                        profile,
                      }, null, 2);

  return (
    <main className="lab-shell" data-theme={theme}>
      <header className="lab-header">
        <div>
          <p className="eyebrow">CRAYON LAB · UNIVERSAL REPRESENTATION MICROSCOPE</p>
          <h1>Meaning becomes action, witness, and representation without losing truth.</h1>
        </div>
        <div className="lab-header__controls">
          <div className="theme-control" aria-label="CRAYON visual theme">
            <span>VISUAL THEME</span>
            <div role="group" aria-label="Visual theme selection">
              <button type="button" aria-pressed={theme === "dark"} className={theme === "dark" ? "is-active" : ""} onClick={() => setTheme("dark")}>Dark Flagship</button>
              <button type="button" aria-pressed={theme === "light"} className={theme === "light" ? "is-active" : ""} onClick={() => setTheme("light")}>Light Companion</button>
            </div>
          </div>
          <div className="release-stamp">
            <span>production microscope · dual-theme</span>
            <strong>same meaning · inspectable evidence</strong>
          </div>
        </div>
      </header>

      <nav className="scenario-rail" aria-label="Stress-test scenario">
        {scenarios.map((item) => (
          <button type="button" key={item.id} className={item.id === scenario.id ? "is-active" : ""} onClick={() => setScenarioId(item.id)}>
            <strong>{item.label}</strong>
            <span>{item.question}</span>
          </button>
        ))}
      </nav>

      <section className="orientation-strip">
        <div><span>WHAT IS?</span><strong>{String(anchor?.state.name ?? scenario.situation.anchor.id)}</strong></div>
        <div><span>WHAT MATTERS?</span><strong>{scenario.question}</strong></div>
        <div><span>WHAT CAN I DO?</span><strong>{possibility.verb}</strong></div>
        <div><span>WHAT WILL HAPPEN?</span><strong>{semanticPossibility.consequence.effects.length} effect(s) · {semanticPossibility.consequence.reversibility}</strong></div>
        <div><span>WHAT HAPPENED?</span><strong>{witnessState}</strong></div>
      </section>

      <section className="lab-grid">
        <div className="representation-zone">
          <div className="representation-toolbar" aria-label="Semantic detail level">
            <span className="eyebrow">SEMANTIC ZOOM</span>
            <div className="inspect-switch">
              {LAB_DETAIL_LEVELS.map((level) => (
                <button key={level} type="button" className={detail === level ? "is-active" : ""} onClick={() => setDetail(level)}>{level}</button>
              ))}
            </div>
          </div>
          <SafeRIRView document={rir} detail={detail} />
        </div>

        <aside className="inspect-zone">
          <div className="inspect-heading">
            <div><span className="eyebrow">WHY THIS REPRESENTATION?</span><h2>Inspectable semantics</h2></div>
            <div className="inspect-switch" aria-label="Inspector view">
              {LAB_INSPECT_VIEWS.map((item) => (
                <button key={item} type="button" className={inspect === item ? "is-active" : ""} onClick={() => setInspect(item)}>{item}</button>
              ))}
            </div>
          </div>

          {inspect === "history" && (
            <div className="microscope-controls" aria-label="Historical frame selection">
              <label>
                <span>HISTORICAL FRAME · not current truth</span>
                <select value={String(activeHistoryIndex)} onChange={(event) => setHistoryIndex(Number(event.target.value))} disabled={temporalFrames.length === 0}>
                  {temporalFrames.length === 0
                    ? <option value="0">no temporal history</option>
                    : temporalFrames.map((frame, index) => <option key={frame.at} value={String(index)}>{frame.at}</option>)}
                </select>
              </label>
              <small>Current situation time remains {scenario.situation.now}. Selecting history never mutates source data or exposes later evidence.</small>
            </div>
          )}

          {inspect === "diff" && (
            <div className="microscope-controls" aria-label="Semantic comparison selection">
              <label>
                <span>COMPARE MEANING AGAINST</span>
                <select value={compareScenario.id} onChange={(event) => setCompareScenarioId(event.target.value)}>
                  {scenarios.filter((item) => item.id !== scenario.id).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <small>{semanticDiff.length} semantic change(s); labels/pixels are not the comparison source.</small>
            </div>
          )}

          {inspect === "evidence" && (
            <div className="microscope-controls">
              <strong>EVIDENCE / PROVENANCE GRAPH</strong>
              <small>{evidenceGraph.nodes.length} semantic nodes · {evidenceGraph.edges.length} provenance edges. Conflicted/unknown knowledge and critical evidence remain visible.</small>
            </div>
          )}

          {inspect === "profile" && (
            <div className="microscope-controls">
              <strong>DIAGNOSTIC PIPELINE PROFILE</strong>
              <small>Timing is diagnostic metadata only and never changes representation decisions.</small>
              <button type="button" onClick={() => setProfileRun((value) => value + 1)}>Run profile again</button>
            </div>
          )}

          <div className="physics-readout">
            <div><span>RESISTANCE</span><strong>{possibility.resistance.score.toFixed(2)}</strong><em>{possibility.resistance.mode}</em></div>
            <div><span>DISCLOSURE</span><strong>{path?.physics?.disclosure?.score.toFixed(2) ?? "—"}</strong><em>meaning required</em></div>
            <div><span>GRAVITY</span><strong>{path?.physics?.gravity?.score.toFixed(2) ?? "—"}</strong><em>significance</em></div>
            <div><span>TRACE</span><strong>{path?.physics?.trace?.score.toFixed(2) ?? "—"}</strong><em>witness demand</em></div>
            <div><span>HISTORY</span><strong>{snapshot.history.length}</strong><em>immutable record(s)</em></div>
          </div>

          <div className="reason-stack">
            {inspection.representation.reasons.slice(-7).map((reason) => <p key={reason}>{reason}</p>)}
          </div>

          <pre className="inspect-data">{inspectPayload}</pre>
        </aside>
      </section>

      <footer className="lab-footer">
        <span>Prediction is not observed truth.</span>
        <span>Historical inspection never mutates current truth.</span>
        <span>Authority and availability are derived.</span>
        <span>Witness history is immutable.</span>
        <span>Theme and diagnostics never change semantic meaning.</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>,
);
