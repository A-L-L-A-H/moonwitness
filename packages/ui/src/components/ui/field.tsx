"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { Label } from "./label";
import { useComponentSkin } from "./skin-adapter";

interface FieldContextValue {
  inputId: string;
  descriptionId: string;
  errorId: string;
  hasDescription: boolean;
  hasError: boolean;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: React.ReactNode;
  hasDescription?: boolean;
  skin?: SkinName;
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, error, hasDescription = false, skin, children, ...props }, ref) => {
    const uid = React.useId();
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
    const hasError = Boolean(error);
    return (
      <FieldContext.Provider
        value={{
          inputId: `${uid}-control`,
          descriptionId: `${uid}-description`,
          errorId: `${uid}-error`,
          hasDescription,
          hasError,
        }}
      >
        <div
          ref={ref}
          data-skin={resolvedSkin}
          data-dna={dnaId}
          data-invalid={hasError ? "true" : undefined}
          className={cn("grid gap-1.5", className)}
          {...props}
        >
          {children}
          {error ? <FieldError>{error}</FieldError> : null}
        </div>
      </FieldContext.Provider>
    );
  },
);
Field.displayName = "Field";

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(FieldContext);
  return (
    <Label
      ref={ref}
      htmlFor={ctx?.inputId}
      className={cn(ctx?.hasError && "text-[var(--destructive)]", className)}
      {...props}
    />
  );
});
FieldLabel.displayName = "FieldLabel";

const FieldControl = React.forwardRef<HTMLElement, { children: React.ReactElement }>(
  ({ children }, ref) => {
    const ctx = React.useContext(FieldContext);
    const childProps = children.props as React.HTMLAttributes<HTMLElement>;
    const childDescription = childProps["aria-describedby"];
    const describedByIds = [
      ...(childDescription?.split(/\s+/).filter(Boolean) ?? []),
      ...(ctx?.hasDescription ? [ctx.descriptionId] : []),
      ...(ctx?.hasError ? [ctx.errorId] : []),
    ];
    const describedBy = [...new Set(describedByIds)].join(" ") || undefined;
    const childWithDescription = React.cloneElement(
      children as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
      { "aria-describedby": describedBy },
    );

    return (
      <Slot
        ref={ref}
        id={ctx?.inputId}
        aria-describedby={describedBy}
        aria-invalid={ctx?.hasError || undefined}
      >
        {childWithDescription}
      </Slot>
    );
  },
);
FieldControl.displayName = "FieldControl";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(FieldContext);
  return (
    <p
      ref={ref}
      id={ctx?.descriptionId}
      className={cn("text-xs text-[var(--muted-foreground)]", className)}
      {...props}
    />
  );
});
FieldDescription.displayName = "FieldDescription";

const FieldError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(FieldContext);
  if (!children) return null;
  return (
    <p
      ref={ref}
      id={ctx?.errorId}
      role="alert"
      className={cn("text-xs font-medium text-[var(--destructive)]", className)}
      {...props}
    >
      {children}
    </p>
  );
});
FieldError.displayName = "FieldError";

export { Field, FieldLabel, FieldControl, FieldDescription, FieldError };
