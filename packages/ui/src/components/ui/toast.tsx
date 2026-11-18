"use client";

import * as React from "react";
import { X } from "../../icons";
import { cva, type VariantProps } from "../../lib/utils";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden border p-4 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)]",
        success: "border-2 border-[var(--green)] bg-[var(--card)] text-[var(--foreground)]",
        warning: "border-2 border-[var(--yellow)] bg-[var(--card)] text-[var(--foreground)]",
        destructive:
          "border-2 border-[var(--destructive)] bg-[var(--destructive)] text-[var(--destructive-foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>;

export interface ToastRecord {
  readonly id: string;
  readonly title?: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly variant?: ToastVariant;
  readonly durationMs?: number;
  readonly action?: React.ReactNode;
}

type ToastListener = (records: readonly ToastRecord[]) => void;

const TOAST_LIMIT = 5;
let toastSequence = 0;
let memoryToasts: readonly ToastRecord[] = [];
const toastListeners = new Set<ToastListener>();
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

function emitToasts() {
  for (const listener of toastListeners) {
    listener(memoryToasts);
  }
}

export function dismissToast(id?: string): void {
  if (!id) {
    for (const timer of dismissTimers.values()) clearTimeout(timer);
    dismissTimers.clear();
    memoryToasts = [];
    emitToasts();
    return;
  }
  const timer = dismissTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    dismissTimers.delete(id);
  }
  memoryToasts = memoryToasts.filter((item) => item.id !== id);
  emitToasts();
}

export function toast(input: Omit<ToastRecord, "id"> & { id?: string }): {
  id: string;
  dismiss: () => void;
} {
  const id = input.id ?? `mw-toast-${++toastSequence}`;
  const durationMs = input.durationMs ?? 5000;
  const record: ToastRecord = { ...input, id };
  memoryToasts = [record, ...memoryToasts.filter((t) => t.id !== id)].slice(0, TOAST_LIMIT);
  emitToasts();

  if (durationMs > 0 && typeof window !== "undefined") {
    const existing = dismissTimers.get(id);
    if (existing) clearTimeout(existing);
    dismissTimers.set(
      id,
      setTimeout(() => {
        dismissToast(id);
      }, durationMs),
    );
  }

  return {
    id,
    dismiss: () => dismissToast(id),
  };
}

export function useToast() {
  const [toasts, setToasts] = React.useState<readonly ToastRecord[]>(memoryToasts);

  React.useEffect(() => {
    toastListeners.add(setToasts);
    setToasts(memoryToasts);
    return () => {
      toastListeners.delete(setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: dismissToast,
  };
}

const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const ToastViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-label="Notifications"
      className={cn(
        "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-4 sm:right-4 sm:top-auto sm:flex-col md:max-w-[420px]",
        className,
      )}
      {...props}
    />
  ),
);
ToastViewport.displayName = "ToastViewport";

export interface ToastProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">, VariantProps<typeof toastVariants> {
  onDismiss?: (() => void) | undefined;
  skin?: SkinName | undefined;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", skin, onDismiss, children, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
    const liveRole = variant === "destructive" ? "alert" : "status";
    return (
      <div
        ref={ref}
        role={liveRole}
        aria-live={variant === "destructive" ? "assertive" : "polite"}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        data-variant={variant ?? "default"}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            onDismiss?.();
          }
          props.onKeyDown?.(event);
        }}
        className={cn(recipe.card, toastVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Toast.displayName = "Toast";

const ToastTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
  ),
);
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
  ),
);
ToastDescription.displayName = "ToastDescription";

const ToastAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      "inline-flex min-h-9 shrink-0 items-center justify-center rounded-[var(--mw-btn-radius,0.375rem)] border border-[var(--border)] bg-transparent px-3 text-xs font-medium transition-colors hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = "ToastAction";

const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    aria-label="Close"
    className={cn(
      "absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
      className,
    )}
    {...props}
  >
    <X aria-hidden="true" className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
));
ToastClose.displayName = "ToastClose";

function Toaster({ skin }: { skin?: SkinName }) {
  const { toasts, dismiss } = useToast();
  return (
    <ToastProvider>
      <ToastViewport>
        {toasts.map((item) => (
          <Toast
            key={item.id}
            variant={item.variant ?? "default"}
            skin={skin}
            onDismiss={() => dismiss(item.id)}
          >
            <div className="grid gap-1">
              {item.title ? <ToastTitle>{item.title}</ToastTitle> : null}
              {item.description ? <ToastDescription>{item.description}</ToastDescription> : null}
            </div>
            {item.action}
            <ToastClose onClick={() => dismiss(item.id)} />
          </Toast>
        ))}
      </ToastViewport>
    </ToastProvider>
  );
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  Toaster,
  toastVariants,
};
