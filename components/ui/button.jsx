import * as React from "react";
import { cn } from "@/lib/utils";

const Button = React.forwardRef(
  ({ className, variant = "secondary", size = "default", ...props }, ref) => {
    const variants = {
      primary:
        "bg-[#F6F4EF] text-[#12161C] hover:bg-white active:bg-[#E5E1D8] font-semibold border border-transparent shadow-none",
      secondary:
        "bg-transparent text-[#F6F4EF] border border-[#222933] hover:bg-[#1B222B] hover:border-[#384454] active:bg-[#141920]",
      destructive:
        "bg-[#791F1F] text-[#F6F4EF] border border-[#791F1F] hover:bg-[#922626] active:bg-[#681919]",
      default:
        "bg-[#F6F4EF] text-[#12161C] hover:bg-white active:bg-[#E5E1D8] font-semibold border border-transparent",
      outline:
        "bg-transparent text-[#F6F4EF] border border-[#222933] hover:bg-[#1B222B] hover:border-[#384454]",
    };

    const sizes = {
      default: "h-9 px-4 py-2 text-xs uppercase tracking-wider font-semibold",
      sm: "h-7 px-2.5 text-[11px] uppercase tracking-wider font-medium",
      lg: "h-11 px-6 text-sm uppercase tracking-wider font-bold",
      icon: "h-8 w-8 p-0",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-sm select-none transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F4EF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#12161C]",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          variants[variant] || variants.secondary,
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
