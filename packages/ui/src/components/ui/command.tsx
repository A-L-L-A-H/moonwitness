"use client";

import * as React from "react";
import { Search } from "../../icons";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { useComponentSkin } from "./skin-adapter";

interface CommandContextValue {
  search: string;
  setSearch: (v: string) => void;
  activeValue: string | null;
  setActiveValue: (v: string | null) => void;
  skin: SkinName;
}

const CommandContext = React.createContext<CommandContextValue | null>(null);

export interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string | undefined;
  onValueChange?: (value: string) => void;
  skin?: SkinName | undefined;
}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ className, value, onValueChange, skin, onKeyDown, children, ...props }, ref) => {
    const [search, setSearch] = React.useState("");
    const [activeValue, setActiveValue] = React.useState<string | null>(value ?? null);
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      const items = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>(
          '[role="option"]:not([aria-disabled="true"])',
        ),
      );
      if (items.length === 0) return;
      const currentIdx = items.findIndex((el) => el.getAttribute("data-selected") === "true");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = items[(currentIdx + 1) % items.length];
        if (next) setActiveValue(next.getAttribute("data-value"));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = items[(currentIdx - 1 + items.length) % items.length];
        if (prev) setActiveValue(prev.getAttribute("data-value"));
      } else if (e.key === "Enter") {
        const target = currentIdx >= 0 ? items[currentIdx] : items[0];
        if (target) {
          e.preventDefault();
          target.click();
        }
      }
    };

    React.useEffect(() => {
      if (value !== undefined) setActiveValue(value);
    }, [value]);

    return (
      <CommandContext.Provider
        value={{
          search,
          setSearch,
          activeValue,
          setActiveValue: (v) => {
            setActiveValue(v);
            if (v) onValueChange?.(v);
          },
          skin: resolvedSkin,
        }}
      >
        <div
          ref={ref}
          data-skin={resolvedSkin}
          data-dna={dnaId}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-full w-full flex-col overflow-hidden",
            recipe.selectContent,
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </CommandContext.Provider>
    );
  },
);
Command.displayName = "Command";

const CommandDialog = ({
  children,
  title = "Command Palette",
  open,
  onOpenChange,
  skin,
}: {
  children: React.ReactNode;
  title?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  skin?: SkinName;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent skin={skin} className="overflow-hidden p-0 shadow-lg">
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <Command skin={skin}>{children}</Command>
    </DialogContent>
  </Dialog>
);
CommandDialog.displayName = "CommandDialog";

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, value, onChange, ...props }, ref) => {
  const ctx = React.useContext(CommandContext);
  const resolvedValue = value !== undefined ? value : (ctx?.search ?? "");
  return (
    <div className="flex items-center border-b border-[var(--border)] px-3">
      <Search aria-hidden="true" className="mr-2 h-4 w-4 shrink-0 opacity-60" />
      <input
        ref={ref}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={true}
        value={resolvedValue}
        onChange={(e) => {
          onChange?.(e);
          ctx?.setSearch(e.target.value);
        }}
        className={cn(
          "flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
});
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="listbox"
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden p-1", className)}
      {...props}
    />
  ),
);
CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children = "No results found.", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("py-6 text-center text-sm text-[var(--muted-foreground)]", className)}
      {...props}
    >
      {children}
    </div>
  ),
);
CommandEmpty.displayName = "CommandEmpty";

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { heading?: React.ReactNode }
>(({ className, heading, children, ...props }, ref) => (
  <div ref={ref} role="group" className={cn("overflow-hidden p-1", className)} {...props}>
    {heading ? (
      <div className="px-2 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
        {heading}
      </div>
    ) : null}
    {children}
  </div>
));
CommandGroup.displayName = "CommandGroup";

const CommandSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn("-mx-1 h-px bg-[var(--border)]", className)}
      {...props}
    />
  ),
);
CommandSeparator.displayName = "CommandSeparator";

export interface CommandItemProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect"
> {
  value?: string;
  keywords?: readonly string[];
  onSelect?: (value: string) => void;
}

const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  ({ className, value, keywords, disabled, onSelect, onClick, children, ...props }, ref) => {
    const ctx = React.useContext(CommandContext);
    const labelText =
      value ?? (typeof children === "string" ? children : String(children ?? "")).trim();
    const query = ctx?.search.trim().toLowerCase() ?? "";
    const haystack = [labelText, ...(keywords ?? [])].join(" ").toLowerCase();

    if (query && !haystack.includes(query)) {
      return null;
    }

    const isSelected = ctx?.activeValue === labelText;

    return (
      <button
        ref={ref}
        type="button"
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled || undefined}
        data-value={labelText}
        data-selected={isSelected ? "true" : "false"}
        disabled={disabled}
        onMouseEnter={() => ctx?.setActiveValue(labelText)}
        onClick={(e) => {
          onClick?.(e);
          if (!disabled && !e.defaultPrevented) {
            ctx?.setActiveValue(labelText);
            onSelect?.(labelText);
          }
        }}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-2 text-left text-sm outline-none transition-colors hover:bg-[var(--muted)] focus-visible:bg-[var(--muted)] data-[selected=true]:bg-[var(--muted)] data-[selected=true]:text-[var(--foreground)] disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
CommandItem.displayName = "CommandItem";

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto text-xs tracking-widest text-[var(--muted-foreground)]", className)}
    {...props}
  />
);
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
};
