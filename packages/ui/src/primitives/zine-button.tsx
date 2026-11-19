import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../cn";

export type ZineTone = "pink" | "yellow" | "blue" | "paper";

const TONE_CLASS: Record<ZineTone, string> = {
  pink: "",
  yellow: "btn-yellow",
  blue: "btn-blue",
  paper: "btn-paper",
};

export interface ZineButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ZineTone;
  asChild?: boolean;
}

export function ZineButton({
  tone = "pink",
  asChild = false,
  className,
  type = "button",
  ...props
}: ZineButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn("btn-zine", TONE_CLASS[tone], className)}
      {...props}
    />
  );
}
