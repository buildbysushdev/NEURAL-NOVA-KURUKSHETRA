import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "warning" | "success" | "outline" | "critical" | "safe";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-slate-800 bg-slate-900 text-slate-200",
    secondary: "border-slate-800 bg-slate-800/80 text-slate-300",
    destructive: "border-red-500/40 bg-red-950/80 text-red-400 shadow-sm",
    critical: "border-red-500/60 bg-red-950/90 text-red-300 font-bold tracking-wider animate-pulse shadow-sm shadow-red-950/50",
    warning: "border-amber-500/40 bg-amber-950/80 text-amber-300 shadow-sm",
    success: "border-emerald-500/40 bg-emerald-950/80 text-emerald-300 shadow-sm",
    safe: "border-emerald-500/60 bg-emerald-950/90 text-emerald-300 font-bold tracking-wider shadow-sm",
    outline: "text-slate-300 border-slate-700 hover:bg-slate-800/40",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
