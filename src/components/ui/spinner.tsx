
import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("animate-spin rounded-full border-2 border-t-transparent", className)}
      {...props}
    />
  )
);

Spinner.displayName = "Spinner";
