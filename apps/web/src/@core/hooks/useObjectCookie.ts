"use client";

import { useCallback, useEffect, useState } from "react";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

function writeCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export interface UpdateObjectCookieOptions {
  updateCookie?: boolean;
}

export function useObjectCookie<T extends object>(
  key: string,
  fallback: T,
): [T, (value: T | ((prev: T) => T), options?: UpdateObjectCookieOptions) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = readCookie(key);
      if (!raw) return fallback;
      return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      const raw = readCookie(key);
      if (raw) {
        setState((prev) => ({ ...prev, ...(JSON.parse(raw) as Partial<T>) }));
      }
    } catch {
      // Ignore malformed cookie JSON
    }
  }, [key]);

  const updateValue = useCallback(
    (next: T | ((prev: T) => T), options?: UpdateObjectCookieOptions) => {
      const { updateCookie = true } = options ?? {};
      setState((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        if (updateCookie) {
          try {
            writeCookie(key, JSON.stringify(resolved));
          } catch {
            // Ignore cookie write failure
          }
        }
        return resolved;
      });
    },
    [key],
  );

  return [state, updateValue];
}
