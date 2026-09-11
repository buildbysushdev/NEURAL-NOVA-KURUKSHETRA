import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-red-950/80 text-red-400 border border-red-800/60",
    warning: "border-transparent bg-amber-950/80 text-amber-400 border border-amber-800/60",
    success: "border-transparent bg-emerald-950/80 text-emerald-400 border border-emerald-800/60",
    outline: "text-foreground border border-border",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
