"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AutoModelView,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  CutoutArtwork,
  Input,
  NativeSelect,
  SkinOrnament,
  Textarea,
  type AutoModelCustomAction,
  type AutoModelHistoryEntry,
  type CutoutArtworkId,
} from "@moonwitness/ui";
import { moonwitnessSdk } from "@moonwitness/contracts/sdk";
import { SkinPalette } from "@moonwitness/ui/icons";
import { useCurrentIdentity } from "@/lib/session";
import {
  executeModelMutation,
  fetchModelReadGroup,
  fetchRecordChatter,
  mapRuntimeViewToAutoDescriptor,
  postRecordChatterComment,
  registerCustomFieldRequest,
  resolveBindingUrl,
  useMetaView,
  useModelRows,
  type ChatterMessageEntry,
} from "@/lib/api/meta-views";

export interface AutoModelConsoleProps {
  model: string;
  title?: string;
  description?: string;
  domainIcon?: string;
  cutoutId?: CutoutArtworkId;
  searchQuery?: string;
}

export function AutoModelConsole({
  model,
  title,
  description,
  domainIcon,
  cutoutId,
  searchQuery = "",
}: AutoModelConsoleProps) {
  const session = useCurrentIdentity();
  const isAdmin = session?.role === "admin";
  const { view, loading: viewLoading, error: viewError, reload: reloadView } = useMetaView(model);
  const {
    rows,
    loading: rowsLoading,
    error: rowsError,
    reload: reloadRows,
  } = useModelRows(model, view?.actionBindings?.listUrl, view?.restEnabled);

  const [studioOpen, setStudioOpen] = useState(false);
  const [matrixMode, setMatrixMode] = useState<"table" | "kanban" | "pivot" | "chatter" | "import">(
    "table",
  );
  const [groupField, setGroupField] = useState<string>("");
  const [groups, setGroups] = useState<Array<Record<string, unknown>>>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [chatterId, setChatterId] = useState<string>("");
  const [chatterMessages, setChatterMessages] = useState<ChatterMessageEntry[]>([]);
  const [chatterDraft, setChatterDraft] = useState("");
  const [chatterLoading, setChatterLoading] = useState(false);
  const [importJson, setImportJson] = useState("[]");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [fieldName, setFieldName] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<
    "text" | "integer" | "real" | "boolean" | "date" | "selection"
  >("text");
  const [fieldSelection, setFieldSelection] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);

  useEffect(() => {
    setGroupField("");
    setGroups([]);
    setChatterId("");
    setChatterMessages([]);
    setChatterDraft("");
    setImportStatus(null);
    setStudioOpen(false);
    setStudioError(null);
  }, [model]);

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) => {
        if (value && typeof value === "object") {
          return JSON.stringify(value).toLowerCase().includes(q);
        }
        return String(value ?? "")
          .toLowerCase()
          .includes(q);
      }),
    );
  }, [rows, searchQuery]);

  if (viewLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center font-mono text-xs text-[var(--muted-foreground)]">
          Loading runtime metadata for {model}…
        </CardContent>
      </Card>
    );
  }

  if (viewError || !view || !view.actionBindings) {
    return (
      <Card className="relative overflow-hidden">
        <SkinOrnament slot="corner" className="right-2 top-2" />
        <CardHeader className="flex flex-col items-center py-8 text-center">
          <CutoutArtwork
            id={cutoutId ?? "rooftop-antenna"}
            decorative
            className="mb-2 h-20 w-20 opacity-80"
          />
          <CardTitle>{title ?? model}</CardTitle>
          <CardDescription className="max-w-md">
            {viewError ?? `No active view descriptor for '${model}'.`}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const descriptor = mapRuntimeViewToAutoDescriptor(view, {
    title,
    description,
    domainIcon,
    cutoutId,
  });

  const defaultStageFieldSpec =
    view.fields.find((f) => f.selection && f.selection.length > 0) ??
    view.fields.find((f) => /state|status|stage|era|kind|category/i.test(f.field_name)) ??
    view.fields[0];
  const activeGroupField = groupField || defaultStageFieldSpec?.field_name || "status";
  const stageFieldSpec =
    view.fields.find((f) => f.field_name === activeGroupField) ?? defaultStageFieldSpec;

  async function loadPivotGroups(field: string) {
    if (!view?.restEnabled) return;
    setGroupsLoading(true);
    try {
      const next = await fetchModelReadGroup(model, field);
      setGroups(next);
    } catch {
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  }

  async function loadChatterForRecord(id: string) {
    if (!id.trim()) return;
    setChatterLoading(true);
    try {
      const msgs = await fetchRecordChatter(model, id.trim());
      setChatterMessages(msgs);
    } catch {
      setChatterMessages([]);
    } finally {
      setChatterLoading(false);
    }
  }

  async function handlePostChatter(e: FormEvent) {
    e.preventDefault();
    if (!chatterId.trim() || !chatterDraft.trim()) return;
    await postRecordChatterComment(model, chatterId.trim(), chatterDraft.trim());
    setChatterDraft("");
    await loadChatterForRecord(chatterId);
  }

  async function handleBulkImport(e: FormEvent) {
    e.preventDefault();
    if (!bindings.createUrl) return;
    setImportStatus(null);
    try {
      const parsed = JSON.parse(importJson) as unknown;
      if (!Array.isArray(parsed)) {
        setImportStatus("JSON payload must be an array of record objects.");
        return;
      }
      let ok = 0;
      for (const item of parsed) {
        if (item && typeof item === "object") {
          await executeModelMutation(bindings.createUrl, "POST", item as Record<string, unknown>);
          ok += 1;
        }
      }
      setImportStatus(`Imported ${ok} records cleanly.`);
      await reloadRows();
    } catch (err) {
      setImportStatus(err instanceof Error ? err.message : "Bulk import failed");
    }
  }

  const bindings = view.actionBindings;
  const customActions: AutoModelCustomAction[] = (bindings.customActions ?? [])
    .filter(
      (act) => !session?.role || act.roles.includes(session.role as "admin" | "editor" | "viewer"),
    )
    .map((act) => ({
      id: act.id,
      label: act.label,
      onTrigger: async (id: string) => {
        await executeModelMutation(resolveBindingUrl(act.urlTemplate, id), act.method);
        await reloadRows();
      },
    }));

  async function handleAddCustomField(e: FormEvent) {
    e.preventDefault();
    setStudioError(null);
    setSavingField(true);
    try {
      const selection =
        fieldType === "selection"
          ? fieldSelection
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
      await registerCustomFieldRequest(model, {
        field_name: fieldName.trim().toLowerCase(),
        field_type: fieldType,
        label: fieldLabel.trim() || undefined,
        required: fieldRequired,
        selection,
      });
      setFieldName("");
      setFieldLabel("");
      setFieldSelection("");
      setFieldRequired(false);
      setStudioOpen(false);
      await reloadView();
    } catch (err) {
      setStudioError(err instanceof Error ? err.message : "Failed to register custom field");
    } finally {
      setSavingField(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border)] bg-[var(--card)] px-4 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["table", "kanban", "pivot", "chatter", "import"] as const).map((mode) => (
            <Button
              key={mode}
              type="button"
              size="sm"
              variant={matrixMode === mode ? "default" : "outline"}
              onClick={() => {
                setMatrixMode(mode);
                if (mode === "pivot" || mode === "kanban") {
                  void loadPivotGroups(activeGroupField);
                }
                if (mode === "chatter") {
                  const firstId = chatterId || String(visibleRows[0]?.id ?? "");
                  if (firstId) {
                    setChatterId(firstId);
                    void loadChatterForRecord(firstId);
                  }
                }
              }}
            >
              {mode === "table"
                ? "Table"
                : mode === "kanban"
                  ? "Kanban"
                  : mode === "pivot"
                    ? "Pivot / Group"
                    : mode === "chatter"
                      ? "Chatter"
                      : "Import JSON"}
            </Button>
          ))}
        </div>
        <div className="font-mono text-[11px] text-[var(--muted-foreground)]">
          {visibleRows.length} rows · {view.model}
        </div>
      </div>

      {isAdmin && view.extensible ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border border-[var(--border)] bg-[var(--card)] px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--muted-foreground)]">
            <SkinPalette className="h-4 w-4 text-[var(--primary)]" />
            <Badge variant="outline">EXTENSIBLE _attrs</Badge>
            <span>Add live custom fields without SQL migrations or restarts.</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setStudioOpen((open) => !open)}
          >
            {studioOpen ? "Close Studio" : "+ Add Custom Field"}
          </Button>
        </div>
      ) : null}

      {studioOpen ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Register Custom Field on {model}</CardTitle>
            <CardDescription>
              Saved into <code>ir_model_fields</code> and validated inside <code>_attrs</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => void handleAddCustomField(e)}
              className="grid gap-3 sm:grid-cols-2"
            >
              {studioError ? (
                <div className="sm:col-span-2 border border-[var(--destructive)] px-3 py-2 text-xs text-[var(--destructive)]">
                  {studioError}
                </div>
              ) : null}
              <label className="space-y-1 text-xs">
                <span className="font-mono uppercase text-[var(--muted-foreground)]">
                  Field Key (snake_case)
                </span>
                <Input
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="cust_rack_unit"
                  required
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-mono uppercase text-[var(--muted-foreground)]">
                  Display Label
                </span>
                <Input
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  placeholder="Rack Unit"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="font-mono uppercase text-[var(--muted-foreground)]">
                  Field Type
                </span>
                <NativeSelect
                  value={fieldType}
                  onChange={(e) =>
                    setFieldType(
                      e.target.value as
                        "text" | "integer" | "real" | "boolean" | "date" | "selection",
                    )
                  }
                >
                  <option value="text">Text</option>
                  <option value="integer">Integer</option>
                  <option value="real">Decimal</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                  <option value="selection">Selection</option>
                </NativeSelect>
              </label>
              {fieldType === "selection" ? (
                <label className="space-y-1 text-xs">
                  <span className="font-mono uppercase text-[var(--muted-foreground)]">
                    Choices (comma-separated)
                  </span>
                  <Input
                    value={fieldSelection}
                    onChange={(e) => setFieldSelection(e.target.value)}
                    placeholder="low, medium, high"
                  />
                </label>
              ) : null}
              <label className="flex items-center gap-2 text-xs sm:col-span-2">
                <Checkbox
                  checked={fieldRequired}
                  aria-label="Required field"
                  onCheckedChange={(checked) => setFieldRequired(checked === true)}
                />
                <span>Required field</span>
              </label>
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" size="sm" disabled={savingField || !fieldName.trim()}>
                  {savingField ? "Saving…" : "Save Custom Field"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {matrixMode === "kanban" ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[var(--muted-foreground)]">Group stage by:</span>
            <NativeSelect
              value={activeGroupField}
              onChange={(e) => {
                setGroupField(e.target.value);
                void loadPivotGroups(e.target.value);
              }}
            >
              {view.fields.map((f) => (
                <option key={f.field_name} value={f.field_name}>
                  {f.label || f.field_name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from(
              new Set([
                ...(stageFieldSpec?.selection ?? []),
                ...visibleRows.map((r) => String(r[activeGroupField] ?? "unassigned")),
              ]),
            ).map((bucket) => {
              const bucketRows = visibleRows.filter(
                (r) => String(r[activeGroupField] ?? "unassigned") === bucket,
              );
              const selections = stageFieldSpec?.selection ?? [];
              const nextStage =
                selections.length > 1
                  ? selections[(selections.indexOf(bucket) + 1) % selections.length]
                  : undefined;
              return (
                <Card key={bucket}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-mono text-xs uppercase">{bucket}</CardTitle>
                      <Badge variant="outline">{bucketRows.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {bucketRows.slice(0, 12).map((row) => {
                      const rid = String(row.id ?? "");
                      const label = String(
                        row.title ?? row.name ?? row.reference ?? row.code ?? rid,
                      );
                      return (
                        <div
                          key={rid}
                          className="border border-[var(--border)] bg-[var(--background)] p-2 text-xs space-y-1"
                        >
                          <div className="font-medium">{label}</div>
                          <div className="flex items-center justify-between font-mono text-[10px] text-[var(--muted-foreground)]">
                            <span>{rid.slice(0, 8)}</span>
                            {nextStage && bindings.updateUrl ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  await executeModelMutation(
                                    resolveBindingUrl(bindings.updateUrl!, rid),
                                    "PATCH",
                                    { [activeGroupField]: nextStage },
                                  );
                                  await reloadRows();
                                }}
                              >
                                → {nextStage}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : matrixMode === "pivot" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">SQL Group-By & Pivot Aggregation</CardTitle>
              <CardDescription>
                Live server aggregation via <code>/api/v1/m/{model}/read-group</code>
              </CardDescription>
            </div>
            <NativeSelect
              value={activeGroupField}
              onChange={(e) => {
                setGroupField(e.target.value);
                void loadPivotGroups(e.target.value);
              }}
            >
              {view.fields.map((f) => (
                <option key={f.field_name} value={f.field_name}>
                  {f.label || f.field_name}
                </option>
              ))}
            </NativeSelect>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-xs">
            {groupsLoading ? (
              <div className="text-[var(--muted-foreground)]">Computing read-group…</div>
            ) : groups.length === 0 ? (
              <div className="text-[var(--muted-foreground)]">No grouped buckets returned.</div>
            ) : (
              groups.map((g, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border border-[var(--border)] px-3 py-2"
                >
                  <span>{String(g[activeGroupField] ?? "null")}</span>
                  <Badge variant="outline">{Number(g.count ?? 0)} records</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : matrixMode === "chatter" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Record Chatter & Tracking Log</CardTitle>
            <CardDescription>
              Inspect <code>mail.message</code> comments and <code>mail.tracking.value</code> diffs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <NativeSelect
                value={chatterId}
                onChange={(e) => {
                  setChatterId(e.target.value);
                  void loadChatterForRecord(e.target.value);
                }}
              >
                <option value="">Select record…</option>
                {visibleRows.slice(0, 50).map((row) => {
                  const rid = String(row.id ?? "");
                  const label = String(row.title ?? row.name ?? row.reference ?? rid);
                  return (
                    <option key={rid} value={rid}>
                      {label} ({rid.slice(0, 8)})
                    </option>
                  );
                })}
              </NativeSelect>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void loadChatterForRecord(chatterId)}
              >
                Refresh Chatter
              </Button>
            </div>

            {chatterLoading ? (
              <div className="font-mono text-xs text-[var(--muted-foreground)]">
                Loading chatter messages…
              </div>
            ) : (
              <div className="space-y-2">
                {chatterMessages.length === 0 ? (
                  <div className="font-mono text-xs text-[var(--muted-foreground)]">
                    No chatter messages recorded for this record yet.
                  </div>
                ) : (
                  chatterMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="border border-[var(--border)] p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-[var(--muted-foreground)]">
                        <span>{msg.message_type.toUpperCase()}</span>
                        <span>{msg.author_id ?? "system"}</span>
                      </div>
                      <div>{msg.body}</div>
                      {msg.$tracking_values?.map((tr) => (
                        <div
                          key={tr.id}
                          className="font-mono text-[10px] text-[var(--primary)]"
                        >
                          {tr.field_name}: {tr.old_value ?? "∅"} → {tr.new_value ?? "∅"}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}

            {chatterId ? (
              <form onSubmit={(e) => void handlePostChatter(e)} className="flex gap-2">
                <Input
                  value={chatterDraft}
                  onChange={(e) => setChatterDraft(e.target.value)}
                  placeholder="Write an internal note or audit comment…"
                />
                <Button type="submit" size="sm" disabled={!chatterDraft.trim()}>
                  Post
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      ) : matrixMode === "import" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bulk Import JSON Records into {model}</CardTitle>
            <CardDescription>
              Paste a JSON array matching fields on <code>{model}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleBulkImport(e)} className="space-y-3">
              <Textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
              {importStatus ? (
                <div className="font-mono text-xs text-[var(--primary)]">{importStatus}</div>
              ) : null}
              <Button type="submit" size="sm" disabled={!bindings.createUrl}>
                Run Bulk Import
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <AutoModelView
          descriptor={descriptor}
          rows={visibleRows}
          loading={rowsLoading}
          error={rowsError}
          onInspectHistory={async (id) => {
            const res = await moonwitnessSdk
              .model(model)
              .history<AutoModelHistoryEntry>(id, bindings.historyUrl);
            return res.data ?? [];
          }}
          onCreate={
            bindings.createUrl
              ? async (values) => {
                  await executeModelMutation(bindings.createUrl!, "POST", values);
                  await reloadRows();
                }
              : undefined
          }
          onUpdate={
            bindings.updateUrl
              ? async (id, values) => {
                  await executeModelMutation(
                    resolveBindingUrl(bindings.updateUrl!, id),
                    "PATCH",
                    values,
                  );
                  await reloadRows();
                }
              : undefined
          }
          onArchive={
            bindings.archiveUrl
              ? async (id) => {
                  await executeModelMutation(resolveBindingUrl(bindings.archiveUrl!, id), "POST");
                  await reloadRows();
                }
              : undefined
          }
          onRestore={
            bindings.restoreUrl
              ? async (id) => {
                  await executeModelMutation(resolveBindingUrl(bindings.restoreUrl!, id), "POST");
                  await reloadRows();
                }
              : undefined
          }
          onDelete={
            bindings.deleteUrl
              ? async (id) => {
                  await executeModelMutation(resolveBindingUrl(bindings.deleteUrl!, id), "DELETE");
                  await reloadRows();
                }
              : undefined
          }
          customActions={customActions}
        />
      )}
    </div>
  );
}
