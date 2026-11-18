export const MEMORY_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function memorySdkFetch(
  path: string,
  init: RequestInit & { bearerToken?: string | null } = {},
): Promise<Response> {
  const { bearerToken, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (bearerToken && !headers.has("Authorization")) {
    headers.set("Authorization", "Bearer " + bearerToken);
  }
  return fetch(`${MEMORY_API_BASE}${path}`, { ...rest, headers });
}
