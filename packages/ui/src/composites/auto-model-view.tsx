"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CutoutArtwork } from "../artwork/cutouts";
import { cn } from "../cn";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { ArsyRelay } from "../icons/modules";
import { SkinOrnament } from "../primitives/tactile-hardware";
import { useSkin } from "../skin";
import { AutoModelForm } from "./auto-model/form";
import { AutoModelHistoryPanel } from "./auto-model/history";
import { AutoModelKanban } from "./auto-model/kanban";
import { AutoModelTable } from "./auto-model/table";
import {
  DOMAIN_ICON_MAP,
  formatCellValue,
  resolveFieldValue,
  type AutoModelAcl,
  type AutoModelFieldSpec,
  type AutoModelHistoryEntry,
  type AutoModelRow,
  type AutoModelViewProps,
} from "./auto-model/types";

export type {
  AutoModelAcl,
  AutoModelCustomAction,
  AutoModelFieldSpec,
  AutoModelFieldType,
  AutoModelHistoryEntry,
  AutoModelRow,
  AutoModelViewDescriptor,
  AutoModelViewProps,
} from "./auto-model/types";

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
          <AutoModelForm
            model={descriptor.model}
            activeSkin={activeSkin}
            editingRowId={editingRowId}
            editableFields={editableFields}
            draftValues={draftValues}
            formError={formError}
            submitting={submitting}
            missingRequired={missingRequired}
            onDraftChange={(name, value) => setDraftValues((prev) => ({ ...prev, [name]: value }))}
            onCancel={() => setFormOpen(false)}
            onSubmit={(e) => void handleSubmit(e)}
          />
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
          <AutoModelKanban
            activeSkin={activeSkin}
            filteredRows={filteredRows}
            visibleFields={visibleFields}
            groupField={groupField}
            acl={acl}
            canUpdate={Boolean(onUpdate)}
            onEdit={openEditForm}
          />
        ) : (
          <AutoModelTable
            activeSkin={activeSkin}
            filteredRows={filteredRows}
            visibleFields={visibleFields}
            acl={acl}
            hasUpdateHandler={Boolean(onUpdate)}
            hasDeleteHandler={Boolean(onDelete)}
            hasHistoryHandler={Boolean(onInspectHistory)}
            onArchive={onArchive}
            onRestore={onRestore}
            customActions={customActions}
            onInspectHistory={(id) => void inspectHistory(id)}
            onEdit={openEditForm}
            onDelete={(id) => onDelete && void onDelete(id)}
          />
        )}

        {historyRowId ? (
          <AutoModelHistoryPanel
            activeSkin={activeSkin}
            rowId={historyRowId}
            loading={historyBusy}
            entries={historyEntries}
            onClose={() => setHistoryRowId(null)}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
