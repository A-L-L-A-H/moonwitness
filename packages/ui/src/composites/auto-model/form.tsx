"use client";

import type { FormEvent } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { NativeSelect } from "../../components/ui/native-select";
import { Textarea } from "../../components/ui/textarea";
import type { SkinName } from "../../skin";
import type { AutoModelFieldSpec } from "./types";

interface AutoModelFormProps {
  model: string;
  activeSkin: SkinName;
  editingRowId: string | null;
  editableFields: readonly AutoModelFieldSpec[];
  draftValues: Record<string, string | boolean>;
  formError: string | null;
  submitting: boolean;
  missingRequired: boolean;
  onDraftChange: (name: string, value: string | boolean) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function AutoModelForm({
  model,
  activeSkin,
  editingRowId,
  editableFields,
  draftValues,
  formError,
  submitting,
  missingRequired,
  onDraftChange,
  onCancel,
  onSubmit,
}: AutoModelFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 border border-[var(--border)] bg-[var(--background)] p-4"
      aria-label={editingRowId ? `Edit ${model}` : `Create ${model}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold uppercase tracking-wider">
          {editingRowId ? `Edit ${model}` : `New ${model}`}
        </span>
        <Button skin={activeSkin} type="button" variant="ghost" size="sm" onClick={onCancel}>
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
                  onChange={(e) => onDraftChange(field.name, e.target.value)}
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
                    onCheckedChange={(checked) => onDraftChange(field.name, checked === true)}
                  />
                  <span>{value ? "Enabled" : "Disabled"}</span>
                </div>
              ) : field.type === "textarea" ? (
                <Textarea
                  skin={activeSkin}
                  rows={2}
                  value={String(value ?? "")}
                  placeholder={field.placeholder}
                  onChange={(e) => onDraftChange(field.name, e.target.value)}
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
                  onChange={(e) => onDraftChange(field.name, e.target.value)}
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
  );
}
