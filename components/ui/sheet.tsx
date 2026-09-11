import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right";
  title?: string;
  description?: string;
}

export function Sheet({
  open,
  onOpenChange,
  children,
  side = "left",
  title,
  description,
}: SheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-50 flex h-full w-3/4 max-w-sm flex-col bg-slate-950 border-slate-800 p-6 shadow-2xl transition ease-in-out",
          side === "left" ? "border-r" : "ml-auto border-l"
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            {title && <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>}
            {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">{children}</div>
      </div>
    </div>
  );
}
