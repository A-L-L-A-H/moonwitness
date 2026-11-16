import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";
import {createCrayonEngine} from "../src/index.js";
import type {CrayonInput, FailureCode, TransitionStatus, UnknownReason} from "../src/index.js";

interface ExpectedSignals {
  require?: FailureCode[];
  forbid?: FailureCode[];
  transitionToG2?: TransitionStatus;
  unknownReason?: UnknownReason;
}

interface FixtureCase {
  id: string;
  input: CrayonInput;
  expectedSignals: ExpectedSignals;
}

interface FixtureFile {
  version: string;
  status: string;
  cases: FixtureCase[];
}

const fixtureUrl = new URL("../../benchmarks/fixtures/v0.8.json", import.meta.url);
const fixture = JSON.parse(readFileSync(fixtureUrl, "utf8")) as FixtureFile;
const engine = createCrayonEngine();

describe("RGBL R&D v0.8 benchmark development fixtures", () => {
  it("loads the expected v0.8 development suite", () => {
    expect(fixture.version).toBe("0.8");
    expect(fixture.status).toBe("development-fixtures-not-validation-data");
    expect(fixture.cases).toHaveLength(12);
  });

  for (const testCase of fixture.cases) {
    it(testCase.id, () => {
      const result = engine.analyze(testCase.input);
      const codes = new Set(result.rnd.diagnostics.map((diagnostic) => diagnostic.code));

      for (const code of testCase.expectedSignals.require ?? []) {
        expect(codes.has(code), `Expected diagnostic ${code}`).toBe(true);
      }

      for (const code of testCase.expectedSignals.forbid ?? []) {
        expect(codes.has(code), `Forbidden diagnostic ${code}`).toBe(false);
      }

      if (testCase.expectedSignals.transitionToG2 !== undefined) {
        expect(result.rnd.transitions.find((transition) => transition.to === "G2")?.status).toBe(
          testCase.expectedSignals.transitionToG2,
        );
      }

      if (testCase.expectedSignals.unknownReason !== undefined) {
        expect(result.rnd.unknowns.some((unknown) => unknown.reason === testCase.expectedSignals.unknownReason)).toBe(true);
      }
    });
  }
});
