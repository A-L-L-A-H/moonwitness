import type { CommitmentAssessment, Consequence } from "allah-crayon-kernel";
import { explainCommitment, type ConsequenceContext } from "./consequence.js";

export function assessCommitment(args: {
  consequence: Consequence;
  authorityCost?: number;
  derivedRisk?: number;
  policyRisk?: number;
  externalDependency?: number;
}): CommitmentAssessment {
  const context: ConsequenceContext = {
    authorityCost: args.authorityCost,
    derivedRisk: args.derivedRisk,
    policyRisk: args.policyRisk,
    externalDependency: args.externalDependency,
  };
  const result = explainCommitment(args.consequence, context);
  return { score: result.score, mode: result.mode, reasons: result.reasons };
}
