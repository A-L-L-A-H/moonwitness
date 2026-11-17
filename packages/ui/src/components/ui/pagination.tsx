"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const Pagination = ({
  className,
  children,
  skin,
  ...props
}: React.ComponentProps<"nav"> & { skin?: SkinName }) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      {children ?? (
        <ul className="flex items-center space-x-1">
          <li>
            <PaginationPrevious />
          </li>
          <li>
            <PaginationNext />
          </li>
        </ul>
      )}
    </nav>
  );
};
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("flex items-center space-x-1", className)} {...props} />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />,
);
PaginationItem.displayName = "PaginationItem";

const PaginationLink = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { isActive?: boolean; skin?: SkinName }
>(({ className, isActive, skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  return (
    <a
      ref={ref}
      aria-current={isActive ? "page" : undefined}
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "flex min-h-11 min-w-11 items-center justify-center rounded-[var(--mw-btn-radius,0.375rem)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
        isActive && "bg-[var(--primary)] text-[var(--primary-foreground)]",
        className,
      )}
      {...props}
    />
  );
});
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { skin?: SkinName }
>(({ className, type = "button", skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  return (
    <button
      ref={ref}
      type={type}
      aria-label="Previous page"
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "flex min-h-11 min-w-11 items-center justify-center rounded-[var(--mw-btn-radius,0.375rem)] border border-[var(--border)] bg-[var(--background)] text-sm font-medium transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">Previous</span>
    </button>
  );
});
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { skin?: SkinName }
>(({ className, type = "button", skin, ...props }, ref) => {
  const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
  return (
    <button
      ref={ref}
      type={type}
      aria-label="Next page"
      data-skin={resolvedSkin}
      data-dna={dnaId}
      className={cn(
        "flex min-h-11 min-w-11 items-center justify-center rounded-[var(--mw-btn-radius,0.375rem)] border border-[var(--border)] bg-[var(--background)] text-sm font-medium transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <ChevronRight aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">Next</span>
    </button>
  );
});
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "flex h-9 w-9 items-center justify-center text-sm text-[var(--muted-foreground)]",
      className,
    )}
    {...props}
  >
    <span aria-hidden="true">&hellip;</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
