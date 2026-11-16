import React from "react";
import { createRoot } from "react-dom/client";
import { createSemanticSnapshot } from "allah-crayon-snapshot";
import { planSituationRepresentation } from "allah-crayon-rir";
import { inspectAllPaths } from "allah-crayon-inspector";
import { SafeRIRView } from "allah-crayon-react/safe";
import "allah-crayon-react/styles.css";

const situation = {
  id: "situation:starter",
  anchor: { id: "resource:starter", type: "resource" },
  entities: [{ id: "resource:starter", type: "resource", state: { name: "Starter Resource", state: "ready" } }],
  relations: [],
  observations: [],
  expectations: [],
  knowledge: [{ id: "knowledge:state", key: "resource:starter.state", value: "ready", epistemic: "claim", certainty: 0.8 }],
  possibilities: [{
    id: "possibility:change",
    verb: "Change state",
    subject: { id: "resource:starter", type: "resource" },
    consequence: {
      effects: [{ id: "effect:state", entity: "resource:starter", property: "state", from: "ready", to: "changed" }],
      reversibility: "reversible",
      risk: 0.2,
      impact: 0.3,
      uncertainty: 0.1,
    },
  }],
  now: "2026-08-25T00:00:00Z",
};

const actor = { id: "human:starter", kind: "human" };
const snapshot = createSemanticSnapshot({ situation, actor, authorityRules: [], temporalRecords: [] });
const rir = planSituationRepresentation({ situation, snapshot });
const inspection = inspectAllPaths({ situation, snapshot, document: rir });

function App() {
  return <main style={{ maxWidth: 1100, margin: "40px auto", padding: 24 }}>
    <h1>CRAYON starter</h1>
    <p>Situation → Snapshot → RIR → safe Web renderer.</p>
    <SafeRIRView document={rir} detail="standard" />
    <details><summary>Inspector</summary><pre>{JSON.stringify(inspection, null, 2)}</pre></details>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
