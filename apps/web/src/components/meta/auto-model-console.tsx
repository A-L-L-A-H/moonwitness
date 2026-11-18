"use client";

import { useMemo, useState, type FormEvent } from "react";
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
  type AutoModelCustomAction,
  type AutoModelHistoryEntry,
  type CutoutArtworkId,
} from "@moonwitness/ui";
import { moonwitnessSdk } from "@moonwitness/contracts/sdk";
import { SkinPalette } from "@moonwitness/ui/icons";
import { useCurrentIdentity } from "@/lib/session";
import {
  executeModelMutation,
  mapRuntimeViewToAutoDescriptor,
  registerCustomFieldRequest,
  resolveBindingUrl,
  useMetaView,
  useModelRows,
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
  } = useModelRows(model, view?.actionBindings.listUrl, view?.restEnabled);

  const [studioOpen, setStudioOpen] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<
    "text" | "integer" | "real" | "boolean" | "date" | "selection"
  >("text");
  const [fieldSelection, setFieldSelection] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);

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

  if (viewError || !view) {
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
                        | "text"
                        | "integer"
                        | "real"
                        | "boolean"
                        | "date"
                        | "selection",
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
    </div>
  );
}
