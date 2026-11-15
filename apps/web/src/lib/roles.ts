/** Canonical crew role set enforced by the API. */
export type CrewRoleName = "admin" | "editor" | "viewer";

/** Server-side write routes for the service proxies are admin-only. */
export const WRITE_ROLES: readonly CrewRoleName[] = ["admin"];

export function isWriteRole(role: string | null | undefined): boolean {
  return role === "admin";
}

/** UI convenience: normalize a role string from /api/v1/auth/me. */
export function normalizeRole(role: unknown): CrewRoleName | null {
  return role === "admin" || role === "editor" || role === "viewer" ? role : null;
}
