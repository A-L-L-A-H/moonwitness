"use client";

import * as React from "react";
import { Minus } from "../../icons";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

interface InputOTPContextValue {
  value: string;
  maxLength: number;
  disabled: boolean;
  setSlotChar: (index: number, char: string) => void;
  pasteFrom: (index: number, text: string) => void;
  focusSlot: (index: number) => void;
  registerInput: (index: number, el: HTMLInputElement | null) => void;
}

const InputOTPContext = React.createContext<InputOTPContextValue | null>(null);

export interface InputOTPProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  maxLength?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  skin?: SkinName;
}

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  (
    {
      className,
      maxLength = 6,
      value: controlledValue,
      defaultValue = "",
      onChange,
      disabled = false,
      skin,
      children,
      ...props
    },
    ref,
  ) => {
    const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = (isControlled ? controlledValue : uncontrolled).slice(0, maxLength);
    const refs = React.useRef<(HTMLInputElement | null)[]>([]);
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);

    const commit = React.useCallback(
      (next: string) => {
        const sliced = next.slice(0, maxLength);
        if (!isControlled) setUncontrolled(sliced);
        onChange?.(sliced);
      },
      [maxLength, isControlled, onChange],
    );

    const focusSlot = React.useCallback(
      (index: number) => {
        const clamped = Math.max(0, Math.min(maxLength - 1, index));
        refs.current[clamped]?.focus();
      },
      [maxLength],
    );

    const setSlotChar = React.useCallback(
      (index: number, char: string) => {
        const chars = Array.from({ length: maxLength }, (_, i) => value[i] ?? "");
        chars[index] = char;
        const next = chars.join("").replace(/\s+$/g, "");
        commit(chars.join("").slice(0, maxLength));
        if (char && index < maxLength - 1) {
          focusSlot(index + 1);
        } else if (!char && index > 0 && next.length <= index) {
          focusSlot(index - 1);
        }
      },
      [value, maxLength, commit, focusSlot],
    );

    const pasteFrom = React.useCallback(
      (index: number, text: string) => {
        const clean = text.replace(/\s+/g, "");
        const chars = Array.from({ length: maxLength }, (_, i) => value[i] ?? "");
        for (let offset = 0; offset < clean.length && index + offset < maxLength; offset++) {
          chars[index + offset] = clean[offset]!;
        }
        commit(chars.join(""));
        focusSlot(Math.min(maxLength - 1, index + clean.length));
      },
      [value, maxLength, commit, focusSlot],
    );

    const registerInput = React.useCallback((index: number, el: HTMLInputElement | null) => {
      refs.current[index] = el;
    }, []);

    return (
      <InputOTPContext.Provider
        value={{ value, maxLength, disabled, setSlotChar, pasteFrom, focusSlot, registerInput }}
      >
        <div
          ref={ref}
          data-skin={resolvedSkin}
          data-dna={dnaId}
          className={cn("flex items-center gap-2", className)}
          {...props}
        >
          {children}
        </div>
      </InputOTPContext.Provider>
    );
  },
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-1", className)} {...props} />
  ),
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { index: number }
>(({ className, index, onKeyDown, onChange, onPaste, ...props }, ref) => {
  const ctx = React.useContext(InputOTPContext);
  if (!ctx) throw new Error("InputOTPSlot must be used within InputOTP");
  const char = ctx.value[index] ?? "";

  return (
    <input
      ref={(node) => {
        ctx.registerInput(index, node);
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="text"
      inputMode="numeric"
      maxLength={1}
      disabled={ctx.disabled || props.disabled}
      aria-label={props["aria-label"] ?? `Verification digit ${index + 1}`}
      value={char}
      onChange={(e) => {
        onChange?.(e);
        const val = e.target.value.slice(-1);
        ctx.setSlotChar(index, val);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.key === "Backspace" && !char && index > 0) {
          e.preventDefault();
          ctx.setSlotChar(index - 1, "");
          ctx.focusSlot(index - 1);
        } else if (e.key === "ArrowLeft" && index > 0) {
          e.preventDefault();
          ctx.focusSlot(index - 1);
        } else if (e.key === "ArrowRight" && index < ctx.maxLength - 1) {
          e.preventDefault();
          ctx.focusSlot(index + 1);
        }
      }}
      onPaste={(e) => {
        onPaste?.(e);
        const text = e.clipboardData?.getData("text");
        if (text) {
          e.preventDefault();
          ctx.pasteFrom(index, text);
        }
      }}
      className={cn(
        "h-11 w-10 rounded-[var(--mw-input-radius,0.375rem)] border border-[var(--input)] bg-[var(--background)] text-center font-mono text-base text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => (
    <div ref={ref} role="separator" aria-hidden="true" {...props}>
      <Minus className="h-4 w-4 text-[var(--muted-foreground)]" />
    </div>
  ),
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
