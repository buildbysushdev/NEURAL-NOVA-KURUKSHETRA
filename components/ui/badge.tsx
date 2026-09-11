import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "safe" | "watch" | "critical" | "outline";
}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const dotColor = {
    safe: "bg-[#3B6D11]",
    watch: "bg-[#854F0B]",
    critical: "bg-[#791F1F]",
    default: "bg-[#8A99AD]",
    secondary: "bg-[#8A99AD]",
    outline: "bg-[#8A99AD]",
  };

  const hasStatusDot = variant === "safe" || variant === "watch" || variant === "critical";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-[#222933] bg-[#12161C] px-2 py-0.5 font-ibm-mono text-[11px] uppercase tracking-wider text-[#F6F4EF]",
        className
      )}
      {...props}
    >
      {hasStatusDot && (
        <span className={cn("inline-block w-1.5 h-1.5 rounded-full", dotColor[variant])} />
      )}
      <span>{children}</span>
    </div>
  );
}

export { Badge };
