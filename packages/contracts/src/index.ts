export * from "./timeline/endpoints";
export * from "./canon";
export * from "./knowledge";
export * from "./witness";
export * from "./continuity";
export * from "./chronicle";
export * from "./research";
export * from "./sidra";
export * from "./publication";
export * from "./sdk";

/**
 * Deferred Write Models (MW-0411):
 * The following domain write models are intentionally deferred from Wave 4
 * and will be specified in a subsequent wave:
 * - `works`: Creative/literary works and derivative artifacts.
 * - `signal`: Real-time event/telemetry ingestion and alerting streams.
 * - `justice`: Adjudication, dispute resolution, and governance enforcement.
 */
export const DEFERRED_WRITE_MODELS = ["works", "signal", "justice"] as const;
export type DeferredWriteModel = (typeof DEFERRED_WRITE_MODELS)[number];
