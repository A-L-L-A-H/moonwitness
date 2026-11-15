"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@moonwitness/ui";
import { Input } from "@moonwitness/ui";
import { Button } from "@moonwitness/ui";

export interface SearchDialogProps {
  query: string;
  onQueryChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function SearchDialog({ query, onQueryChange, onSubmit, onClose }: SearchDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="zine-card-rough w-full max-w-xl p-5 fixed top-[28%] left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm border-[var(--line)] shadow-[5px_5px_0_rgba(0,0,0,0.55)]">
        <DialogHeader className="flex items-start justify-between gap-4 pb-3 border-b border-[var(--line)]">
          <DialogTitle className="font-brush text-lg text-[var(--yellow)]">
            SEARCH THE SIGNALS
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="btn-zine min-h-11 px-3 text-sm">
            Close search
          </Button>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-3 flex gap-2">
          <Input
            id="nav-search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="stories, signals, people, places…"
            className="rounded-md px-4 py-3 text-sm bg-[var(--background)] border-[var(--line)] focus:border-[var(--pink)] focus:ring-[var(--pink)]"
            autoFocus
          />
          <Button type="submit" className="btn-zine px-5 py-2 text-sm">
            GO
          </Button>
        </form>
        <DialogDescription className="mt-3 text-xs text-zinc-500">
          Searches the Dock timeline chronicle.
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
