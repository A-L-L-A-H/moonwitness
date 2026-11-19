"use client";

import { moonwitnessSdk } from "@moonwitness/contracts/sdk";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, Crown, EyeIcon, Smiley, Splatter, Star4 } from "@moonwitness/ui/icons";
import {
  Button,
  CutoutArtwork,
  DnaBrandLogo,
  Grain,
  SkinArtworkFrame,
  Tape,
  ZineButton,
  ZineCardRough,
  ZineInput,
  useSkin,
} from "@moonwitness/ui";
import { Onboarding } from "@/components/onboarding";
import { useTranslation } from "@/hocs/TranslationWrapper";
import { authenticate } from "@/lib/auth";
import { startMidLogin } from "@/lib/mid-oidc";
import { notifySessionChange } from "@/lib/session";
import { getLocaleFromPath, getLocalizedUrl } from "@/utils/i18n";

export function ShadowPageView() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-brush text-2xl text-[var(--primary)]">
          OPENING THE SHADOW…
        </div>
      }
    >
      <ShadowEntry />
    </Suspense>
  );
}

function ShadowEntry() {
  const searchParams = useSearchParams();
  if (searchParams.get("mode") === "setup") {
    return <Onboarding />;
  }
  return <ShadowLoginView />;
}

export function ShadowLoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { skin } = useSkin();
  const { dictionary } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [status, setStatus] = useState<"idle" | "entering">("idle");
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let active = true;
    moonwitnessSdk.auth
      .setupStatus()
      .then((payload) => {
        if (active && payload && payload.initialized === false) {
          setNeedsSetup(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  function resolvePostLoginUrl(): string {
    const redirectTo = searchParams.get("redirectTo");
    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      return redirectTo;
    }
    const pathLocale =
      typeof window !== "undefined" ? getLocaleFromPath(window.location.pathname) : null;
    return pathLocale ? getLocalizedUrl("/mission-control", pathLocale) : "/mission-control";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = await authenticate(email, password);
    if (!result.ok) {
      setErrors(
        result.field === "credentials"
          ? { identifier: result.message }
          : { [result.field]: result.message },
      );
      return;
    }
    setErrors({});

    setStatus("entering");
    const targetUrl = resolvePostLoginUrl();
    setTimeout(() => {
      notifySessionChange();
      router.push(targetUrl);
    }, 900);
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--background)]">
      <Grain />
      <SkinArtworkFrame
        skin={skin}
        artKey={skin === "default" ? "city-shadow" : undefined}
        showCutout
        eager
        sizes="100vw"
        className="pointer-events-none absolute inset-0"
        plateClassName="object-cover object-[65%_center] opacity-60"
        scrimClassName="bg-gradient-to-r from-[var(--background)]/92 via-[var(--background)]/62 to-[var(--background)]/25"
      />
      <Splatter className="absolute -left-8 top-20 h-48 w-48 text-[var(--primary)] opacity-60" />
      <Star4 className="absolute right-[16%] top-40 hidden h-10 w-10 text-[var(--primary)] lg:block" />

      <header className="relative z-10 flex min-h-16 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--card)]/90 px-4 py-2 backdrop-blur-sm sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 max-lg:min-h-11">
          <DnaBrandLogo id="shadow-frequency" variant="mark" size={26} decorative />
          <span className="font-brush text-lg text-[var(--foreground)] sm:text-2xl">
            MOON<span className="text-[var(--primary)]">WITNESS</span>
          </span>
          <span className="ml-2 hidden font-hand text-lg text-[var(--muted-foreground)] md:inline">
            Empire of the light
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden font-hand text-lg text-[var(--foreground)] sm:inline">
            Same moon. Different people.
          </span>
          <ZineButton
            asChild
            tone="yellow"
            className="hidden items-center gap-2 px-4 py-2 text-sm sm:inline-flex"
          >
            <Link href="/dock">
              FOLLOW THE SIGNAL <ArrowRight className="h-4 w-4" />
            </Link>
          </ZineButton>
          <Link
            href="/dock"
            aria-label="Follow the signal to the archive"
            className="inline-flex min-h-11 min-w-11 items-center justify-center border-2 border-[var(--secondary)] bg-[var(--secondary)] text-[var(--secondary-foreground)] sm:hidden"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main
        id="main"
        className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl items-center px-4 py-10 sm:px-8"
      >
        <div className="w-full max-w-md">
          <ZineCardRough className="relative p-7 sm:p-9">
            <Tape className="-top-3 left-10 -rotate-6" />
            <Tape className="-top-2 right-8 rotate-3" />
            <DnaBrandLogo
              id="shadow-frequency"
              variant="stamp"
              size={38}
              className="absolute right-6 top-6 rotate-6"
              decorative
            />
            <CutoutArtwork
              id="cipher-wheel"
              decorative
              className="pointer-events-none absolute bottom-4 h-24 w-24 text-[var(--primary)]/10 ltr:-right-4 rtl:-left-4"
            />

            <h1 className="font-brush text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">
              ENTER <span className="text-[var(--primary)]">THE SHADOW</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              {dictionary.auth.subtitle}
            </p>
            {needsSetup && (
              <div className="mt-4 border-2 border-[var(--yellow)] bg-[var(--yellow)]/10 p-3 text-xs text-[var(--foreground)]">
                <p className="font-mono font-bold text-[var(--primary)]">
                  INSTANCE BELUM DIINISIALISASI
                </p>
                <p className="mt-1 text-[var(--foreground)]">
                  Selesaikan setup admin awal terlebih dahulu sebelum masuk ke platform.
                </p>
                <Link
                  href="/shadow?mode=setup"
                  className="mt-2 inline-block font-mono text-[var(--primary)] underline"
                >
                  BUKA ONBOARDING SETUP →
                </Link>
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-[var(--foreground)]"
                >
                  Email or Username
                </label>
                <ZineInput
                  id="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or username"
                  aria-invalid={!!errors.identifier}
                  aria-describedby={errors.identifier ? "email-error" : undefined}
                  className="rounded-md px-4 py-3 text-sm"
                />
                {errors.identifier && (
                  <p id="email-error" role="alert" className="mt-1.5 text-xs text-[var(--red)]">
                    {errors.identifier}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-bold tracking-wider text-[var(--foreground)]"
                >
                  Password
                </label>
                <div className="relative">
                  <ZineInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className="rounded-md px-4 py-3 pr-12 text-sm"
                  />
                  <Button
                    type="button"
                    variant="plain"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${showPassword ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="mt-1.5 text-xs text-[var(--red)]">
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Session expires automatically.
                </span>
                <Button
                  type="button"
                  variant="plain"
                  disabled
                  aria-describedby="recovery-unavailable"
                  className="cursor-not-allowed text-xs text-[var(--muted-foreground)]"
                >
                  Forgot password?
                </Button>
              </div>
              <p id="recovery-unavailable" className="text-xs text-[var(--muted-foreground)]">
                Password recovery is unavailable. Contact an administrator.
              </p>

              <ZineButton
                type="submit"
                tone="pink"
                disabled={status === "entering"}
                className="w-full px-6 py-4 text-xl"
              >
                {status === "entering" ? (
                  "ENTERING…"
                ) : (
                  <>
                    ENTER THE SHADOW <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </ZineButton>

              <ZineButton
                type="button"
                tone="yellow"
                onClick={() => void startMidLogin(resolvePostLoginUrl())}
                className="w-full px-5 py-3 text-sm"
              >
                SIGN IN VIA MOONWITNESS ID <ArrowRight className="h-4 w-4" />
              </ZineButton>

              <div className="flex items-center gap-3 pt-1 text-[11px] text-[var(--muted-foreground)]">
                <span className="h-px flex-1 bg-[var(--line)]" />
                <Crown className="h-3 w-5 text-[var(--primary)]" />
                Authorized crew only.
                <span className="h-px flex-1 bg-[var(--line)]" />
              </div>
            </form>
          </ZineCardRough>

          <div className="sticker mt-6 inline-block -rotate-2 px-4 py-2 font-hand text-lg font-bold">
            WITNESS THE REAL.
          </div>
        </div>

        <div className="ml-auto hidden flex-col items-end gap-6 lg:flex">
          <div
            className="sticker float-y max-w-[220px] rotate-2 px-4 py-3 font-hand text-xl font-bold"
            style={{ "--rot": "2deg" } as React.CSSProperties}
          >
            DIFFERENT PEOPLE.
            <br />
            SAME SKY.
            <br />
            STORIES BEYOND BORDERS.
          </div>
          <div
            className="sticker sticker-black float-y max-w-[220px] -rotate-2 border border-[var(--border)] px-4 py-3 font-hand text-xl"
            style={{ "--rot": "-2deg", animationDelay: "1s" } as React.CSSProperties}
          >
            A BRIGHTER TOMORROW FOR A BOLDER HUMANITY.
          </div>
          <Smiley className="h-12 w-12 rotate-12 text-[var(--primary)]" />
        </div>
      </main>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--border)] bg-[var(--card)]/90 px-4 py-4 text-[11px] text-[var(--muted-foreground)] backdrop-blur-sm sm:px-8">
        <span className="flex items-center gap-2">
          <Smiley className="h-4 w-4 text-[var(--primary)]" />
          Moonwitness // Create · Curate · Publish
        </span>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/" className="hover:text-[var(--primary)] max-lg:min-h-11 max-lg:min-w-11">
            Home
          </Link>
          <Link
            href="/dock"
            className="hover:text-[var(--primary)] max-lg:min-h-11 max-lg:min-w-11"
          >
            Archive
          </Link>
          <Link
            href="/mission-control"
            className="hover:text-[var(--primary)] max-lg:min-h-11 max-lg:min-w-11"
          >
            Mission Control
          </Link>
        </nav>
      </footer>
    </div>
  );
}
export default ShadowPageView;
