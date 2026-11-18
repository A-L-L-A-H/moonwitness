"use client";

import * as React from "react";
import { Check, Minus } from "../../icons";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

export type CheckedState = boolean | "indeterminate";

export interface CheckboxProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "checked" | "defaultChecked" | "onChange"
> {
  checked?: CheckedState;
  defaultChecked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void;
  required?: boolean;
  name?: string;
  value?: string;
  skin?: SkinName;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    {
      className,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      required,
      name,
      value = "on",
      skin,
      onClick,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] =
      React.useState<CheckedState>(defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const state: CheckedState = isControlled ? controlledChecked : uncontrolledChecked;
    const isChecked = state === true || state === "indeterminate";
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);

    const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || disabled) return;
      const next: CheckedState = state === "indeterminate" ? true : !state;
      if (!isControlled) setUncontrolledChecked(next);
      onCheckedChange?.(next);
    };

    return (
      <span className="inline-flex items-center justify-center">
        <button
          ref={ref}
          type="button"
          role="checkbox"
          aria-checked={state === "indeterminate" ? "mixed" : isChecked}
          aria-required={required}
          data-state={
            state === "indeterminate" ? "indeterminate" : isChecked ? "checked" : "unchecked"
          }
          data-skin={resolvedSkin}
          data-dna={dnaId}
          disabled={disabled}
          onClick={toggle}
          className={cn(
            "peer inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--mw-input-radius,0.25rem)] border-2 border-[var(--border)] bg-[var(--background)] text-[var(--primary-foreground)] ring-offset-[var(--background)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 aria-[invalid=true]:border-[var(--destructive)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] data-[state=indeterminate]:border-[var(--primary)] data-[state=indeterminate]:bg-[var(--primary)]",
            className,
          )}
          {...props}
        >
          {state === "indeterminate" ? (
            <Minus aria-hidden="true" className="h-3.5 w-3.5 stroke-[3]" />
          ) : state === true ? (
            <Check aria-hidden="true" className="h-3.5 w-3.5 stroke-[3]" />
          ) : null}
        </button>
        {name ? (
          <input
            type="checkbox"
            aria-hidden="true"
            tabIndex={-1}
            name={name}
            value={value}
            checked={state === true}
            required={required}
            disabled={disabled}
            onChange={() => {}}
            className="sr-only pointer-events-none"
          />
        ) : null}
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
