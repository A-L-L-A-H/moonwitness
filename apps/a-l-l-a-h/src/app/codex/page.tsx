import type { Metadata } from "next";
import { CodexPageClient } from "@/components/codex-page-client";

export const metadata: Metadata = {
  title: "The Canon Codex",
  description:
    "Four architectural gallery doors spanning MoonWitness chronicles, P18 epistemic corpus discipline, unassigned human stewardship, and sovereign runtimes.",
};

export default function CodexPage() {
  return <CodexPageClient />;
}
