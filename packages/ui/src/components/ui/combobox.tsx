"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { useComponentSkin } from "./skin-adapter";

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
  readonly keywords?: readonly string[];
  readonly disabled?: boolean;
}

export interface ComboboxProps {
  options: readonly ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  skin?: SkinName;
  "aria-label"?: string;
}

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Select option...",
      searchPlaceholder = "Search...",
      emptyMessage = "No matching option.",
      disabled = false,
      className,
      skin,
      "aria-label": ariaLabel,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
    const active = options.find((opt) => opt.value === value);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            data-skin={resolvedSkin}
            data-dna={dnaId}
            disabled={disabled}
            skin={skin}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className={cn(!active && "text-[var(--muted-foreground)]")}>
              {active ? active.label : placeholder}
            </span>
            <ChevronsUpDown aria-hidden="true" className="ml-2 h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent skin={skin} className="w-[var(--radix-popover-trigger-width,18rem)] p-0">
          <Command skin={skin} value={value}>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              {options.length === 0 ? <CommandEmpty>{emptyMessage}</CommandEmpty> : null}
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label, ...(option.keywords ?? [])]}
                    disabled={option.disabled}
                    onSelect={() => {
                      const next = option.value === value ? "" : option.value;
                      onValueChange?.(next);
                      setOpen(false);
                    }}
                  >
                    <Check
                      aria-hidden="true"
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span>{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);
Combobox.displayName = "Combobox";

export { Combobox };
