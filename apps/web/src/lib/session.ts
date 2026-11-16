import { useEffect, useState } from "react";
import { getStoredMidAccessToken } from "./mid-oidc";

export interface Session {
  identity: string;
  role: string;
  username?: string;
  id?: number;
}

function buildAuthFetchInit(): RequestInit {
  const token = getStoredMidAccessToken();
  return token
    ? { credentials: "include", headers: { authorization: `Bearer ${token}` } }
    : { credentials: "include" };
}

/**
 * Hook: current identity from server-side session
 */
export function useCurrentIdentity(): Session | null {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch("/api/v1/auth/me", buildAuthFetchInit());
        if (response.ok) {
          const data = await response.json();
          const user: unknown = data?.user;
          if (!user || typeof user !== "object") {
            setSession(null);
            return;
          }
          const profile = user as {
            id?: unknown;
            displayName?: unknown;
            username?: unknown;
            role?: unknown;
          };
          setSession({
            identity: typeof profile.displayName === "string" ? profile.displayName : "Operator",
            role: typeof profile.role === "string" ? profile.role : "viewer",
            username: typeof profile.username === "string" ? profile.username : undefined,
            id: typeof profile.id === "number" ? profile.id : undefined,
          });
        } else {
          setSession(null);
        }
      } catch {
        setSession(null);
      }
    }

    fetchSession();
  }, []);

  useEffect(() => {
    function onSessionChange() {
      fetch("/api/v1/auth/me", buildAuthFetchInit())
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const user: unknown = data?.user;
          if (user && typeof user === "object") {
            const profile = user as {
              id?: unknown;
              displayName?: unknown;
              username?: unknown;
              role?: unknown;
            };
            setSession({
              identity: typeof profile.displayName === "string" ? profile.displayName : "Operator",
              role: typeof profile.role === "string" ? profile.role : "viewer",
              username: typeof profile.username === "string" ? profile.username : undefined,
              id: typeof profile.id === "number" ? profile.id : undefined,
            });
          } else {
            setSession(null);
          }
        })
        .catch(() => setSession(null));
    }

    window.addEventListener("mw:session-change", onSessionChange);
    return () => window.removeEventListener("mw:session-change", onSessionChange);
  }, []);

  return session;
}

/**
 * Call after login/logout to notify same-tab listeners.
 */
export function notifySessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mw:session-change"));
  }
}
