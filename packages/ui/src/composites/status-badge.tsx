"use client";

import { Badge } from "../components/ui/badge";
import { useSkin } from "../skin";
import { ZineBadge } from "../primitives/zine-badge";

export interface StatusBadgeProps {
  /** Status teks yang akan ditampilkan di badge */
  status: string;
  /** Warna teks (CSS custom property name) */
  tone?: string;
  /** Apakah menggunakan background gelap (dark) */
  dark?: boolean;
}

const STATUS_BORDER: Record<string, string> = {
  DRAFT: "border-[var(--purple)] bg-[var(--purple)]/15 text-[var(--foreground)]",
  READY: "border-[var(--blue)] bg-[var(--blue)]/15 text-[var(--foreground)]",
  "IN REVIEW": "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]",
  APPROVED: "border-[var(--green)] bg-[var(--green)]/15 text-[var(--foreground)]",
  PUBLISHED: "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]",
};

export function StatusBadge({ status, tone, dark }: StatusBadgeProps) {
  const { skin } = useSkin();
  if (tone) {
    return (
      <ZineBadge color={tone} dark={dark ?? false} data-skin={skin}>
        {status}
      </ZineBadge>
    );
  }
  return (
    <Badge
      variant="outline"
      skin={skin}
      className={
        STATUS_BORDER[status] ??
        "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]"
      }
    >
      {status}
    </Badge>
  );
}
