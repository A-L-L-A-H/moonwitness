import { Suspense } from "react";
import { IntelligenceShell } from "./intelligence-shell";

export const metadata = { title: "RIOT Intelligence — Local Inference" };

export default function IntelligencePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-brush text-2xl text-[var(--pink)]">
          INITIALIZING RIOT INTELLIGENCE…
        </div>
      }
    >
      <IntelligenceShell />
    </Suspense>
  );
}
