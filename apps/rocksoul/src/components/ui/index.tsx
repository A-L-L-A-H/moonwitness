// ROCKSOUL DX — Reusable UI Components
// React wrappers around design-system primitives

import React from "react";
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

// === BUTTON ===
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "icon";
  size?: "sm" | "base" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "base",
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = "left",
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const classNames = [
      "rs-btn",
      `rs-btn--${variant}`,
      size !== "base" && `rs-btn--${size}`,
      fullWidth && "rs-btn--full",
      loading && "rs-btn--loading",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classNames} disabled={disabled || loading} {...props}>
        {loading ? (
          <span className="rs-btn__spinner" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
              </path>
            </svg>
          </span>
        ) : (
          <>
            {icon && iconPosition === "left" && <span className="rs-btn__icon" aria-hidden="true">{icon}</span>}
            <span className="rs-btn__text">{children}</span>
            {icon && iconPosition === "right" && <span className="rs-btn__icon" aria-hidden="true">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

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

// === CARD ===
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "panel" | "elevated";
  header?: React.ReactNode;
  headerVariant?: "default" | "cream" | "pink" | "purple";
  footer?: React.ReactNode;
}

export function Card({ variant = "default", header, headerVariant = "default", footer, className = "", children, ...props }: CardProps) {
  const classNames = ["rs-card", variant !== "default" && `rs-card--${variant}`, className].filter(Boolean).join(" ");

  return (
    <div className={classNames} {...props}>
      {header && (
        <div className={`rs-card__header ${headerVariant !== "default" ? `rs-card__header--${headerVariant}` : ""}`}>
          {header}
        </div>
      )}
      <div className="rs-card__body">{children}</div>
      {footer && <div className="rs-card__footer">{footer}</div>}
    </div>
  );
}

// === INPUT ===
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || React.useId();
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={`rs-field ${className}`}>
        {label && <label htmlFor={inputId} className="rs-field__label">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={`rs-input ${error ? "rs-input--error" : ""}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
        {error && <p id={errorId} className="rs-field__error" role="alert">{error}</p>}
        {helperText && !error && <p id={helperId} className="rs-field__helper">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

// === SELECT ===
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || React.useId();
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className={`rs-field ${className}`}>
        {label && <label htmlFor={selectId} className="rs-field__label">{label}</label>}
        <select ref={ref} id={selectId} className={`rs-select ${error ? "rs-select--error" : ""}`} aria-invalid={error ? "true" : "false"} aria-describedby={errorId} {...props}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p id={errorId} className="rs-field__error" role="alert">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

// === TEXTAREA ===
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const textareaId = id || React.useId();
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;

    return (
      <div className={`rs-field ${className}`}>
        {label && <label htmlFor={textareaId} className="rs-field__label">{label}</label>}
        <textarea
          ref={ref}
          id={textareaId}
          className={`rs-input rs-textarea ${error ? "rs-input--error" : ""}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
        {error && <p id={errorId} className="rs-field__error" role="alert">{error}</p>}
        {helperText && !error && <p id={helperId} className="rs-field__helper">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

// === BADGE ===
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "priority" | "status" | "lime" | "orange";
  priority?: "p0" | "p1" | "p2" | "p3";
  status?: "open" | "blocked" | "done";
}

export function Badge({ variant = "default", priority, status, className = "", children, ...props }: BadgeProps) {
  const classNames = [
    "rs-badge",
    variant !== "default" && `rs-badge--${variant}`,
    priority && `rs-badge--priority ${priority}`,
    status && `rs-badge--status ${status}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classNames} {...props}>{children}</span>;
}

// === SKIP LINK ===
export function SkipLink({ href = "#main-content", children = "Skip to main content" }: { href?: string; children?: string }) {
  return <a href={href} className="rs-skip-link">{children}</a>;
}

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

export function UniverseCopy({ kicker = "THE LIVING UNIVERSE / ENTRY 01", subtitle = "A PRIVATE DESKTOP WORLD FOR REAL WORK", manifesto = [
  "01 — NO CLUE WHAT'S COMING.",
  "02 — NO IDEA HOW THIS ENDS.",
  "03 — COULD BE RIGHT. COULD BE WRONG.",
  "04 — BUT I KNOW WHO SAID: \"I'LL FINISH IT.\""
] }: UniverseCopyProps) {
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
}

export function Awakening({ onEnter, reducedMotion }: AwakeningProps) {
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
  const thumbArt = DISTRICT_THUMBNAILS[roomDistrict];

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
            {thumbArt && (
              <div className="room-viewport-inset">
                <img src={thumbArt} alt="" />
              </div>
            )}
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