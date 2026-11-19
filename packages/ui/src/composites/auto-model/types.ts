import type { ComponentType } from "react";
import type { CutoutArtworkId } from "../../artwork/cutouts";
import {
  ArsyRelay,
  MemoryTapeNode,
  MtimeHorizon,
  MyceliumSpore,
  RadiusKey,
  ScriptureFolio,
  SimpulNode,
  SkinPalette,
  SnmpProbe,
  StorageBucket,
  SyslogStream,
  VpnTunnel,
} from "../../icons/modules";
import type { DnaIconProps } from "../../icons/types";
import type { SkinName } from "../../skin";

export type AutoModelFieldType =
  "text" | "textarea" | "number" | "integer" | "boolean" | "select" | "date" | "tags";

export interface AutoModelFieldSpec {
  readonly name: string;
  readonly label: string;
  readonly type: AutoModelFieldType;
  readonly required?: boolean;
  readonly readonly?: boolean;
  readonly selection?: readonly string[];
  readonly isCustom?: boolean;
  readonly placeholder?: string;
}

export interface AutoModelAcl {
  readonly canRead: boolean;
  readonly canCreate: boolean;
  readonly canUpdate: boolean;
  readonly canDelete: boolean;
}

export interface AutoModelViewDescriptor {
  readonly model: string;
  readonly title?: string;
  readonly description?: string;
  readonly domainIcon?: string;
  readonly cutoutId?: CutoutArtworkId;
  readonly fields: readonly AutoModelFieldSpec[];
  /** Ordered subset of field names shown in list mode (ir.view spec.columns). */
  readonly columns?: readonly string[];
  readonly defaultViewMode?: "list" | "kanban";
  readonly acl?: Partial<AutoModelAcl>;
}

export interface AutoModelHistoryEntry {
  readonly id: string;
  readonly action: string;
  readonly changed_by: string | null;
  readonly changed_at: string;
  readonly entity_version: number;
}

export interface AutoModelRow extends Record<string, unknown> {
  readonly id: string;
  readonly _attrs?: Record<string, unknown>;
  readonly status?: string;
  readonly version?: number;
}

export interface AutoModelCustomAction {
  readonly id: string;
  readonly label: string;
  readonly onTrigger: (id: string) => Promise<void> | void;
}

export interface AutoModelViewProps {
  descriptor: AutoModelViewDescriptor;
  rows: readonly AutoModelRow[];
  loading?: boolean;
  error?: string | null;
  onCreate?: (values: Record<string, unknown>) => Promise<void> | void;
  onUpdate?: (id: string, values: Record<string, unknown>) => Promise<void> | void;
  onArchive?: (id: string) => Promise<void> | void;
  onRestore?: (id: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  customActions?: readonly AutoModelCustomAction[];
  onInspectHistory?: (id: string) => Promise<readonly AutoModelHistoryEntry[]>;
  className?: string;
  skin?: SkinName;
}

export const DOMAIN_ICON_MAP: Record<string, ComponentType<DnaIconProps>> = {
  vpn: VpnTunnel,
  syslog: SyslogStream,
  snmp: SnmpProbe,
  storage: StorageBucket,
  radius: RadiusKey,
  mtime: MtimeHorizon,
  scripture: ScriptureFolio,
  memory: MemoryTapeNode,
  arsy: ArsyRelay,
  simpul: SimpulNode,
  mycelium: MyceliumSpore,
  skin: SkinPalette,
};

export function resolveFieldValue(row: AutoModelRow, field: AutoModelFieldSpec): unknown {
  if (field.isCustom && row._attrs && field.name in row._attrs) {
    return row._attrs[field.name];
  }
  return row[field.name];
}

export function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}
