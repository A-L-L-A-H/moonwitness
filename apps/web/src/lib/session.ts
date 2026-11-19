import { requestApiResponse } from "@moonwitness/contracts/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  assertProductionAuthSafety,
  isDevSessionFallbackEnabled,
  parseSessionPayload,
  type Session,
} from "./session-shared";

export {
  assertProductionAuthSafety,
  isDevSessionFallbackEnabled,
  parseSessionPayload,
  type Session,
};

export interface CurrentSessionState {
  readonly session: Session | null;
  readonly loading: boolean;
  readonly refresh: () => Promise<void>;
}

function buildAuthFetchInit(): RequestInit {
  return { credentials: "include" };
}

const SESSION_CACHE_TTL_MS = 5_000;

let inFlightSessionFetch: Promise<Session | null> | null = null;
let cachedSession: { value: Session | null; fetchedAt: number } | null = null;
let lastKnownSession: Session | null = null;

const DEV_OPERATOR_SESSION: Session = {
  identity: "Dev Operator",
  role: "admin",
  username: "dev",
  id: "dev-local",
};

function resolveFallbackSession(): Session | null {
  return isDevSessionFallbackEnabled() ? DEV_OPERATOR_SESSION : null;
}

async function fetchCurrentSession(forceRefresh = false): Promise<Session | null> {
  const canUseCache = process.env.NODE_ENV !== "test";
  if (
    !forceRefresh &&
    canUseCache &&
    cachedSession &&
    Date.now() - cachedSession.fetchedAt < SESSION_CACHE_TTL_MS
  ) {
    return cachedSession.value;
  }

  if (!forceRefresh && inFlightSessionFetch) {
    return inFlightSessionFetch;
  }

  const requestPromise = (async (): Promise<Session | null> => {
    try {
      const response = await requestApiResponse("/api/v1/auth/me", buildAuthFetchInit());
      if (!response.ok) {
        if (response.status === 429 || response.status === 503) {
          const preserved = lastKnownSession ?? resolveFallbackSession();
          if (canUseCache) {
            cachedSession = { value: preserved, fetchedAt: Date.now() };
          }
          return preserved;
        }
        lastKnownSession = null;
        const fallback = resolveFallbackSession();
        if (canUseCache) {
          cachedSession = { value: fallback, fetchedAt: Date.now() };
        }
        return fallback;
      }
      const data = (await response.json()) as unknown;
      const parsed = parseSessionPayload(data);
      if (parsed) {
        lastKnownSession = parsed;
        if (canUseCache) {
          cachedSession = { value: parsed, fetchedAt: Date.now() };
        }
        return parsed;
      }
      lastKnownSession = null;
      const fallback = resolveFallbackSession();
      if (canUseCache) {
        cachedSession = { value: fallback, fetchedAt: Date.now() };
      }
      return fallback;
    } catch {
      return lastKnownSession ?? resolveFallbackSession();
    }
  })().finally(() => {
    if (inFlightSessionFetch === requestPromise) {
      inFlightSessionFetch = null;
    }
  });

  inFlightSessionFetch = requestPromise;
  return requestPromise;
}

/**
 * Hook: current session state with loading flag and manual refresh,
 * synchronized via `mw:session-change` window events.
 */
export function useCurrentSessionState(): CurrentSessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    if (mountedRef.current) {
      setLoading(true);
    }
    const nextSession = await fetchCurrentSession(true);
    if (!mountedRef.current || seq !== requestSeqRef.current) {
      return;
    }
    setSession(nextSession);
    setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    const loadSession = () => {
      const seq = ++requestSeqRef.current;
      void fetchCurrentSession().then((nextSession) => {
        if (!active || !mountedRef.current || seq !== requestSeqRef.current) {
          return;
        }
        setSession(nextSession);
        setLoading(false);
      });
    };

    loadSession();

    const onSessionChange = () => {
      loadSession();
    };

    window.addEventListener("mw:session-change", onSessionChange);
    return () => {
      active = false;
      mountedRef.current = false;
      requestSeqRef.current += 1;
      window.removeEventListener("mw:session-change", onSessionChange);
    };
  }, []);

  return { session, loading, refresh };
}

/**
 * Hook: current identity from server-side session
 */
export function useCurrentIdentity(): Session | null {
  return useCurrentSessionState().session;
}

/**
 * Call after login/logout to notify same-tab listeners.
 */
export function notifySessionChange() {
  cachedSession = null;
  inFlightSessionFetch = null;
  lastKnownSession = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mw:session-change"));
  }
}
