import {
  avatarDataUri,
  resolveDnaAvatarPalette,
  type WitnessAvatarOptions,
} from "@moonwitness/avatars";
import { cn } from "../cn";

export interface WitnessAvatarProps {
  /** Seed deterministik — nama user, id crew, atau string apa pun. */
  seed: string;
  /** Ukuran render px; SVG tetap tajam di ukuran berapa pun. */
  size?: number;
  alt?: string;
  className?: string;
  /** Opsional: selaraskan palette avatar dengan Master DNA aktif bila palette manual tidak disetel. */
  dnaId?: string;
  /** Opsi style witness (palette, background, halftone, crown, moon, tape, radius, ...). */
  options?: Omit<WitnessAvatarOptions, "seed" | "size">;
}

/** Avatar default MoonWitness: satu seed = satu wajah zine, konsisten di seluruh app. */
export function WitnessAvatar({
  seed,
  size = 40,
  alt,
  className,
  dnaId,
  options,
}: WitnessAvatarProps) {
  const resolvedOptions =
    dnaId && !options?.palette ? { ...options, palette: resolveDnaAvatarPalette(dnaId) } : options;

  return (
    <img
      src={avatarDataUri(seed, resolvedOptions)}
      alt={alt ?? `Avatar ${seed}`}
      width={size}
      height={size}
      className={cn(
        "mw-witness-avatar shrink-0 select-none border-[length:var(--mw-card-border-width,1px)] border-[var(--border)] [filter:var(--mw-media-filter,none)] transition-transform duration-[var(--mw-motion-duration,200ms)]",
        className,
      )}
      draggable={false}
    />
  );
}
