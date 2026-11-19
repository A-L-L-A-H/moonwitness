"use client";

import { useRef, useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle, Input, ZineButton } from "@moonwitness/ui";

export interface SearchDialogProps {
  query: string;
  onQueryChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function SearchDialog({ query, onQueryChange, onSubmit, onClose }: SearchDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [openerEl] = useState<HTMLElement | null>(() =>
    typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null,
  );

  function handleClose() {
    onClose();
    queueMicrotask(() => {
      openerEl?.focus();
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        hideClose
        aria-describedby={undefined}
        aria-label="Search the archive"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
        className="top-28 translate-y-0 max-w-xl p-5"
      >
        <DialogTitle className="sr-only">Search the archive</DialogTitle>
        <form onSubmit={onSubmit}>
          <div className="flex items-start justify-between gap-4">
            <label htmlFor="nav-search" className="font-brush text-lg text-[var(--yellow)]">
              SEARCH THE SIGNALS
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="min-h-11 px-3 text-sm"
            >
              Close search
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              ref={inputRef}
              id="nav-search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="stories, signals, people, places…"
              className="rounded-md bg-[var(--background)] border-[var(--border)] px-4 py-3 text-sm focus:border-[var(--pink)] focus:ring-[var(--pink)]"
            />
            <ZineButton type="submit" tone="pink" className="px-5 py-2 text-sm">
              GO
            </ZineButton>
          </div>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            Searches the Dock timeline chronicle.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
