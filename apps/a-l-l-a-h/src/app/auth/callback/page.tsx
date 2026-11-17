"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { OctagramMandalaIcon } from "@/components/sacred-icons";
import { completeSanctuaryMidCallback } from "@/lib/mid-oidc";
import { useSanctuaryLocale } from "@/lib/sanctuary-locale";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useSanctuaryLocale();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    completeSanctuaryMidCallback(new URLSearchParams(searchParams.toString()))
      .then(({ nextPath }) => {
        if (cancelled) return;
        router.replace(nextPath);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : locale === "id"
              ? "Verifikasi identitas MoonWitness ID gagal."
              : "MoonWitness ID verification failed.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [locale, router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#040509] px-4 text-[#f5efe2]">
      <div className="w-full max-w-md border border-[#d6b46c]/45 bg-[#080b14]/95 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
        <div className="flex items-center gap-3">
          <OctagramMandalaIcon className="h-8 w-8 shrink-0" />
          <p className="font-mono text-[10px] tracking-[0.22em] text-[#dfc07b] uppercase">
            MOONWITNESS ID // SANCTUARY PKCE
          </p>
        </div>
        <h1 className="mt-4 font-monument text-xl tracking-[0.14em] text-[#fff6df] uppercase">
          {errorMessage
            ? locale === "id"
              ? "OTENTIKASI GAGAL"
              : "AUTHENTICATION FAILED"
            : locale === "id"
              ? "MEMVERIFIKASI IDENTITAS…"
              : "VERIFYING IDENTITY…"}
        </h1>
        {errorMessage ? (
          <>
            <p role="alert" className="mt-3 font-mono text-xs text-[#fca5a5]">
              {errorMessage}
            </p>
            <Link
              href="/"
              className="btn-luxe-secondary mt-6 inline-flex items-center px-4 py-2 font-mono text-[11px] tracking-[0.16em] text-[#f5dfa6] uppercase"
            >
              {locale === "id" ? "KEMBALI KE GERBANG" : "RETURN TO GATE"}
            </Link>
          </>
        ) : (
          <p className="mt-3 font-mono text-xs text-[#c7bda6]">
            {locale === "id"
              ? "Menukar kode otorisasi dengan id.moonwitness.biz.id…"
              : "Exchanging authorization code with id.moonwitness.biz.id…"}
          </p>
        )}
      </div>
    </main>
  );
}

export default function SanctuaryAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#040509] font-mono text-xs text-[#c7bda6]">
          VERIFYING IDENTITY…
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
