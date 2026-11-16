import type { Metadata } from "next";
import { ScripturesStudio } from "@/components/scriptures-studio";

export const metadata: Metadata = {
  title: "Four Scriptures Studio",
  description:
    "Neutral comparative study across Taurat, Zabur, Injīl, and Al-Qur’ān with live Uthmani witness search and ethical concordance.",
};

export default function ScripturesPage() {
  return <ScripturesStudio />;
}
