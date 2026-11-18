"use client";

import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import { CutoutArtwork, type CutoutArtworkId } from "../artwork/cutouts";
import { cn } from "../cn";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { NativeSelect } from "../components/ui/native-select";
import { Textarea } from "../components/ui/textarea";
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
} from "../icons/modules";
import type { DnaIconProps } from "../icons/types";
import { SkinOrnament } from "../primitives/tactile-hardware";
import { useSkin, type SkinName } from "../skin";

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

const DOMAIN_ICON_MAP: Record<string, ComponentType<DnaIconProps>> = {
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

function resolveFieldValue(row: AutoModelRow, field: AutoModelFieldSpec): unknown {
  if (field.isCustom && row._attrs && field.name in row._attrs) {
    return row._attrs[field.name];
  }
  return row[field.name];
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

export function AutoModelView({
  descriptor,
  rows,
  loading = false,
  error = null,
  onCreate,
  onUpdate,
  onArchive,
  onRestore,
  onDelete,
  customActions = [],
  onInspectHistory,
  className,
  skin: explicitSkin,
}: AutoModelViewProps) {
  const { skin: ctxSkin } = useSkin();
  const activeSkin = explicitSkin ?? ctxSkin;
  const acl: AutoModelAcl = {
    canRead: descriptor.acl?.canRead ?? true,
    canCreate: descriptor.acl?.canCreate ?? Boolean(onCreate),
    canUpdate: descriptor.acl?.canUpdate ?? Boolean(onUpdate),
    canDelete: descriptor.acl?.canDelete ?? Boolean(onDelete),
  };

  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [draftValues, setDraftValues] = useState<Record<string, string | boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const DomainIcon = DOMAIN_ICON_MAP[descriptor.domainIcon ?? "arsy"] ?? ArsyRelay;
  const visibleFields = useMemo(() => {
    const wanted = descriptor.columns;
    if (!wanted || wanted.length === 0) return descriptor.fields;
    const ordered = wanted
      .map((name) => descriptor.fields.find((f) => f.name === name))
      .filter((f): f is AutoModelFieldSpec => f !== undefined);
    return ordered.length > 0 ? ordered : descriptor.fields;
  }, [descriptor.columns, descriptor.fields]);
  const groupField = useMemo(
    () =>
      descriptor.fields.find((f) => f.name === "status") ??
      descriptor.fields.find((f) => f.type === "select"),
    [descriptor.fields],
  );
  const [viewMode, setViewMode] = useState<"list" | "kanban">(
    groupField ? (descriptor.defaultViewMode ?? "list") : "list",
  );
  const [historyRowId, setHistoryRowId] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<readonly AutoModelHistoryEntry[]>([]);
  const [historyBusy, setHistoryBusy] = useState(false);

  async function inspectHistory(id: string) {
    if (!onInspectHistory) return;
    if (historyRowId === id) {
      setHistoryRowId(null);
      return;
    }
    setHistoryRowId(id);
    setHistoryBusy(true);
    try {
      setHistoryEntries(await onInspectHistory(id));
    } catch {
      setHistoryEntries([]);
    } finally {
      setHistoryBusy(false);
    }
  }
  const editableFields = useMemo(
    () => descriptor.fields.filter((f) => !f.readonly),
    [descriptor.fields],
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      descriptor.fields.some((field) =>
        formatCellValue(resolveFieldValue(row, field)).toLowerCase().includes(q),
      ),
    );
  }, [rows, query, descriptor.fields]);

  const missingRequired = useMemo(
    () =>
      editableFields.some((field) => {
        if (!field.required) return false;
        const val = draftValues[field.name];
        if (field.type === "boolean") return val === undefined;
        return String(val ?? "").trim().length === 0;
      }),
    [editableFields, draftValues],
  );

  function openCreateForm() {
    const initial: Record<string, string | boolean> = {};
    for (const field of editableFields) {
      initial[field.name] = field.type === "boolean" ? false : "";
    }
    setEditingRowId(null);
    setDraftValues(initial);
    setFormError(null);
    setFormOpen(true);
  }

  function openEditForm(row: AutoModelRow) {
    const initial: Record<string, string | boolean> = {};
    for (const field of editableFields) {
      const val = resolveFieldValue(row, field);
      if (field.type === "boolean") {
        initial[field.name] = Boolean(val);
      } else if (Array.isArray(val)) {
        initial[field.name] = val.join(", ");
      } else {
        initial[field.name] = val === null || val === undefined ? "" : String(val);
      }
    }
    setEditingRowId(row.id);
    setDraftValues(initial);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (missingRequired) {
      setFormError("Fill all required fields before saving.");
      return;
    }

    const payload: Record<string, unknown> = {};
    const customAttrs: Record<string, unknown> = {};
    for (const field of editableFields) {
      const raw = draftValues[field.name];
      let parsed: unknown = raw;
      if (field.type === "integer" || field.type === "number") {
        const str = String(raw ?? "").trim();
        parsed = str === "" ? undefined : Number(str);
        if (parsed !== undefined && Number.isNaN(parsed as number)) {
          setFormError(`Invalid numeric value for ${field.label}.`);
          return;
        }
      } else if (field.type === "tags") {
        parsed = String(raw ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      if (parsed === undefined) continue;
      if (field.isCustom) {
        customAttrs[field.name] = parsed;
      } else {
        payload[field.name] = parsed;
      }
    }
    if (Object.keys(customAttrs).length > 0) {
      payload["_attrs"] = customAttrs;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingRowId && onUpdate) {
        await onUpdate(editingRowId, payload);
      } else if (!editingRowId && onCreate) {
        await onCreate(payload);
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!acl.canRead) {
    return (
      <Card skin={activeSkin} className={cn("p-6 text-center", className)}>
        <CardTitle className="text-base">ACCESS RESTRICTED</CardTitle>
        <CardDescription className="mt-1">
          Insufficient role privileges for model <code>{descriptor.model}</code>.
        </CardDescription>
      </Card>
    );
  }

  return (
    <Card
      skin={activeSkin}
      data-mw-auto-model={descriptor.model}
      className={cn("relative overflow-hidden", className)}
    >
      <SkinOrnament slot="corner" skin={activeSkin} className="right-3 top-3" />
      <CardHeader className="flex flex-col gap-3 border-b border-[var(--border)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--background)]">
            <DomainIcon className="h-5 w-5 text-[var(--primary)]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{descriptor.title ?? descriptor.model}</CardTitle>
              <SkinOrnament slot="tag" skin={activeSkin} label={descriptor.model} />
            </div>
            {descriptor.description ? (
              <CardDescription className="mt-1">{descriptor.description}</CardDescription>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            skin={activeSkin}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${descriptor.title ?? descriptor.model}…`}
            aria-label={`Filter ${descriptor.model}`}
            className="w-48 sm:w-60"
          />
          {groupField ? (
            <Button
              skin={activeSkin}
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={viewMode === "kanban"}
              onClick={() => setViewMode((mode) => (mode === "list" ? "kanban" : "list"))}
            >
              {viewMode === "list" ? "KANBAN" : "LIST"}
            </Button>
          ) : null}
          {acl.canCreate && onCreate ? (
            <Button skin={activeSkin} type="button" size="sm" onClick={openCreateForm}>
              + Create
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {error ? (
          <div
            role="alert"
            className="border border-[var(--destructive)] bg-[var(--destructive)]/10 px-3 py-2 text-xs text-[var(--foreground)]"
          >
            {error}
          </div>
        ) : null}

        {formOpen ? (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-3 border border-[var(--border)] bg-[var(--background)] p-4"
            aria-label={editingRowId ? `Edit ${descriptor.model}` : `Create ${descriptor.model}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider">
                {editingRowId ? `Edit ${descriptor.model}` : `New ${descriptor.model}`}
              </span>
              <Button
                skin={activeSkin}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
            </div>

            {formError ? (
              <div role="alert" className="text-xs text-[var(--destructive)]">
                {formError}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {editableFields.map((field) => {
                const value = draftValues[field.name];
                return (
                  <label key={field.name} className="block space-y-1 text-xs">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--muted-foreground)]">
                      <span>{field.label}</span>
                      {field.required ? <span className="text-[var(--destructive)]">*</span> : null}
                      {field.isCustom ? (
                        <Badge skin={activeSkin} variant="outline">
                          CUSTOM
                        </Badge>
                      ) : null}
                    </span>

                    {field.type === "select" && field.selection ? (
                      <NativeSelect
                        skin={activeSkin}
                        value={String(value ?? "")}
                        onChange={(e) =>
                          setDraftValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                        }
                      >
                        <option value="">Select {field.label}</option>
                        {field.selection.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </NativeSelect>
                    ) : field.type === "boolean" ? (
                      <div className="flex items-center gap-2 py-1.5">
                        <Checkbox
                          skin={activeSkin}
                          checked={Boolean(value)}
                          aria-label={field.label}
                          onCheckedChange={(checked) =>
                            setDraftValues((prev) => ({ ...prev, [field.name]: checked === true }))
                          }
                        />
                        <span>{value ? "Enabled" : "Disabled"}</span>
                      </div>
                    ) : field.type === "textarea" ? (
                      <Textarea
                        skin={activeSkin}
                        rows={2}
                        value={String(value ?? "")}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          setDraftValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                        }
                      />
                    ) : (
                      <Input
                        skin={activeSkin}
                        type={
                          field.type === "number" || field.type === "integer"
                            ? "number"
                            : field.type === "date"
                              ? "date"
                              : "text"
                        }
                        value={String(value ?? "")}
                        placeholder={field.placeholder}
                        onChange={(e) =>
                          setDraftValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                        }
                      />
                    )}
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button skin={activeSkin} type="submit" disabled={submitting || missingRequired}>
                {submitting ? "Saving…" : editingRowId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <div className="py-8 text-center font-mono text-xs text-[var(--muted-foreground)]">
            Loading {descriptor.model} records…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-[var(--border)] bg-[var(--background)] px-4 py-8 text-center">
            <CutoutArtwork
              id={descriptor.cutoutId ?? "city-block"}
              className="h-20 w-20 opacity-85"
              decorative
            />
            <div className="space-y-1">
              <div className="text-sm font-semibold">
                No {descriptor.title ?? descriptor.model} entries
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {query
                  ? "Adjust filter criteria or clear search."
                  : "Records created here inherit active Skin + DNA."}
              </div>
            </div>
          </div>
        ) : viewMode === "kanban" && groupField ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-mw-view-mode="kanban">
            {Array.from(
              new Set(
                filteredRows.map((row) => formatCellValue(resolveFieldValue(row, groupField))),
              ),
            ).map((group) => (
              <section
                key={group}
                aria-label={`${groupField.label}: ${group}`}
                className="space-y-2 border border-[var(--border)] bg-[var(--background)] p-2"
              >
                <header className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  <Badge skin={activeSkin} variant="outline">
                    {group}
                  </Badge>
                  <span>
                    {
                      filteredRows.filter(
                        (row) => formatCellValue(resolveFieldValue(row, groupField)) === group,
                      ).length
                    }
                  </span>
                </header>
                {filteredRows
                  .filter((row) => formatCellValue(resolveFieldValue(row, groupField)) === group)
                  .map((row) => (
                    <article
                      key={row.id}
                      className="space-y-1 border border-[var(--border)] bg-[var(--card)] p-2 text-xs"
                    >
                      <div className="font-semibold text-[var(--foreground)]">
                        {formatCellValue(resolveFieldValue(row, visibleFields[0] ?? groupField))}
                      </div>
                      {acl.canUpdate && onUpdate ? (
                        <Button
                          skin={activeSkin}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(row)}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </article>
                  ))}
              </section>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto border border-[var(--border)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/60 font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
                  {visibleFields.map((field) => (
                    <th key={field.name} className="px-3 py-2">
                      {field.label}
                      {field.isCustom ? " *" : ""}
                    </th>
                  ))}
                  {acl.canUpdate ||
                  acl.canDelete ||
                  onArchive ||
                  onRestore ||
                  onInspectHistory ||
                  customActions.length > 0 ? (
                    <th className="px-3 py-2 text-right">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--border)]/60 transition-colors hover:bg-[var(--muted)]/35"
                  >
                    {visibleFields.map((field) => {
                      const rawVal = resolveFieldValue(row, field);
                      const textVal = formatCellValue(rawVal);
                      return (
                        <td key={field.name} className="px-3 py-2 text-[var(--foreground)]">
                          {field.type === "boolean" || field.name === "status" ? (
                            <Badge skin={activeSkin} variant="outline">
                              {textVal}
                            </Badge>
                          ) : (
                            textVal
                          )}
                        </td>
                      );
                    })}
                    {acl.canUpdate ||
                    acl.canDelete ||
                    onArchive ||
                    onRestore ||
                    onInspectHistory ||
                    customActions.length > 0 ? (
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {onInspectHistory ? (
                            <Button
                              skin={activeSkin}
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => void inspectHistory(row.id)}
                            >
                              History
                            </Button>
                          ) : null}
                          {acl.canUpdate && onUpdate ? (
                            <Button
                              skin={activeSkin}
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEditForm(row)}
                            >
                              Edit
                            </Button>
                          ) : null}
                          {onArchive && row.status !== "archived" ? (
                            <Button
                              skin={activeSkin}
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => void onArchive(row.id)}
                            >
                              Archive
                            </Button>
                          ) : null}
                          {onRestore && row.status === "archived" ? (
                            <Button
                              skin={activeSkin}
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void onRestore(row.id)}
                            >
                              Restore
                            </Button>
                          ) : null}
                          {customActions.map((act) => (
                            <Button
                              key={act.id}
                              skin={activeSkin}
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void act.onTrigger(row.id)}
                            >
                              {act.label}
                            </Button>
                          ))}
                          {acl.canDelete && onDelete ? (
                            <Button
                              skin={activeSkin}
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => void onDelete(row.id)}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {historyRowId ? (
          <div className="space-y-2 border border-[var(--border)] bg-[var(--background)] p-3 text-xs">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
              <span>Audit History · {historyRowId}</span>
              <Button
                skin={activeSkin}
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setHistoryRowId(null)}
              >
                Close
              </Button>
            </div>
            {historyBusy ? (
              <p className="text-[var(--muted-foreground)]">Loading audit entries…</p>
            ) : historyEntries.length === 0 ? (
              <p className="text-[var(--muted-foreground)]">No audit entries recorded.</p>
            ) : (
              <ul className="space-y-1 font-mono text-[11px]">
                {historyEntries.slice(0, 8).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between border border-[var(--border)] px-2 py-1"
                  >
                    <span>
                      <strong>{entry.action}</strong> v{entry.entity_version}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {entry.changed_by ?? "system"} ·{" "}
                      {new Date(entry.changed_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
