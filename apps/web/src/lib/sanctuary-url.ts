/**
 * Resolves the A-L-L-A-H Sanctuary gateway origin (defaults to same-origin root `/` in unified apps/web).
 */
export const IMPERIUM_GATE_URL = (process.env.NEXT_PUBLIC_ALLAH_URL ?? "").replace(/\/+$/, "");
