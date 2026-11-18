"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "../../icons";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { useComponentSkin } from "./skin-adapter";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  selected?: Date | undefined;
  defaultMonth?: Date | undefined;
  onSelect?: (date: Date) => void;
  minDate?: Date | undefined;
  maxDate?: Date | undefined;
  disabledDates?: (date: Date) => boolean;
  skin?: SkinName | undefined;
}

function isSameDay(a: Date | undefined, b: Date): boolean {
  if (!a) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      className,
      selected,
      defaultMonth,
      onSelect,
      minDate,
      maxDate,
      disabledDates,
      skin,
      ...props
    },
    ref,
  ) => {
    const [viewMonth, setViewMonth] = React.useState<Date>(() => {
      const base = selected ?? defaultMonth ?? new Date(2026, 0, 1);
      return new Date(base.getFullYear(), base.getMonth(), 1);
    });
    const { skin: resolvedSkin, dnaId, recipe } = useComponentSkin(skin);

    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthLabel = viewMonth.toLocaleString("en-US", { month: "long", year: "numeric" });

    const isDateDisabled = (date: Date): boolean => {
      if (
        minDate &&
        date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
      ) {
        return true;
      }
      if (
        maxDate &&
        date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
      ) {
        return true;
      }
      return Boolean(disabledDates?.(date));
    };

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

    return (
      <div
        ref={ref}
        data-skin={resolvedSkin}
        data-dna={dnaId}
        className={cn("w-[280px] p-3", recipe.card, className)}
        {...props}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--mw-btn-radius,0.25rem)] border border-[var(--border)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">{monthLabel}</span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--mw-btn-radius,0.25rem)] border border-[var(--border)] hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <div role="grid" aria-label={monthLabel} className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              role="columnheader"
              className="py-1 text-xs font-medium text-[var(--muted-foreground)]"
            >
              {day}
            </div>
          ))}
          {days.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} aria-hidden="true" className="h-8 w-8" />;
            }
            const isSelected = isSameDay(selected, date);
            const disabled = isDateDisabled(date);
            return (
              <button
                key={date.toISOString()}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={date.toDateString()}
                disabled={disabled}
                onClick={() => onSelect?.(date)}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-[var(--mw-btn-radius,0.25rem)] text-sm transition-colors hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-35",
                  isSelected &&
                    "bg-[var(--primary)] font-semibold text-[var(--primary-foreground)]",
                )}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
Calendar.displayName = "Calendar";

export { Calendar };
