"use client";

import { cn } from "../cn";
import { useSkin, type SkinName } from "../skin";
import { ZineCard } from "../primitives/zine-card";
import { SkinOrnament } from "../primitives/tactile-hardware";

export interface StatBlockProps {
  /** Nilai besar yang ditampilkan */
  value: string | number;
  /** Label di bawah nilai */
  label: string;
  /** Warna aksen (CSS custom property name, default --pink) */
  tone?: "pink" | "blue" | "yellow" | "green";
  /** Teks tren opsional */
  trend?: string;
  /** `compact` menghilangkan kartu agar bisa ditumpuk dalam satu panel. */
  density?: "default" | "compact";
  skin?: SkinName;
}

const TONE_VAR: Record<string, string> = {
  pink: "var(--primary, var(--pink))",
  blue: "var(--accent, var(--blue))",
  yellow: "var(--secondary, var(--yellow))",
  green: "var(--green)",
};

export function StatBlock({
  value,
  label,
  tone = "pink",
  trend,
  density = "default",
  skin: explicitSkin,
}: StatBlockProps) {
  const { skin: ctxSkin } = useSkin();
  const activeSkin = explicitSkin ?? ctxSkin;
  const color = TONE_VAR[tone] ?? TONE_VAR["pink"];
  if (density === "compact") {
    return (
      <div
        data-skin={activeSkin}
        className="min-w-0 border-l-2 pl-3"
        style={{ borderColor: color }}
      >
        <div
          className="cmyk-slip font-brush text-3xl leading-none @[30rem]:text-4xl"
          style={{ color }}
        >
          {value}
        </div>
        <div className="mt-2 font-mono text-[11px] font-bold tracking-widest text-[var(--foreground)] uppercase">
          {label}
        </div>
        {trend && (
          <div className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]">{trend}</div>
        )}
      </div>
    );
  }
  return (
    <ZineCard
      data-skin={activeSkin}
      className="relative overflow-hidden p-4 transition-all hover:-translate-y-1"
    >
      <SkinOrnament slot="corner" skin={activeSkin} className="top-1.5 left-2" />
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
      <div
        className="cmyk-slip font-brush text-3xl leading-none sm:text-4xl mt-1"
        style={{ color }}
      >
        {value}
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-[11px] font-bold tracking-widest text-[var(--muted-foreground)] uppercase",
        )}
      >
        {label}
      </div>
      {trend && (
        <div className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]">{trend}</div>
      )}
    </ZineCard>
  );
}
