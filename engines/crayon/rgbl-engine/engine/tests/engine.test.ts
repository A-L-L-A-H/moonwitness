import {describe, expect, it} from "vitest";
import {createCrayonEngine, CrayonValidationError, ENGINE_VERSION, RESULT_SCHEMA_VERSION} from "../src/index.js";

const engine = createCrayonEngine();

describe("CRAYON engine production contract", () => {
  it("preserves the RGBL epistemic yield order", () => {
    const result = engine.analyze({domain:"human",question:"What happened?",observations:["I spoke before listening"],patterns:["I react quickly when embarrassed"],actors:["self","friend"],impacts:["friend felt dismissed"],nextActions:["listen and apologize"]});
    expect(result.epistemicYield.R1.yield).toBe("Information");
    expect(result.epistemicYield.G2.yield).toBe("Knowledge");
    expect(result.epistemicYield.B3.yield).toBe("Understanding / Meaning");
    expect(result.epistemicYield.L4.yield).toBe("Wisdom / Responsible Direction");
  });
  it("uses UNKNOWN instead of inventing missing levels", () => {
    const result = engine.analyze({question:"What do we know?"});
    expect(result.completeness.filledLevels).toBe(0);
    expect(result.completeness.missingLevels).toEqual(["R1","G2","B3","L4"]);
  });
  it("reports production metadata", () => {
    const result = engine.analyze({question:"What do we know?"});
    expect(result.engineVersion).toBe(ENGINE_VERSION);
    expect(result.schemaVersion).toBe(RESULT_SCHEMA_VERSION);
  });
  it("maps the four examples to their worlds", () => {
    expect(engine.analyze({domain:"allah",question:"q"}).world).toBe("SOURCE");
    expect(engine.analyze({domain:"human",question:"q"}).world).toBe("SELF");
    expect(engine.analyze({domain:"nature",question:"q"}).world).toBe("WORLD");
    expect(engine.analyze({domain:"justice",question:"q"}).world).toBe("OTHERS");
  });
  it("keeps the Allah application boundary explicit", () => {
    const result = engine.analyze({domain:"allah",question:"What can be recognized?"});
    expect(result.caution.join(" ")).toContain("empirically measurable");
  });
  it("validates confidence", () => {
    expect(() => engine.analyze({question:"q", confidence: 2})).toThrow(CrayonValidationError);
  });
  it("validates a non-empty question", () => {
    expect(() => engine.analyze({question:"   "})).toThrow(CrayonValidationError);
  });
  it("supports batch analysis", () => {
    expect(engine.analyzeMany([{question:"A"},{question:"B"}])).toHaveLength(2);
  });
});
