import { cn } from "../cn";
import { ZineCard } from "../primitives/zine-card";
import { Staple } from "../primitives/tactile-hardware";

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
}

const TONE_VAR: Record<string, string> = {
  pink: "var(--pink)",
  blue: "var(--blue)",
  yellow: "var(--yellow)",
  green: "var(--green)",
};

export function StatBlock({
  value,
  label,
  tone = "pink",
  trend,
  density = "default",
}: StatBlockProps) {
  const color = TONE_VAR[tone] ?? TONE_VAR.pink;
  if (density === "compact") {
    return (
      <div className="min-w-0 border-l-2 pl-3" style={{ borderColor: color }}>
        <div
          className="cmyk-slip font-brush text-3xl leading-none @[30rem]:text-4xl"
          style={{ color }}
        >
          {value}
        </div>
        <div className="mt-2 font-mono text-[11px] font-bold tracking-widest text-zinc-300 uppercase">
          {label}
        </div>
        {trend && <div className="mt-1 font-mono text-[11px] text-zinc-400">{trend}</div>}
      </div>
    );
  }
  return (
    <ZineCard className="photocopy-grit relative overflow-hidden p-4 shadow-[4px_4px_0_rgba(0,0,0,0.8)] transition-all hover:-translate-y-1">
      <Staple className="top-1 left-2 -rotate-45" />
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: color }} />
      <div
        className="cmyk-slip font-brush text-3xl leading-none sm:text-4xl mt-1"
        style={{ color }}
      >
        {value}
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-[11px] font-bold tracking-widest text-zinc-400 uppercase",
        )}
      >
        {label}
      </div>
      {trend && <div className="mt-1 font-mono text-[11px] text-zinc-500">{trend}</div>}
    </ZineCard>
  );
}
