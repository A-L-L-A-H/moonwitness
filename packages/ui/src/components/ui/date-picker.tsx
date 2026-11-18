"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  skin?: SkinName;
  "aria-label"?: string;
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = "Pick a date",
      disabled = false,
      className,
      skin,
      "aria-label": ariaLabel,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            skin={skin}
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-[var(--muted-foreground)]",
              className,
            )}
          >
            <CalendarIcon aria-hidden="true" className="mr-2 h-4 w-4" />
            {value ? value.toLocaleDateString("en-US", { dateStyle: "medium" }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent skin={skin} className="w-auto p-0" align="start">
          <Calendar
            skin={skin}
            selected={value}
            onSelect={(next) => {
              onChange?.(next);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  },
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
