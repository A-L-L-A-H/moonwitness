import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderRIRForAgent } from "allah-crayon-agent";
import { renderRIRForVoice } from "allah-crayon-voice";
import { SafeRIRView } from "allah-crayon-react/safe";

const document = {
  version: "0",
  situationId: "situation:renderer-example",
  root: "field:root",
  explanation: ["public renderer example"],
  nodes: [
    { id: "field:root", kind: "field", children: ["anchor:1", "mark:1"] },
    { id: "anchor:1", kind: "anchor", subjectId: "resource:1", entityType: "resource", label: "Example Resource", semanticRef: "resource:1" },
    { id: "mark:1", kind: "mark", role: "knowledge", label: "resource:1.state", value: undefined, epistemic: "unknown", semanticRef: "resource:1.state" },
  ],
};

const agent = renderRIRForAgent(document);
const voice = renderRIRForVoice(document);
const web = renderToStaticMarkup(React.createElement(SafeRIRView, { document, detail: "standard" }));

if (agent.authority.rendererGrantsAuthority !== false) throw new Error("Agent renderer authority invariant failed");
if (!/unknown/i.test(voice.text)) throw new Error("Voice renderer omitted uncertainty");
if (!/data-semantic-ref="resource:1"/.test(web)) throw new Error("Web renderer omitted semantic ref");

console.log("Agent renderer:", JSON.stringify(agent, null, 2));
console.log("Voice renderer:", voice.text);
console.log("React renderer HTML:", web);
