"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export type DeckMode = "overview" | "vault" | "queue" | "knowledge";
type Theme = "dark" | "light";
type MemorySkin = "archive" | "technical" | "editorial" | "riot";
const MEMORY_SKINS: readonly MemorySkin[] = ["archive", "technical", "editorial", "riot"];
const MEMORY_SKIN_STORAGE_KEY = "mw-memory-skin";

type Props = {
  activeMode: DeckMode;
  onModeChange: (mode: DeckMode) => void;
  modeCounts: Partial<Record<DeckMode, number>>;
  apiOnline: boolean | null;
  lastUpdated: string | null;
  theme: Theme;
  onToggleTheme: () => void;
  authControl?: ReactNode;
  loadControl: ReactNode;
  apiDocsHref: string;
  transport: ReactNode;
  children: ReactNode;
};

const modes: Array<{ id: DeckMode; index: string; label: string; detail: string; icon: IconName }> =
  [
    { id: "overview", index: "01", label: "Deck", detail: "Overview", icon: "grid" },
    { id: "vault", index: "02", label: "Tape library", detail: "Archives", icon: "archive" },
    { id: "queue", index: "03", label: "Transfer", detail: "Work queue", icon: "activity" },
    { id: "knowledge", index: "04", label: "Memory index", detail: "Knowledge", icon: "brain" },
  ];

export function MemoryDeckShell({
  activeMode,
  onModeChange,
  modeCounts,
  apiOnline,
  lastUpdated,
  theme,
  onToggleTheme,
  authControl,
  loadControl,
  apiDocsHref,
  transport,
  children,
}: Props) {
  const [skin, setSkin] = useState<MemorySkin>("archive");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MEMORY_SKIN_STORAGE_KEY) as MemorySkin | null;
      if (saved && MEMORY_SKINS.includes(saved)) {
        setSkin(saved);
        document.documentElement.dataset.skin = saved;
      } else {
        document.documentElement.dataset.skin = "archive";
      }
    } catch {
      document.documentElement.dataset.skin = "archive";
    }
  }, []);

  function cycleSkin() {
    const next = MEMORY_SKINS[(MEMORY_SKINS.indexOf(skin) + 1) % MEMORY_SKINS.length] ?? "archive";
    setSkin(next);
    try {
      document.documentElement.dataset.skin = next;
      window.localStorage.setItem(MEMORY_SKIN_STORAGE_KEY, next);
    } catch {
      // ignore storage errors in restricted environments
    }
  }

  return (
    <div className="memory-deck">
      <a className="skip-link" href="#active-workspace">
        Skip to active workspace
      </a>
      <header className="deck-fascia">
        <div className="deck-brand">
          <span className="deck-brand__mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
              <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="11" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="21" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
              <line x1="14" y1="16" x2="18" y2="16" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
          <span className="deck-brand__type">
            <strong>MOONWITNESS</strong>
            <small>HOW U REMIND ME / MEMORY DECK</small>
          </span>
        </div>

        <div className="deck-fascia__status">
          <span
            className={
              "deck-power" + (apiOnline === false ? " is-offline" : apiOnline ? " is-online" : "")
            }
          >
            <i aria-hidden="true" />
            <span>API {apiOnline ? "ONLINE" : apiOnline === false ? "OFFLINE" : "CHECKING"}</span>
          </span>
          <span className="deck-fascia__sync">
            {lastUpdated ? "LAST READ " + lastUpdated : "WAITING FOR API"}
          </span>
        </div>

        <div className="deck-fascia__actions">
          {authControl}
          {loadControl}
          <button
            className="deck-icon-button"
            type="button"
            onClick={cycleSkin}
            aria-label={`Memory skin preset (${skin})`}
            title={`Skin: ${skin} — click to cycle`}
          >
            <span style={{ fontSize: "10px", fontFamily: "var(--mono-type)", fontWeight: 700 }}>
              {skin.slice(0, 4).toUpperCase()}
            </span>
          </button>
          <button
            className="deck-icon-button"
            type="button"
            onClick={onToggleTheme}
            aria-label={"Switch to " + (theme === "dark" ? "light" : "dark") + " theme"}
            title={"Switch to " + (theme === "dark" ? "light" : "dark") + " theme"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          <a
            className="deck-icon-button"
            href={apiDocsHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Open API documentation"
            title="Open API documentation"
          >
            <Icon name="terminal" size={17} />
          </a>
        </div>
      </header>

      <nav className="deck-mode-switcher" aria-label="Memory deck modes">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className={"deck-mode" + (activeMode === mode.id ? " is-active" : "")}
            type="button"
            aria-pressed={activeMode === mode.id}
            onClick={() => onModeChange(mode.id)}
          >
            <span className="deck-mode__index">{mode.index}</span>
            <Icon name={mode.icon} size={18} />
            <span className="deck-mode__label">{mode.label}</span>
            <span className="deck-mode__detail">{mode.detail}</span>
            {modeCounts[mode.id] !== undefined && (
              <span className="deck-mode__count">{modeCounts[mode.id]?.toLocaleString()}</span>
            )}
          </button>
        ))}
      </nav>

      <section
        className="crt-frame"
        id="active-workspace"
        aria-label={modes.find((mode) => mode.id === activeMode)?.label + " workspace"}
      >
        <div className="crt-frame__brandline">
          <span>MW / 01</span>
          <span>LOCAL MEMORY SYSTEM</span>
          <span
            className={
              "crt-frame__signal" +
              (apiOnline ? " is-online" : apiOnline === false ? " is-offline" : "")
            }
          >
            <i aria-hidden="true" />{" "}
            {apiOnline ? "API CONNECTED" : apiOnline === false ? "API UNAVAILABLE" : "CHECKING API"}
          </span>
        </div>
        <div className="crt-screen">
          <div className="crt-screen__scanlines" aria-hidden="true" />
          <div className="crt-screen__content">{children}</div>
        </div>
      </section>

      <footer className="deck-transport-bay">
        <div className="deck-transport-bay__mark">
          <span>SOUNDTRACK / 01</span>
          <strong>Now on the deck</strong>
        </div>
        {transport}
      </footer>

      <div className="deck-case-foot" aria-hidden="true">
        <span>LOCAL ARCHIVE / SOURCE-LINKED MEMORY</span>
        <span>MOONWITNESS · HOW U REMIND ME</span>
      </div>
    </div>
  );
}
