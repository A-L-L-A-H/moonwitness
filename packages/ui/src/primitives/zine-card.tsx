import type { HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../cn";

export interface ZineCardProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export function ZineCard({ asChild = false, className, ...props }: ZineCardProps) {
  const Comp = asChild ? Slot : "div";
  return <Comp className={cn("zine-card", className)} {...props} />;
}

export function ZineCardRough({ asChild = false, className, ...props }: ZineCardProps) {
  const Comp = asChild ? Slot : "div";
  return <Comp className={cn("zine-card-rough", className)} {...props} />;
}
