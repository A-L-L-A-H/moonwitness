"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { completeMidCallback } from "@/lib/mid-oidc";
import { notifySessionChange } from "@/lib/session";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    completeMidCallback(new URLSearchParams(searchParams.toString()))
      .then((nextPath) => {
        if (cancelled) return;
        notifySessionChange();
        router.replace(nextPath);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMessage(err instanceof Error ? err.message : "Authentication callback failed.");
      });
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ink)] px-4 text-[var(--paper)]">
      <div className="w-full max-w-md border-2 border-[var(--line)] bg-black/80 p-8 shadow-[6px_6px_0_var(--yellow)]">
        <p className="font-mono text-xs tracking-[0.22em] text-[var(--yellow)]">
          MOONWITNESS ID // PKCE
        </p>
        <h1 className="mt-2 font-brush text-3xl text-white">
          {errorMessage ? "SSO AUTHENTICATION FAILED" : "VERIFYING IDENTITY…"}
        </h1>
        {errorMessage ? (
          <>
            <p role="alert" className="mt-3 text-sm text-[var(--red)]">
              {errorMessage}
            </p>
            <Link
              href="/shadow"
              className="btn-zine mt-6 inline-flex items-center px-4 py-2 text-sm"
            >
              RETURN TO SIGN IN
            </Link>
          </>
        ) : (
          <p className="mt-3 font-mono text-xs text-zinc-400">
            Exchanging authorization code with id.moonwitness.biz.id…
          </p>
        )}
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--ink)] font-mono text-xs text-zinc-400">
          VERIFYING IDENTITY…
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
