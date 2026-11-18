"use client";

import { ArrowRight, TornTicket } from "../icons";
import { cn } from "../lib/utils";
import { ZineBadge } from "../primitives/zine-badge";
import { ZineImage } from "../primitives/zine-image";
import { defaultKindColors } from "./kind-colors";
import { SkinOrnament } from "../primitives/tactile-hardware";
import { useSkin } from "../skin";
import { eventCardVariants } from "../skin/compositions";

export interface EventCardData {
  id: string;
  kind: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  imagePosition?: string;
  sources?: number;
  notes?: number;
}

export function KindBadge({ kind, color }: { kind: string; color?: string }) {
  const c = color ?? defaultKindColors[kind] ?? "#9ca3af";
  return (
    <ZineBadge color={c} dark={kind === "SIGNAL"}>
      {kind}
    </ZineBadge>
  );
}

export interface EventCardProps<T extends EventCardData = EventCardData> {
  event: T;
  selected: boolean;
  list: boolean;
  onOpen: () => void;
}

export function EventCard<T extends EventCardData>({
  event,
  selected,
  list,
  onOpen,
}: EventCardProps<T>) {
  const { skin, density } = useSkin();
  const skinClass = eventCardVariants({ skin, density });

  if (list) {
    return (
      <button
        onClick={onOpen}
        data-skin={skin}
        className={cn(
          skinClass,
          "flex w-full items-center gap-4 p-3 text-left transition-all hover:translate-x-1",
          selected
            ? "border-[var(--primary)] bg-[var(--muted)] shadow-[4px_4px_0_var(--primary)]"
            : "hover:border-[var(--primary)]/70",
        )}
      >
        <div className="relative h-14 w-24 shrink-0 overflow-hidden border border-[var(--border)]">
          <ZineImage art={event.image} alt="" sizes="96px" position={event.imagePosition} />
          <SkinOrnament slot="corner" className="top-1 left-1" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <KindBadge kind={event.kind} />
            <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
              {event.date}
            </span>
          </div>
          <h3 className="cmyk-slip font-brush mt-1 truncate text-base text-[var(--foreground)]">
            {event.title.toUpperCase()}
          </h3>
          <p className="truncate font-mono text-xs text-[var(--muted-foreground)]">
            {event.excerpt}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
      </button>
    );
  }
  return (
    <button
      onClick={onOpen}
      data-skin={skin}
      className={cn(
        skinClass,
        "group relative overflow-hidden p-0 text-left transition-all duration-300 hover:-translate-y-1.5",
        selected ? "border-[var(--primary)] shadow-[6px_6px_0_var(--primary)]" : "",
      )}
    >
      <SkinOrnament slot="corner" className="top-1.5 left-2 z-20" />
      <div className="relative h-32 overflow-hidden bg-[var(--background)]">
        <ZineImage
          art={event.image}
          alt=""
          sizes="(max-width: 768px) 100vw, 25vw"
          position={event.imagePosition}
          className="transition-transform duration-700 group-hover:scale-110"
        />
        <span className="absolute left-2 top-2 z-10">
          <KindBadge kind={event.kind} />
        </span>
        <span className="absolute right-2 top-2 z-10 border border-[var(--border)] bg-[var(--background)]/85 px-2 py-0.5 font-mono text-[10px] text-[var(--primary)] shadow-[1px_1px_0_rgba(0,0,0,0.8)]">
          {event.date}
        </span>
      </div>
      <div className="bg-[var(--card)] p-4">
        <h3 className="cmyk-slip font-brush text-lg leading-snug text-[var(--card-foreground)] group-hover:text-[var(--primary)]">
          {event.title.toUpperCase()}
        </h3>
        <p className="mt-1.5 line-clamp-2 font-mono text-xs leading-relaxed text-[var(--muted-foreground)]">
          {event.excerpt}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2 font-mono text-[10px] text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5">
            <TornTicket className="h-3.5 w-3.5 text-[var(--primary)]" />
            {event.sources ?? 0} docs · {event.notes ?? 0} notes
          </span>
          <span className="flex h-7 w-7 items-center justify-center border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] transition-colors group-hover:border-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)]">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
