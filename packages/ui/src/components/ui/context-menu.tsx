"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

interface ContextMenuState {
  open: boolean;
  position: { x: number; y: number };
  openAt: (x: number, y: number) => void;
  close: () => void;
}

const ContextMenuCtx = React.createContext<ContextMenuState | null>(null);

const ContextMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  const openAt = React.useCallback((x: number, y: number) => {
    setPosition({ x, y });
    setOpen(true);
  }, []);

  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = () => close();
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  return (
    <ContextMenuCtx.Provider value={{ open, position, openAt, close }}>
      {children}
    </ContextMenuCtx.Provider>
  );
};
ContextMenu.displayName = "ContextMenu";

const ContextMenuTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ onContextMenu, onKeyDown, ...props }, ref) => {
    const ctx = React.useContext(ContextMenuCtx);
    if (!ctx) throw new Error("ContextMenuTrigger must be used within ContextMenu");
    return (
      <div
        ref={ref}
        onContextMenu={(e) => {
          onContextMenu?.(e);
          if (!e.defaultPrevented) {
            e.preventDefault();
            ctx.openAt(e.clientX, e.clientY);
          }
        }}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (!e.defaultPrevented && (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10"))) {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            ctx.openAt(rect.left + 8, rect.bottom + 4);
          }
        }}
        {...props}
      />
    );
  },
);
ContextMenuTrigger.displayName = "ContextMenuTrigger";

const ContextMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { skin?: SkinName }
>(({ className, style, skin, children, ...props }, ref) => {
  const ctx = React.useContext(ContextMenuCtx);
  const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);
  if (!ctx || !ctx.open) return null;
  return (
    <div
      ref={ref}
      role="menu"
      data-skin={resolvedSkin}
      data-dna={dnaId}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: "fixed", left: ctx.position.x, top: ctx.position.y, ...style }}
      className={cn("z-50 min-w-[10rem] p-1 shadow-lg", recipe.selectContent, className)}
      {...props}
    >
      {children}
    </div>
  );
});
ContextMenuContent.displayName = "ContextMenuContent";

const ContextMenuItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { inset?: boolean }
>(({ className, inset, onClick, type = "button", ...props }, ref) => {
  const ctx = React.useContext(ContextMenuCtx);
  return (
    <button
      ref={ref}
      type={type}
      role="menuitem"
      onClick={(e) => {
        onClick?.(e);
        ctx?.close();
      }}
      className={cn(
        "flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-[var(--muted)] focus-visible:bg-[var(--muted)] disabled:pointer-events-none disabled:opacity-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
});
ContextMenuItem.displayName = "ContextMenuItem";

const ContextMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn("-mx-1 my-1 h-px bg-[var(--border)]", className)}
      {...props}
    />
  ),
);
ContextMenuSeparator.displayName = "ContextMenuSeparator";

const ContextMenuLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-xs font-semibold text-[var(--muted-foreground)]", className)}
      {...props}
    />
  ),
);
ContextMenuLabel.displayName = "ContextMenuLabel";

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
);
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuShortcut,
};
