import * as React from "react";
import { cn } from "../../lib/utils";

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number;
}

const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, className, style, children, ...props }, ref) => (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: "100%",
        paddingBottom: `${100 / ratio}%`,
        ...style,
      }}
      className={cn(
        "overflow-hidden rounded-[var(--mw-card-radius,0.5rem)] [clip-path:var(--mw-card-clip,none)]",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0">{children}</div>
    </div>
  ),
);
AspectRatio.displayName = "AspectRatio";

export { AspectRatio };
