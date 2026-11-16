import * as React from "react";
import { cn } from "../../lib/utils";
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"outline"|"ghost"|"secondary"; size?: "default"|"sm"|"lg" };
export const Button = React.forwardRef<HTMLButtonElement,ButtonProps>(({className,variant="default",size="default",...props},ref)=>{
  const variants={default:"bg-primary text-primary-foreground hover:opacity-90",outline:"border border-border bg-background hover:bg-accent",ghost:"hover:bg-accent",secondary:"bg-secondary text-secondary-foreground hover:opacity-90"};
  const sizes={default:"h-10 px-4 py-2",sm:"h-8 px-3 text-xs",lg:"h-11 px-8"};
  return <button ref={ref} className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",variants[variant],sizes[size],className)} {...props}/>;
});
Button.displayName="Button";
