"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export type DiffLineKind = "added" | "removed" | "context";

export interface DiffLine {
  readonly id: string;
  readonly kind: DiffLineKind;
  readonly content: string;
  readonly oldLineNumber?: number;
  readonly newLineNumber?: number;
}

export interface DiffHunk {
  readonly id: string;
  readonly header?: string;
  readonly lines: readonly DiffLine[];
}

export interface DiffViewerProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly fileName: string;
  readonly hunks: readonly DiffHunk[];
  readonly ariaLabel?: string;
  readonly emptyMessage?: string;
  readonly skin?: SkinName;
}

const LINE_KIND_LABELS: Readonly<Record<DiffLineKind, string>> = {
  added: "Added",
  removed: "Removed",
  context: "Unchanged",
};

function lineKindClasses(kind: DiffLineKind): string {
  switch (kind) {
    case "added":
      return "border-[var(--success)] bg-[var(--success)]/5";
    case "removed":
      return "border-[var(--destructive)] bg-[var(--destructive)]/5";
    case "context":
      return "border-[var(--border)] bg-transparent";
  }
}

function lineKindTextClasses(kind: DiffLineKind): string {
  switch (kind) {
    case "added":
      return "text-[var(--success)]";
    case "removed":
      return "text-[var(--destructive)]";
    case "context":
      return "text-[var(--muted-foreground)]";
  }
}

const DiffViewer = React.forwardRef<HTMLDivElement, DiffViewerProps>(
  (
    {
      fileName,
      hunks,
      ariaLabel,
      emptyMessage = "No changes to display.",
      skin,
      className,
      ...props
    },
    ref,
  ) => {
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    const regionLabel = ariaLabel ?? `${fileName} diff`;
    const hasLines = hunks.some((hunk) => hunk.lines.length > 0);

    return (
      <div
        ref={ref}
        role="region"
        aria-label={regionLabel}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn("min-w-0", recipe.card, className)}
        {...props}
      >
        <div className="border-b border-[var(--border)] px-3 py-2.5">
          <h3 className="break-all text-sm font-semibold text-[var(--foreground)]">
            {fileName}
          </h3>
        </div>
        {!hasLines ? (
          <p
            role="status"
            className="px-3 py-6 text-center text-sm text-[var(--muted-foreground)]"
          >
            {emptyMessage}
          </p>
        ) : (
          <div className="overflow-x-auto">
            {hunks.map((hunk) => (
              <section key={hunk.id} className="min-w-0">
                {hunk.header ? (
                  <h4 className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-3 py-2 font-mono text-xs text-[var(--muted-foreground)]">
                    {hunk.header}
                  </h4>
                ) : null}
                <ol
                  aria-label={hunk.header ? `${fileName}: ${hunk.header}` : fileName}
                  className="m-0 min-w-max list-none p-0"
                >
                  {hunk.lines.map((line) => {
                    const kindLabel = LINE_KIND_LABELS[line.kind];
                    const lineNumbers = [
                      line.oldLineNumber !== undefined ? `old line ${line.oldLineNumber}` : null,
                      line.newLineNumber !== undefined ? `new line ${line.newLineNumber}` : null,
                    ].filter(Boolean);
                    const lineLabel = lineNumbers.length > 0 ? `, ${lineNumbers.join(", ")}` : "";

                    return (
                      <li
                        key={line.id}
                        aria-label={`${kindLabel}${lineLabel}: ${line.content || "blank line"}`}
                        data-change-kind={line.kind}
                        className={cn(
                          "grid min-w-max grid-cols-[3.5rem_3.5rem_7.5rem_minmax(0,1fr)] border-s-[3px] text-xs",
                          lineKindClasses(line.kind),
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="select-none px-2 py-1 text-end font-mono text-[var(--muted-foreground)]"
                        >
                          {line.oldLineNumber ?? ""}
                        </span>
                        <span
                          aria-hidden="true"
                          className="select-none px-2 py-1 text-end font-mono text-[var(--muted-foreground)]"
                        >
                          {line.newLineNumber ?? ""}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-1 font-semibold uppercase tracking-wide",
                            lineKindTextClasses(line.kind),
                          )}
                        >
                          {kindLabel}
                        </span>
                        <pre className="m-0 min-w-max whitespace-pre px-3 py-1 font-mono text-[var(--foreground)]">
                          <code>{line.content.length > 0 ? line.content : " "}</code>
                        </pre>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    );
  },
);
DiffViewer.displayName = "DiffViewer";

export { DiffViewer };
