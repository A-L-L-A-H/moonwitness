import type { Metadata } from "next";
import { MTimeObservatory } from "@/components/mtime-observatory";

export const metadata: Metadata = {
  title: "M-Time Mīqāt Observatory",
  description:
    "Explainable Hijri & crescent visibility evaluator separating physical time, solar-lunar geometry, criteria profiles, and official authority.",
};

export default function MTimePage() {
  return <MTimeObservatory />;
}
