"use client";

import * as React from "react";
import { ChevronDown } from "../../icons";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

interface AccordionContextValue {
  type: "single" | "multiple";
  collapsible: boolean;
  openValues: readonly string[];
  toggleValue: (value: string) => void;
  skin: SkinName;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext<{
  value: string;
  isOpen: boolean;
  disabled: boolean;
  triggerId: string;
  contentId: string;
} | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  collapsible?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  skin?: SkinName;
}

function normalizeValues(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : v ? [v] : [];
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      className,
      type = "single",
      collapsible = false,
      value,
      defaultValue,
      onValueChange,
      skin,
      children,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState<string[]>(() =>
      normalizeValues(defaultValue),
    );
    const isControlled = value !== undefined;
    const openValues = isControlled ? normalizeValues(value) : uncontrolled;
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);

    const toggleValue = React.useCallback(
      (itemValue: string) => {
        const currentlyOpen = openValues.includes(itemValue);
        let next: string[];
        if (type === "single") {
          next = currentlyOpen ? (collapsible ? [] : [itemValue]) : [itemValue];
          if (!isControlled) setUncontrolled(next);
          onValueChange?.(next[0] ?? "");
        } else {
          next = currentlyOpen
            ? openValues.filter((v) => v !== itemValue)
            : [...openValues, itemValue];
          if (!isControlled) setUncontrolled(next);
          onValueChange?.(next);
        }
      },
      [type, collapsible, openValues, isControlled, onValueChange],
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      props.onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const triggers = Array.from(
        event.currentTarget.querySelectorAll<HTMLButtonElement>(
          'button[data-accordion-trigger="true"]:not(:disabled)',
        ),
      );
      const currentIdx = triggers.indexOf(document.activeElement as HTMLButtonElement);
      if (currentIdx === -1) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        triggers[(currentIdx + 1) % triggers.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        triggers[(currentIdx - 1 + triggers.length) % triggers.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        triggers[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        triggers[triggers.length - 1]?.focus();
      }
    };

    return (
      <AccordionContext.Provider
        value={{ type, collapsible, openValues, toggleValue, skin: resolvedSkin }}
      >
        <div
          ref={ref}
          data-skin={resolvedSkin}
          data-dna={dnaId}
          onKeyDown={handleKeyDown}
          className={cn("w-full divide-y divide-[var(--border)]", recipe.card, "p-0", className)}
          {...props}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string; disabled?: boolean }
>(({ className, value, disabled = false, children, ...props }, ref) => {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be used within Accordion");
  const uid = React.useId();
  const isOpen = ctx.openValues.includes(value);
  return (
    <AccordionItemContext.Provider
      value={{
        value,
        isOpen,
        disabled,
        triggerId: `${uid}-trigger`,
        contentId: `${uid}-content`,
      }}
    >
      <div
        ref={ref}
        data-state={isOpen ? "open" : "closed"}
        className={cn("px-4", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
});
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const acc = React.useContext(AccordionContext);
  const item = React.useContext(AccordionItemContext);
  if (!acc || !item) throw new Error("AccordionTrigger must be used within AccordionItem");

  return (
    <h3 className="m-0 flex">
      <button
        ref={ref}
        id={item.triggerId}
        type="button"
        data-accordion-trigger="true"
        data-state={item.isOpen ? "open" : "closed"}
        aria-expanded={item.isOpen}
        aria-controls={item.contentId}
        disabled={item.disabled || props.disabled}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) acc.toggleValue(item.value);
        }}
        className={cn(
          "flex min-h-11 flex-1 items-center justify-between py-4 text-left text-sm font-medium transition-all hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            item.isOpen && "rotate-180",
          )}
        />
      </button>
    </h3>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const item = React.useContext(AccordionItemContext);
    if (!item) throw new Error("AccordionContent must be used within AccordionItem");
    return (
      <div
        ref={ref}
        id={item.contentId}
        role="region"
        aria-labelledby={item.triggerId}
        data-state={item.isOpen ? "open" : "closed"}
        hidden={!item.isOpen}
        className={cn("pb-4 pt-0 text-sm text-[var(--muted-foreground)]", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
