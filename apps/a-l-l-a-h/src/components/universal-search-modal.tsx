"use client";

import { useEffect, useState } from "react";
import {
  CODEX_SEARCH_INDEX,
  FOUR_CORPUS_POLICY,
  type EntryDoorId,
} from "@/data/empire-canon-codex";
import {
  SIDRA_KNOWLEDGE_AXIOMS,
  WORLD_DOMAINS,
  type WorldIdentifier,
} from "@/data/empire-registry";
import { LUMINOUS_NAMES_OF_ALLAH } from "@/data/remembrance-sanctuary";
import { SearchLensIcon, WorldEmblemById } from "./sacred-icons";

export function UniversalSearchModal({
  isOpen,
  onClose,
  onNavigateToWorld,
  onNavigateToDoor,
  onJumpToRemembrance,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onNavigateToWorld: (worldId: WorldIdentifier) => void;
  readonly onNavigateToDoor: (doorId: EntryDoorId) => void;
  readonly onJumpToRemembrance?: () => void;
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
      domain.architecturalDescription.toLowerCase().includes(normalizedQuery),
  );

  const matchingNames = LUMINOUS_NAMES_OF_ALLAH.filter(
    (entry) =>
      !normalizedQuery ||
      entry.transliteration.toLowerCase().includes(normalizedQuery) ||
      entry.meaning.toLowerCase().includes(normalizedQuery) ||
      entry.contemplation.toLowerCase().includes(normalizedQuery) ||
      entry.arabic.includes(searchQuery.trim()),
  );

  const matchingCodex = CODEX_SEARCH_INDEX.filter(
    (entry) =>
      !normalizedQuery ||
      entry.title.toLowerCase().includes(normalizedQuery) ||
      entry.category.toLowerCase().includes(normalizedQuery) ||
      entry.subtitle.toLowerCase().includes(normalizedQuery) ||
      entry.repoSource.toLowerCase().includes(normalizedQuery),
  );

  const matchingScriptures = FOUR_CORPUS_POLICY.corpora.filter(
    (corpus) =>
      !normalizedQuery ||
      corpus.name.toLowerCase().includes(normalizedQuery) ||
      corpus.prophetAnchor.toLowerCase().includes(normalizedQuery) ||
      corpus.ethicalCore.toLowerCase().includes(normalizedQuery) ||
      corpus.neutralSummary.toLowerCase().includes(normalizedQuery),
  );

  const matchingAxioms = SIDRA_KNOWLEDGE_AXIOMS.filter(
    (axiom) =>
      !normalizedQuery ||
      axiom.title.toLowerCase().includes(normalizedQuery) ||
      axiom.discipline.toLowerCase().includes(normalizedQuery) ||
      axiom.exposition.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search the Empire of the Light"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/82 px-4 pt-16 sm:pt-20 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="octa-bevel-shell w-full max-w-2xl border border-[#d6b46c]/55 bg-gradient-to-b from-[#0b0f1b] via-[#070910] to-[#05060b] p-5 sm:p-6 shadow-[0_25px_90px_rgba(0,0,0,0.95)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#d6b46c]/25 pb-3">
          <div className="flex items-center gap-3 flex-1">
            <SearchLensIcon className="h-5 w-5 shrink-0 text-[#d6b46c]" />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Worlds, Taurat/Zabur/Injīl/Al-Qur’ān, Attributes, SRGBL v8..."
              aria-label="Search query"
              className="font-sans w-full bg-transparent text-sm sm:text-base text-[#fff6df] placeholder-[#a79d86] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Search"
            className="min-h-[44px] min-w-[44px] border border-[#d6b46c]/35 px-3 py-1 text-[11px] font-mono text-[#d6b46c] hover:border-[#f8eac6] hover:text-[#fff6df] transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="mt-5 max-h-[65vh] overflow-y-auto space-y-5 pr-1">
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
                  className="min-h-[44px] flex items-center gap-3 border border-[#d6b46c]/20 bg-[#0b0e18] p-3 text-left hover:border-[#e6c987] hover:bg-[#d6b46c]/12 transition-colors cursor-pointer"
                >
                  <WorldEmblemById worldId={worldEntry.id} className="h-8 w-8 shrink-0" />
                  <div>
                    <div className="font-monument text-sm tracking-[0.14em] text-[#fff6df]">
                      {worldEntry.name}
                    </div>
                    <div className="font-sans text-[11px] text-[#cfc5b0]">{worldEntry.tagline}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {onJumpToRemembrance && (
            <div>
              <div className="text-[11px] font-mono tracking-[0.22em] text-[#d6b46c] uppercase">
                FOUR REVEALED SCRIPTURES ({matchingScriptures.length})
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {matchingScriptures.map((corpus) => (
                  <button
                    key={corpus.code}
                    type="button"
                    onClick={() => {
                      onNavigateToDoor("epistemic-corpus");
                      onClose();
                    }}
                    className="min-h-[44px] border border-[#d6b46c]/20 bg-[#0b0e18] p-3 text-left hover:border-[#e6c987] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#dfc07b]">
                      <span>{corpus.code}</span>
                      <span>{corpus.prophetAnchor}</span>
                    </div>
                    <div className="font-monument mt-0.5 text-xs tracking-[0.1em] text-[#fff6df]">
                      {corpus.name}
                    </div>
                    <div className="font-sans text-[11px] text-[#cfc5b0] truncate">
                      {corpus.ethicalCore}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {onJumpToRemembrance && (
            <div>
              <div className="text-[11px] font-mono tracking-[0.22em] text-[#d6b46c] uppercase">
                CONTEMPLATIVE ATTRIBUTES ({matchingNames.length})
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {matchingNames.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      onJumpToRemembrance();
                      onClose();
                    }}
                    className="min-h-[44px] border border-[#d6b46c]/20 bg-[#0b0e18] p-3 text-left hover:border-[#e6c987] hover:bg-[#d6b46c]/12 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span dir="rtl" lang="ar" className="text-base text-[#fff4d2]">
                        {entry.arabic}
                      </span>
                      <span className="font-mono text-[10px] text-[#dfc07b]">
                        {entry.worldLabel.split("·")[0]?.trim()}
                      </span>
                    </div>
                    <div className="font-monument mt-1 text-xs tracking-[0.1em] text-[#fff6df]">
                      {entry.transliteration}
                    </div>
                    <div className="font-sans text-[11px] text-[#cfc5b0] truncate">
                      {entry.meaning}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[11px] font-mono tracking-[0.22em] text-[#d6b46c] uppercase">
              CANON CODEX DOORS ({matchingCodex.length})
            </div>
            <div className="mt-2 space-y-2">
              {matchingCodex.map((codexItem) => (
                <button
                  key={codexItem.id}
                  type="button"
                  onClick={() => {
                    onNavigateToDoor(codexItem.doorId);
                    onClose();
                  }}
                  className="min-h-[44px] w-full border border-[#d6b46c]/20 bg-[#0b0e18] p-3 text-left hover:border-[#e6c987] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#d6b46c]">
                    <span>{codexItem.category}</span>
                    <span>{codexItem.repoSource}</span>
                  </div>
                  <div className="font-monument mt-0.5 text-xs sm:text-sm text-[#fff6df]">
                    {codexItem.title}
                  </div>
                  <p className="font-serif mt-0.5 text-xs text-[#cfc5b0]">{codexItem.subtitle}</p>
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
                  className="min-h-[44px] w-full border border-[#d6b46c]/15 bg-[#0b0e18] p-3 text-left hover:border-[#d6b46c]/45 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[#d6b46c]">
                    <span>{axiomRecord.discipline}</span>
                    <span>{axiomRecord.geometricRatio}</span>
                  </div>
                  <div className="font-monument mt-0.5 text-xs sm:text-sm text-[#fff6df]">
                    {axiomRecord.title}
                  </div>
                  <p className="font-serif mt-0.5 text-xs text-[#cfc5b0] line-clamp-2">
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
