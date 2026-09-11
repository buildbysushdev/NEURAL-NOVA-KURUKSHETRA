"use client";

import React from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  statusIndicator?: "live" | "offline";
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  statusIndicator = "live",
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="flex-1">
        {/* Eyebrow with live pulse indicator */}
        <div className="flex items-center gap-2 mb-2">
          {statusIndicator === "live" && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" />
          )}
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            {eyebrow}
          </p>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight leading-tight mb-1.5">
          {title}
        </h1>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>

      {/* Actions Slot */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
