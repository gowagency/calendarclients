"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";
import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-[var(--border-strong)]", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-[var(--text-primary)] transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
