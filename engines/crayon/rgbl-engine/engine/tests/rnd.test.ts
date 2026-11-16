import {describe, expect, it} from "vitest";
import {createCrayonEngine, isClaimAdmissibleAtLevel, scoreBenchmark} from "../src/index.js";

const engine = createCrayonEngine();

describe("RGBL R&D v0.8 formal model", () => {
  it("keeps canonical claim boundaries machine-readable", () => {
    expect(isClaimAdmissibleAtLevel("observation","R1")).toBe(true);
    expect(isClaimAdmissibleAtLevel("observation","L4")).toBe(false);
    expect(isClaimAdmissibleAtLevel("theological-claim","L4")).toBe(true);
  });

  it("records a supported R1 to G2 transition when evidence exists", () => {
    const result = engine.analyze({question:"What pattern is supported?",observations:["A happened"],patterns:["A repeats under condition X"]});
    expect(result.rnd.transitions.find((x)=>x.to==="G2")?.status).toBe("supported");
  });

  it("warns when G2 is proposed without R1", () => {
    const result = engine.analyze({question:"What pattern is supported?",patterns:["This always happens"]});
    expect(result.rnd.diagnostics.some((x)=>x.code==="G_WITHOUT_R")).toBe(true);
  });

  it("distinguishes why a level is unknown", () => {
    const result = engine.analyze({question:"Can one observation establish a pattern?",observations:["One event"]});
    expect(result.rnd.unknowns.find((x)=>x.level==="G2")?.reason).toBe("insufficient-sample");
  });

  it("preserves unresolved conflict and warns before L4", () => {
    const result = engine.analyze({question:"What should we do?",observations:["Source A says X"],actors:["decision maker"],nextActions:["act on X"],conflicts:[{description:"Source B says not-X"}]});
    expect(result.rnd.conflicts[0]?.status).toBe("unresolved");
    expect(result.rnd.diagnostics.some((x)=>x.code==="CONTRADICTION_SUPPRESSION")).toBe(true);
  });

  it("supports different confidence values per level", () => {
    const result = engine.analyze({question:"How certain are the stages?",observations:["fact"],patterns:["pattern"],actors:["actor"],nextActions:["reversible test"],levelConfidence:{R1:0.95,G2:0.7,B3:0.5,L4:0.3}});
    expect(result.rnd.levelConfidence).toEqual({R1:0.95,G2:0.7,B3:0.5,L4:0.3});
    expect(result.rnd.diagnostics.some((x)=>x.code==="LOW_CONFIDENCE_ACTION")).toBe(true);
  });

  it("enforces theology provenance as a diagnostic boundary", () => {
    const result = engine.analyze({domain:"allah",question:"What is the source type?",structuredClaims:[{id:"t1",text:"Allah is Creator",level:"L4",type:"theological-claim",evidenceClass:"empirical"}]});
    expect(result.rnd.diagnostics.some((x)=>x.code==="THEOLOGY_PROVENANCE_BOUNDARY")).toBe(true);
  });

  it("scores the nine-dimension benchmark rubric", () => {
    const score = scoreBenchmark({rAccuracy:4,gSupport:4,bInterpretiveDiscipline:3,lResponsibility:3,provenance:4,unknownHonesty:4,alternativeCoverage:3,confidenceCalibration:3,actionUsefulness:4});
    expect(score.max).toBe(36);
    expect(score.normalized).toBeGreaterThan(0.8);
  });
});
