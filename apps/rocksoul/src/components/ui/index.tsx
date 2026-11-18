// ROCKSOUL DX — Reusable UI Components
// React wrappers around design-system primitives

import React from "react";
import { OWNER_FOUR_LINE_MANIFESTO } from "@moonwitness/canon";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  FileText,
  Layers3,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { DISTRICT_THUMBNAILS, ROOM_SCENE_ART, thumbRiotUrl, type ArtworkDistrictId } from "../../assets/art";
import { IllustratedStage } from "./IllustratedStage";
import {
  AnarchyStarSigil,
  CrimsonBrushSlash,
  CrimsonCrownSvg,
  SprayTagGlyph,
  TelemetryWaveformSvg,
  VectorBarcodeStamp,
} from "./RocksoulVectors";

// === ICON BUTTON ===
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  children: React.ReactNode;
  size?: "sm" | "base" | "lg";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ "aria-label": ariaLabel, children, size = "base", className = "", ...props }, ref) => {
    const classNames = ["rs-btn rs-btn--icon", size !== "base" && `rs-btn--${size}`, className].filter(Boolean).join(" ");

    return (
      <button ref={ref} className={classNames} aria-label={ariaLabel} {...props}>
        <span className="rs-btn__icon" aria-hidden="true">{children}</span>
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

// === MOTION CONTROL ===
export interface MotionControlProps {
  reducedMotion: boolean;
  systemReducedMotion: boolean;
  onToggle: () => void;
}

export function MotionControl({ reducedMotion, systemReducedMotion, onToggle }: MotionControlProps) {
  return (
    <button
      className="world-motion-control"
      type="button"
      aria-pressed={reducedMotion}
      disabled={systemReducedMotion}
      title={systemReducedMotion ? "Reduced motion is required by the system preference." : undefined}
      onClick={onToggle}
    >
      <span className="world-motion-dot" aria-hidden="true" />
      {systemReducedMotion ? "LOW MOTION / SYSTEM" : `LOW MOTION ${reducedMotion ? "ON" : "OFF"}`}
    </button>
  );
}

// === SEARCH INPUT ===
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: ((value: string) => void) | undefined;
  placeholder?: string | undefined;
  "aria-label"?: string | undefined;
}

export function SearchInput({ value, onChange, onSubmit, placeholder = "Search...", "aria-label": ariaLabel = "Search" }: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSubmit) {
      e.preventDefault();
      onSubmit(value);
    }
    if (e.key === "Escape") {
      onChange("");
    }
  };

  return (
    <label className="world-search" htmlFor="world-search-input">
      <span className="world-search-label" aria-hidden="true">FIND</span>
      <input
        id="world-search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </label>
  );
}

// === UNIVERSE HEADER ===
export interface UniverseHeaderProps {
  onSettings?: (() => void) | undefined;
  onToggleMotion?: (() => void) | undefined;
  reducedMotion?: boolean | undefined;
  systemReducedMotion?: boolean | undefined;
  searchValue?: string | undefined;
  onSearchChange?: ((value: string) => void) | undefined;
  onSearchSubmit?: ((value: string) => void) | undefined;
}

export function UniverseHeader({
  onSettings,
  onToggleMotion,
  reducedMotion,
  systemReducedMotion,
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: UniverseHeaderProps) {
  return (
    <header className="universe-header">
      <a href="#universe-destinations" className="universe-brand" aria-label="ROCKSOUL DX, destinations">
        <span className="universe-brand-mark" aria-hidden="true">
          <AnarchyStarSigil />
        </span>
        <span className="universe-brand-copy">ROCKSOUL <b>DX</b><small>THE LIVING UNIVERSE</small></span>
      </a>
      <SearchInput
        value={searchValue || ""}
        onChange={onSearchChange || (() => {})}
        onSubmit={onSearchSubmit}
        placeholder="Search destinations"
        aria-label="Search destinations"
      />
      <div className="universe-header-actions">
        <span className="universe-local-state"><i aria-hidden="true" /> PRIVATE / LOCAL</span>
        {onSettings && <IconButton aria-label="Open settings" onClick={onSettings}><Settings size={16} /></IconButton>}
        {onToggleMotion && <MotionControl reducedMotion={reducedMotion || false} systemReducedMotion={systemReducedMotion || false} onToggle={onToggleMotion} />}
      </div>
    </header>
  );
}

// === UNIVERSE FOOTER ===
export interface UniverseFooterProps {
  onNavigate?: ((destination: string) => void) | undefined;
}

export function UniverseFooter({ onNavigate }: UniverseFooterProps) {
  const destinations = [
    { id: "archive", index: "01", title: "ARCHIVE" },
    { id: "studio", index: "02", title: "STUDIO" },
    { id: "riot-deck", index: "03", title: "RIOT DECK" },
    { id: "signal-room", index: "04", title: "SIGNAL ROOM" },
  ];

  return (
    <footer className="universe-footer">
      <span><strong>ROCKSOUL DX</strong> / LOCAL DESKTOP</span>
      <nav className="universe-footer-nav" aria-label="Direct destination links">
        {destinations.map((d) => (
          <button key={d.id} type="button" onClick={() => onNavigate?.(d.id)}>
            {d.index} {d.title}
          </button>
        ))}
      </nav>
      <div className="universe-footer-meta">
        <span>NO MAP / FOUR ROOMS</span>
        <VectorBarcodeStamp />
      </div>
    </footer>
  );
}

// === WORLD HEADER ===
export interface WorldHeaderProps {
  onReturn?: (() => void) | undefined;
  onToggleMotion?: (() => void) | undefined;
  reducedMotion?: boolean | undefined;
  systemReducedMotion?: boolean | undefined;
  note?: string | undefined;
}

export function WorldHeader({ onReturn, onToggleMotion, reducedMotion, systemReducedMotion, note }: WorldHeaderProps) {
  return (
    <header className="world-header">
      {onReturn && (
        <button className="world-wordmark world-wordmark-button" type="button" onClick={onReturn}>
          <span className="wordmark-mark" aria-hidden="true"><AnarchyStarSigil /></span>
          <span className="world-wordmark-copy">ROCKSOUL <b>DX</b><small>THE LIVING UNIVERSE</small></span>
        </button>
      )}
      {note && <span className="world-header-note">{note}</span>}
      {onToggleMotion && <MotionControl reducedMotion={reducedMotion || false} systemReducedMotion={systemReducedMotion || false} onToggle={onToggleMotion} />}
    </header>
  );
}

// === ROOM CONTEXT BAR ===
export interface RoomContextBarProps {
  onReturn: () => void;
  title: string;
  onToggleMotion?: (() => void) | undefined;
  reducedMotion?: boolean | undefined;
  systemReducedMotion?: boolean | undefined;
}

export function RoomContextBar({ onReturn, title, onToggleMotion, reducedMotion, systemReducedMotion }: RoomContextBarProps) {
  return (
    <div className="room-context-bar">
      <button className="room-home-link" type="button" onClick={onReturn}>
        <ArrowLeft size={15} aria-hidden="true" /> THE THRESHOLD
      </button>
      <span className="room-context-title">{title}</span>
      {onToggleMotion && <MotionControl reducedMotion={reducedMotion || false} systemReducedMotion={systemReducedMotion || false} onToggle={onToggleMotion} />}
    </div>
  );
}

// === DESTINATION CARD (for Threshold) ===
export interface DestinationCardProps {
  id: string;
  title: string;
  note: string;
  index: string;
  icon: React.ReactNode;
  preview?: boolean;
  isSelected?: boolean;
  onClick: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function DestinationCard({
  id,
  title,
  note,
  index,
  icon,
  preview,
  isSelected,
  onClick,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
}: DestinationCardProps) {
  const thumbUrl = DISTRICT_THUMBNAILS[id as ArtworkDistrictId];
  return (
    <button
      className={`universe-destination${isSelected ? " is-selected" : ""}${!preview ? " is-primary-workspace" : ""}`}
      type="button"
      id={`destination-${id}`}
      aria-label={`Enter ${title}${preview ? " room preview" : ""}`}
      onClick={onClick}
      onFocus={onFocus}
      onBlur={onBlur}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {thumbUrl && (
        <span className="universe-destination-thumb" aria-hidden="true">
          <img src={thumbUrl} alt="" />
          <span className="universe-destination-index">{index}</span>
        </span>
      )}
      <span className="universe-destination-body">
        <span className="universe-destination-head">
          <span className="universe-destination-icon" aria-hidden="true">{icon}</span>
          <em>{preview ? "ROOM PREVIEW" : "WORKSPACE"}</em>
        </span>
        <strong>{title}</strong>
        <small>{note}</small>
      </span>
    </button>
  );
}

// === RECENT WORK ===
export interface RecentWorkProps {
  issue?: { title: string; issue_key: string } | null | undefined;
  hasLoaded: boolean;
  loading: boolean;
  error?: string | null | undefined;
  onNavigate?: ((destination: string) => void) | undefined;
  onCreateIssue?: (() => void) | undefined;
}

export function RecentWork({ issue, hasLoaded, loading, error, onNavigate, onCreateIssue }: RecentWorkProps) {
  const ready = hasLoaded && !loading && !error;

  return (
    <section className="universe-recent" aria-label="Recent work">
      <div className="universe-recent-header">
        <h2>RECENT WORK</h2>
        <TelemetryWaveformSvg className="rs-waveform-mini" />
      </div>
      {issue ? (
        <button type="button" onClick={() => onNavigate?.("riot-deck")}>
          <span className="universe-recent-thumb" aria-hidden="true">
            <img src={thumbRiotUrl} alt="" />
          </span>
          <span className="universe-recent-icon"><FileText size={15} aria-hidden="true" /></span>
          <span className="universe-recent-text"><strong>{issue.title}</strong><small>{issue.issue_key}</small></span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </button>
      ) : (
        <button type="button" onClick={ready ? onCreateIssue : undefined} disabled={!ready}>
          <span className="universe-recent-thumb" aria-hidden="true">
            <img src={thumbRiotUrl} alt="" />
          </span>
          <span className="universe-recent-icon"><FileText size={15} aria-hidden="true" /></span>
          <span className="universe-recent-text"><strong>{ready ? "NO RECENT WORK" : "LOADING LOCAL WORK"}</strong><small>{ready ? "Create an issue in the Riot Deck" : "Reading this device"}</small></span>
          {ready && <Plus size={15} aria-hidden="true" />}
        </button>
      )}
    </section>
  );
}

// === COMMAND BAR ===
export interface CommandBarProps {
  onNavigate?: ((destination: string) => void) | undefined;
  onCreateIssue?: (() => void) | undefined;
}

export function CommandBar({ onNavigate, onCreateIssue }: CommandBarProps) {
  return (
    <>
      <span className="universe-command-mark" aria-hidden="true"><Sparkles size={20} /></span>
      <button className="universe-action" type="button" onClick={() => onNavigate?.("riot-deck")}>
        <span><strong>WHAT ARE WE MAKING TODAY?</strong><small>ENTER THE UNKNOWN / OPEN THE RIOT DECK</small></span>
        <ArrowUpRight size={21} aria-hidden="true" />
      </button>
      {onCreateIssue && (
        <button className="universe-command-tool" type="button" aria-label="Create an issue" title="Create an issue" onClick={onCreateIssue}>
          <Plus size={17} aria-hidden="true" />
        </button>
      )}
    </>
  );
}

// === UNIVERSE SPRAY ===
export function UniverseSpray() {
  return (
    <div className="universe-spray" aria-hidden="true">
      <SprayTagGlyph />
      <span>NOISE × SILENCE</span>
      <small>THE LIVING UNIVERSE</small>
      <em className="universe-spray-sub">FIND ME IN EVERYTHING</em>
    </div>
  );
}

// === UNIVERSE COPY (Threshold hero) ===
export interface UniverseCopyProps {
  kicker?: string;
  title?: string;
  subtitle?: string;
  manifesto?: string[];
}

const CANON_MANIFESTO_LINES = OWNER_FOUR_LINE_MANIFESTO.map(
  (entry) => `${entry.index} — ${entry.line}`,
);

export function UniverseCopy({ kicker = "THE LIVING UNIVERSE / ENTRY 01", subtitle = "A PRIVATE DESKTOP WORLD FOR REAL WORK", manifesto = CANON_MANIFESTO_LINES }: UniverseCopyProps) {
  return (
    <>
      <div className="universe-title-lockup">
        <p className="world-kicker">{kicker}</p>
        <CrimsonCrownSvg className="rs-crown-svg universe-crown" />
        <h1 id="threshold-title">ROCKSOUL <em>DX</em></h1>
        <CrimsonBrushSlash className="rs-brush-slash universe-slash" />
      </div>
      <p className="universe-subtitle">{subtitle}</p>
      <div className="universe-manifesto" aria-label="ROCKSOUL manifesto">
        {manifesto.map((line, i) => (
          <p key={i} className={i === manifesto.length - 1 ? "manifesto-climax" : ""}>{line}</p>
        ))}
      </div>
    </>
  );
}

// === AWAKENING COMPONENT ===
export interface AwakeningProps {
  onEnter: () => void;
  reducedMotion: boolean;
  onQuickWorkbench?: (() => void) | undefined;
  onQuickMonitor?: (() => void) | undefined;
}

export function Awakening({ onEnter, reducedMotion, onQuickWorkbench, onQuickMonitor }: AwakeningProps) {
  const [opening, setOpening] = React.useState(false);
  const entryTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (entryTimer.current) window.clearTimeout(entryTimer.current);
  }, []);

  const beginEntry = () => {
    if (opening) return;
    setOpening(true);
    if (reducedMotion) {
      onEnter();
      return;
    }
    entryTimer.current = window.setTimeout(onEnter, 620);
  };

  return (
    <main className="universe-screen awakening-screen" data-reduced-motion={reducedMotion} data-opening={opening}>
      <IllustratedStage scene="awakening" destination="awakening" reducedMotion={reducedMotion} />

      <header className="awakening-header">
        <span className="awakening-mark" aria-hidden="true"><AnarchyStarSigil /></span>
        <span>ROCKSOUL DX <small>— THE LIVING UNIVERSE</small></span>
      </header>

      <section className="awakening-copy" aria-labelledby="awakening-title">
        <div className="awakening-title-lockup">
          <p className="awakening-kicker">A PRIVATE DESKTOP WORLD FOR REAL WORK</p>
          <CrimsonCrownSvg className="rs-crown-svg awakening-crown" />
          <h1 id="awakening-title">ROCKSOUL <em>DX</em></h1>
        </div>
        <p className="awakening-subtitle">THE LIVING UNIVERSE</p>
        <div className="awakening-claim-wrap">
          <p className="awakening-claim">NO CLUE WHAT&apos;S COMING.</p>
          <CrimsonBrushSlash className="rs-brush-slash awakening-slash" />
        </div>
        <button className="awakening-enter" type="button" onClick={beginEntry} disabled={opening}>
          <span>{opening ? "THE GATE IS OPENING" : "ENTER THE UNKNOWN"}</span>
          <ArrowRight size={20} aria-hidden="true" />
        </button>
        {(onQuickWorkbench || onQuickMonitor) && (
          <div className="awakening-quick-actions">
            {onQuickWorkbench && (
              <button
                type="button"
                className="awakening-quick-btn"
                onClick={onQuickWorkbench}
                disabled={opening}
              >
                DIRECT WORKBENCH
              </button>
            )}
            {onQuickMonitor && (
              <button
                type="button"
                className="awakening-quick-btn"
                onClick={onQuickMonitor}
                disabled={opening}
              >
                AGENT MONITOR
              </button>
            )}
          </div>
        )}
        <div className="awakening-manifesto" aria-label="ROCKSOUL manifesto">
          <p>01 — NO CLUE WHAT&apos;S COMING.</p>
          <p>02 — NO IDEA HOW THIS ENDS.</p>
          <p>03 — COULD BE RIGHT. COULD BE WRONG.</p>
          <p>04 — BUT I KNOW WHO SAID: <em>"I&apos;LL FINISH IT."</em></p>
        </div>
      </section>

      <aside className="awakening-spray" aria-hidden="true">
        <SprayTagGlyph />
        <span>NOISE × SILENCE</span>
        <em>FIND ME IN EVERYTHING</em>
      </aside>

      <footer className="awakening-footer">
        <span>ROCKSOUL DX / LOCAL DESKTOP</span>
        <span>NOISE × SILENCE — FOR THOSE WHO NEVER STOP.</span>
        <VectorBarcodeStamp />
      </footer>
    </main>
  );
}

// === PREVIEW ROOM ===
export interface PreviewRoomProps {
  roomId: string;
  onReturn: () => void;
  onNavigate: (destination: string) => void;
  reducedMotion: boolean;
  systemReducedMotion: boolean;
  onToggleMotion: () => void;
}

const previewRooms = {
  archive: {
    title: "THE ARCHIVE",
    label: "A PLACE FOR WHAT SHOULD NOT BE LOST.",
    description: "A room for sources, notes, and retrievable fragments.",
    preview: "Archive workflows are not part of this visual foundation.",
    symbol: Archive,
    index: "01",
  },
  studio: {
    title: "THE STUDIO",
    label: "A PLACE TO SHAPE THE UNFINISHED.",
    description: "A room for writing, experiments, and authored work.",
    preview: "Studio workflows are not part of this visual foundation.",
    symbol: Layers3,
    index: "02",
  },
  "signal-room": {
    title: "THE SIGNAL ROOM",
    label: "A PLACE TO FOLLOW A QUESTION.",
    description: "A room for research, discovery, and connected ideas.",
    preview: "Research workflows are not part of this visual foundation.",
    symbol: AudioLines,
    index: "04",
  },
};

export function PreviewRoom({ roomId, onReturn, onNavigate, reducedMotion, systemReducedMotion, onToggleMotion }: PreviewRoomProps) {
  const room = previewRooms[roomId as keyof typeof previewRooms];
  if (!room) return null;
  const Icon = room.symbol;
  const roomDistrict = roomId as ArtworkDistrictId;
  const sceneArt = ROOM_SCENE_ART[roomDistrict];

  return (
    <main className={`living-universe preview-room preview-room--${roomId}`} data-reduced-motion={reducedMotion}>
      <IllustratedStage scene={roomDistrict} destination={roomDistrict} reducedMotion={reducedMotion} />
      <WorldHeader onReturn={onReturn} onToggleMotion={onToggleMotion} reducedMotion={reducedMotion} systemReducedMotion={systemReducedMotion} note="ROOM  /  PREVIEW" />

      <section className="preview-room-stage" aria-labelledby="preview-room-title">
        <div className="preview-room-copy">
          <p className="world-kicker"><span /> DESTINATION / {room.index}</p>
          <h1 id="preview-room-title">{room.title}</h1>
          <p className="preview-room-label">{room.label}</p>
          <p className="preview-room-description">{room.description}</p>
          <div className="preview-notice">
            <span>PREVIEW</span>
            <p>{room.preview}</p>
          </div>
          <button className="return-threshold" type="button" onClick={onReturn}>
            <ArrowLeft size={16} aria-hidden="true" /> RETURN TO THE THRESHOLD
          </button>
        </div>

        <div className="preview-room-art" aria-hidden="true">
          <div className="room-viewport-chrome">
            <span className="room-viewport-badge">
              <Icon size={14} strokeWidth={1.8} />
              SECTOR {room.index} / {roomId.toUpperCase()}
            </span>
            <AnarchyStarSigil className="rs-anarchy-sigil room-viewport-sigil" />
          </div>
          <div className="room-viewport-frame">
            <img className="room-scene-artwork" src={sceneArt} alt="" />
            <div className="room-viewport-vignette" />
          </div>
          <div className="room-viewport-telemetry">
            <TelemetryWaveformSvg className="rs-waveform-svg room-telemetry-wave" />
            <span className="room-art-coordinate">WORLD / {roomId.toUpperCase()}</span>
          </div>
        </div>
      </section>

      <nav className="room-destination-nav" aria-label="Choose another destination">
        <button type="button" onClick={onReturn}><ArrowLeft size={14} /> THE THRESHOLD</button>
        {[
          { id: "archive", title: "THE ARCHIVE" },
          { id: "studio", title: "THE STUDIO" },
          { id: "riot-deck", title: "THE RIOT DECK" },
          { id: "signal-room", title: "THE SIGNAL ROOM" },
        ].map((destination) => (
          <button
            key={destination.id}
            className={destination.id === roomId ? "is-current" : ""}
            type="button"
            aria-current={destination.id === roomId ? "page" : undefined}
            onClick={() => onNavigate(destination.id)}
          >
            {destination.title}
          </button>
        ))}
      </nav>
      <footer className="world-footer">
        <span>NOISE × SILENCE</span>
        <span>WORKFLOWS NOT INCLUDED IN THIS PREVIEW.</span>
        <span>ROCKSOUL DX / 0.1</span>
      </footer>
    </main>
  );
}

// === ROOM RETURN BUTTON ===
export interface RoomReturnButtonProps {
  onReturn: () => void;
  reducedMotion: boolean;
  systemReducedMotion: boolean;
  onToggleMotion: () => void;
}

export function RoomReturnButton({ onReturn, reducedMotion, systemReducedMotion, onToggleMotion }: RoomReturnButtonProps) {
  return (
    <div className="room-context-bar">
      <button className="room-home-link" type="button" onClick={onReturn}>
        <ArrowLeft size={15} aria-hidden="true" /> THE THRESHOLD
      </button>
      <span className="room-context-title">DESTINATION / THE RIOT DECK</span>
      <MotionControl reducedMotion={reducedMotion} systemReducedMotion={systemReducedMotion} onToggle={onToggleMotion} />
    </div>
  );
}

// === EXPORTS ===
// CSS is imported globally in src/main.jsx:
//   import "./design-system/tokens.css";
//   import "./design-system/primitives.css";
//   import "./design-system/layout.css";