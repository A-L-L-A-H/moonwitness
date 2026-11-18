"use client";

import { useState, useCallback } from "react";
import { useSkin, listPresets, skinPresets, type SkinName } from "@moonwitness/ui";
import { Sun } from "@moonwitness/ui/icons";

interface SkinSwitcherProps {
  className?: string;
}

export function SkinSwitcher({ className }: SkinSwitcherProps) {
  const { skin, setSkin } = useSkin();
  const [isOpen, setIsOpen] = useState(false);
  const presets = listPresets();

  const handleSelect = useCallback(
    (next: SkinName) => {
      setSkin(next);
      setIsOpen(false);
    },
    [setSkin],
  );

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change skin"
        aria-expanded={isOpen}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-zinc-300 transition-colors hover:bg-[var(--panel-2)] hover:text-white"
      >
        <Sun className="h-5 w-5" />
        <span className="ml-1.5 hidden text-xs md:inline">{skinPresets[skin].label}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-lg">
            <div className="border-b border-[var(--line)] px-3 py-2">
              <span className="text-[10px] font-bold tracking-widest text-zinc-500">
                SELECT SKIN
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {presets.map((name) => {
                const preset = skinPresets[name];
                const isActive = skin === name;
                return (
                  <button
                    key={name}
                    onClick={() => handleSelect(name)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--panel-2)] ${
                      isActive ? "bg-[var(--pink)]/10 text-[var(--pink)]" : "text-zinc-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        isActive ? "bg-[var(--pink)]" : "bg-zinc-600"
                      }`}
                    />
                    <div className="min-w-0 flex-0">
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-[10px] text-zinc-500">{preset.description}</div>
                    </div>
                    {isActive && <span className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
