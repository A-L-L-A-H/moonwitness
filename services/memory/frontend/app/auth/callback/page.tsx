"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { completeMemoryMidCallback } from "../../../lib/mid-oidc";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    completeMemoryMidCallback(new URLSearchParams(searchParams.toString()))
      .then(({ nextPath }) => {
        if (cancelled) return;
        router.replace(nextPath);
      })
      .catch((caughtError: unknown) => {
        if (cancelled) return;
        setErrorMessage(
          caughtError instanceof Error
            ? caughtError.message
            : "MoonWitness ID verification failed.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="auth-callback-shell">
      <section className="auth-callback-card" aria-live="polite">
        <p className="screen-overline">MOONWITNESS ID // MEMORY PKCE</p>
        <h1>{errorMessage ? "AUTHENTICATION FAILED" : "VERIFYING IDENTITY..."}</h1>
        {errorMessage ? (
          <>
            <p className="auth-callback-error" role="alert">
              {errorMessage}
            </p>
            <Link className="export-button" href="/">
              RETURN TO MEMORY DECK
            </Link>
          </>
        ) : (
          <p className="auth-callback-note">Exchanging authorization code with MoonWitness ID...</p>
        )}
      </section>
    </main>
  );
}

export default function MemoryAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-callback-shell">
          <section className="auth-callback-card">
            <p className="screen-overline">MOONWITNESS ID // MEMORY PKCE</p>
            <h1>VERIFYING IDENTITY...</h1>
          </section>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
