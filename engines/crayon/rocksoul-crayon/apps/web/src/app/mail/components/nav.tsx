"use client"

import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    icon: LucideIcon;
    variant: "default" | "ghost";
  }[];
}

export function Nav({ links, isCollapsed }: NavProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav aria-label="Mail folders" className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={link.label ? `${link.title}, ${link.label}` : link.title}
                  aria-current={link.variant === "default" ? "page" : undefined}
                  className={cn(
                    buttonVariants({ variant: link.variant, size: "icon" }),
                    "size-10 cursor-pointer sm:size-9",
                    link.variant === "default" &&
                      "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                  )}
                >
                  <link.icon aria-hidden="true" className="size-4" />
                  <span className="sr-only">{link.title}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && (
                              <Badge className="ml-auto flex size-5 shrink-0 items-center justify-center rounded-full cursor-pointer">
              {link.label}
            </Badge>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              aria-label={link.label ? `${link.title}, ${link.label}` : link.title}
              aria-current={link.variant === "default" ? "page" : undefined}
              key={index}
              className={cn(
                buttonVariants({ variant: link.variant, size: "sm" }),
                link.variant === "default" &&
                  "group dark:bg-muted dark:text-foreground dark:hover:bg-muted dark:hover:text-foreground",
                "min-h-10 justify-start cursor-pointer sm:min-h-9"
              )}
            >
              <link.icon aria-hidden="true" className="mr-2 size-4" />
              {link.title}
              {link.label && (
                <span
                  className={cn(
                    "ml-auto",
                    link.variant === "default" &&
                      "text-background dark:text-muted-foreground"
                  )}
                >
                  {link.label}
                </span>
              )}
            </button>
          )
        )}
      </nav>
    </div>
  );
}
