/** Canonical crew role set enforced by the API. */
export type CrewRoleName = "admin" | "editor" | "viewer";

/** Server-side write routes for the service proxies are admin-only. */
export const WRITE_ROLES: readonly CrewRoleName[] = ["admin"];

export function isWriteRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "admin";
}

/** UI convenience: normalize legacy or canonical role names from auth endpoints. */
export function normalizeRole(role: unknown): CrewRoleName | null {
  if (role === "admin" || role === "superadmin") return "admin";
  if (role === "editor") return "editor";
  if (role === "viewer" || role === "readonly") return "viewer";
  return null;
}
