/**
 * Resolves the external A-L-L-A-H Sanctuary gateway origin without leaking localhost into production builds.
 */
export const IMPERIUM_GATE_URL = (
  process.env.NEXT_PUBLIC_ALLAH_URL ??
  (process.env.NODE_ENV === "production" ? "https://a-l-l-a-h.com" : "http://localhost:3003")
).replace(/\/+$/, "");
