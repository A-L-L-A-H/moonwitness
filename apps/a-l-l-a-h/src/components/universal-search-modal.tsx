"use client";

import { useEffect, useState } from "react";
import {
  SIDRA_KNOWLEDGE_AXIOMS,
  WORLD_DOMAINS,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { SearchLensIcon, WorldEmblemById } from "./sacred-icons";

export function UniversalSearchModal({
  isOpen,
  onClose,
  onNavigateToWorld,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onNavigateToWorld: (worldId: WorldIdentifier) => void;
}) {
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchingWorlds = WORLD_DOMAINS.filter(
    (domain) =>
      !normalizedQuery ||
      domain.name.toLowerCase().includes(normalizedQuery) ||
      domain.tagline.toLowerCase().includes(normalizedQuery) ||
      domain.architecturalDescription.toLowerCase().includes(normalizedQuery)
  );

  const matchingAxioms = SIDRA_KNOWLEDGE_AXIOMS.filter(
    (axiom) =>
      !normalizedQuery ||
      axiom.title.toLowerCase().includes(normalizedQuery) ||
      axiom.discipline.toLowerCase().includes(normalizedQuery) ||
      axiom.exposition.toLowerCase().includes(normalizedQuery)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search the Empire of the Light"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 px-4 pt-20 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl border border-[#d6b46c]/50 bg-[#070910] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.95)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#d6b46c]/25 pb-3">
          <div className="flex items-center gap-3 flex-1">
            <SearchLensIcon className="h-5 w-5 text-[#d6b46c]" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search worlds, chronicles, frequencies, or axioms..."
              aria-label="Search query"
              className="w-full bg-transparent font-serif text-base text-[#fff6df] placeholder-[#857d6b] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Search"
            className="min-h-[44px] min-w-[44px] border border-[#d6b46c]/35 px-3 py-1 text-[11px] font-mono text-[#d6b46c] hover:border-[#f8eac6] hover:text-[#fff6df] cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="mt-5 max-h-96 overflow-y-auto space-y-5 pr-1">
          <div>
            <div className="text-[11px] font-mono tracking-[0.22em] text-[#d6b46c] uppercase">
              WORLDS ({matchingWorlds.length})
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {matchingWorlds.map((worldEntry) => (
                <button
                  key={worldEntry.id}
                  type="button"
                  onClick={() => {
                    onNavigateToWorld(worldEntry.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 border border-[#d6b46c]/20 bg-[#0b0e18] p-3 text-left hover:border-[#e6c987] hover:bg-[#d6b46c]/12 transition-colors cursor-pointer"
                >
                  <WorldEmblemById worldId={worldEntry.id} className="h-8 w-8 shrink-0" />
                  <div>
                    <div className="font-serif text-sm tracking-[0.14em] text-[#fff6df]">
                      {worldEntry.name}
                    </div>
                    <div className="text-[11px] text-[#bfb59e]">{worldEntry.tagline}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono tracking-[0.22em] text-[#d6b46c] uppercase">
              SIDRA KNOWLEDGE AXIOMS ({matchingAxioms.length})
            </div>
            <div className="mt-2 space-y-2">
              {matchingAxioms.map((axiomRecord) => (
                <button
                  key={axiomRecord.id}
                  type="button"
                  onClick={() => {
                    onNavigateToWorld("sidra");
                    onClose();
                  }}
                  className="w-full border border-[#d6b46c]/15 bg-[#0b0e18] p-3 text-left hover:border-[#d6b46c]/45 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[#d6b46c]">
                    <span>{axiomRecord.discipline}</span>
                    <span>{axiomRecord.geometricRatio}</span>
                  </div>
                  <div className="mt-0.5 font-serif text-sm text-[#fff6df]">
                    {axiomRecord.title}
                  </div>
                  <p className="mt-0.5 text-xs text-[#bfb59e] line-clamp-2">
                    {axiomRecord.exposition}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
