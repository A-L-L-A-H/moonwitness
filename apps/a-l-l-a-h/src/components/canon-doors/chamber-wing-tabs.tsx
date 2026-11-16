"use client";

export interface ChamberWingOption<T extends string> {
  readonly id: T;
  readonly code: string;
  readonly label: string;
}

/**
 * Shared architectural sub-tab bar dividing each Codex Door into serene gallery wings.
 */
export function ChamberWingTabs<T extends string>({
  wings,
  activeWing,
  onSelectWing,
  ariaLabel,
  quietMode = false,
}: {
  readonly wings: readonly ChamberWingOption<T>[];
  readonly activeWing: T;
  readonly onSelectWing: (id: T) => void;
  readonly ariaLabel: string;
  readonly quietMode?: boolean;
}) {
  const transitionClass = quietMode ? "transition-none" : "transition-colors duration-150";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="grid grid-cols-1 gap-2 border-b border-[#d6b46c]/20 pb-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {wings.map((wing) => {
        const isActive = wing.id === activeWing;
        return (
          <button
            key={wing.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectWing(wing.id)}
            className={`min-h-[44px] border px-3.5 py-2.5 text-left cursor-pointer ${transitionClass} ${
              isActive
                ? "border-[#fff4d2] bg-[#d6b46c]/20 text-[#fff8e6] shadow-[0_0_20px_rgba(223,192,123,0.18)]"
                : "border-[#d6b46c]/25 bg-[#090c16] text-[#d8ceba] hover:border-[#d6b46c]/55 hover:text-[#fff6df]"
            }`}
          >
            <div className="font-mono text-[10px] tracking-[0.16em] text-[#dfc07b]">
              {wing.code}
            </div>
            <div className="font-monument mt-0.5 text-xs tracking-[0.08em] uppercase">
              {wing.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
