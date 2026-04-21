import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Container with responsive max-width and padding.
 */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl p-2 md:p-6", className)} {...props} />;
}
