import * as React from "react";
import { useI18n } from "../i18n";

export function Loading({ label }: { label?: string }) {
  const { t } = useI18n();
  return <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">{label ?? t("loading")}…</div>;
}
export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">{message}</div>;
}
