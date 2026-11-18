"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "../../icons";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { Button } from "./button";
import { useComponentSkin } from "./skin-adapter";

interface CarouselContextValue {
  index: number;
  count: number;
  registerItem: () => number;
  canPrev: boolean;
  canNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (i: number) => void;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  skin?: SkinName;
  orientation?: "horizontal" | "vertical";
  defaultIndex?: number;
}

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      className,
      skin,
      orientation = "horizontal",
      defaultIndex = 0,
      children,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const [index, setIndex] = React.useState(defaultIndex);
    const [count, setCount] = React.useState(0);
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);

    const registerItem = React.useCallback(() => {
      let assigned = 0;
      setCount((c) => {
        assigned = c;
        return c + 1;
      });
      return assigned;
    }, []);

    const canPrev = index > 0;
    const canNext = index < Math.max(0, count - 1);
    const scrollPrev = React.useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
    const scrollNext = React.useCallback(
      () => setIndex((i) => Math.min(Math.max(0, count - 1), i + 1)),
      [count],
    );
    const scrollTo = React.useCallback(
      (target: number) => setIndex(Math.max(0, Math.min(Math.max(0, count - 1), target))),
      [count],
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "ArrowLeft" || (orientation === "vertical" && event.key === "ArrowUp")) {
        event.preventDefault();
        scrollPrev();
      } else if (
        event.key === "ArrowRight" ||
        (orientation === "vertical" && event.key === "ArrowDown")
      ) {
        event.preventDefault();
        scrollNext();
      }
    };

    return (
      <CarouselContext.Provider
        value={{ index, count, registerItem, canPrev, canNext, scrollPrev, scrollNext, scrollTo }}
      >
        <div
          ref={ref}
          role="region"
          aria-roledescription="carousel"
          data-skin={resolvedSkin}
          data-dna={dnaId}
          onKeyDown={handleKeyDown}
          className={cn("relative", className)}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(CarouselContext);
    const offset = ctx ? ctx.index * 100 : 0;
    return (
      <div className="overflow-hidden">
        <div
          ref={ref}
          style={{ transform: `translateX(-${offset}%)` }}
          className={cn(
            "flex transition-transform duration-300 motion-reduce:transition-none",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  },
);
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const ctx = React.useContext(CarouselContext);
    React.useEffect(() => {
      ctx?.registerItem();
      // Register once on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
        {...props}
      />
    );
  },
);
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const ctx = React.useContext(CarouselContext);
    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        aria-label="Previous slide"
        disabled={!ctx?.canPrev || props.disabled}
        onClick={(e) => {
          props.onClick?.(e);
          if (!e.defaultPrevented) ctx?.scrollPrev();
        }}
        className={cn("absolute left-2 top-1/2 -translate-y-1/2", className)}
        {...props}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    );
  },
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const ctx = React.useContext(CarouselContext);
    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        aria-label="Next slide"
        disabled={!ctx?.canNext || props.disabled}
        onClick={(e) => {
          props.onClick?.(e);
          if (!e.defaultPrevented) ctx?.scrollNext();
        }}
        className={cn("absolute right-2 top-1/2 -translate-y-1/2", className)}
        {...props}
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  },
);
CarouselNext.displayName = "CarouselNext";

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };
