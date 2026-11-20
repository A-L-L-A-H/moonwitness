import { Suspense } from "react";
import { MemoryWorkspace } from "@/features/memory";

export default function MemoryAppPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
      <MemoryWorkspace />
    </Suspense>
  );
}
