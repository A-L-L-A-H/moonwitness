/**
 * Genesis 00 public package entrypoint.
 *
 * Domain capabilities and canonical contracts are intentionally not implemented
 * until their authorized implementation phases.
 */
export const repositoryIdentity = "moonwitness-crayon-lab" as const;

export type LabPhase = "idle" | "queued" | "running" | "completed" | "failed";
export interface CrayonLabState {
  readonly input: string;
  readonly phase: LabPhase;
  readonly result?: Readonly<Record<string, unknown>>;
  readonly error?: string;
}

/** UI-only workspace state; scoring remains owned by moonwitness-crayon. */
export function createLabState(input = ""): CrayonLabState { return { input, phase: "idle" }; }
export function transitionLab(state: CrayonLabState, phase: LabPhase, details: Partial<CrayonLabState> = {}): CrayonLabState {
  return { ...state, ...details, phase };
}
