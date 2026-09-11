"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, X, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";

export interface FeatureInfoTooltipProps {
  title: string;
  description: string;
  useCase: string;
  techNote?: string;
  theme?: "light" | "dark";
  size?: "sm" | "md";
  align?: "left" | "right" | "center";
  className?: string;
}

export function FeatureInfoTooltip({
  title,
  description,
  useCase,
  techNote,
  theme = "light",
  size = "sm",
  align = "center",
  className = "",
}: FeatureInfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const isDark = theme === "dark";

  // Position alignment classes
  const alignmentClass =
    align === "left"
      ? "left-0"
      : align === "right"
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={`Information on ${title}`}
        title={`Click for feature info: ${title}`}
        className={`inline-flex items-center justify-center rounded-full transition-all focus:outline-none focus:ring-2 ${
          size === "sm" ? "w-4 h-4 text-[10px]" : "w-5 h-5 text-xs"
        } ${
          isDark
            ? "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 hover:text-cyan-200 border border-cyan-400/30 focus:ring-cyan-400/40"
            : "bg-blue-100/90 text-blue-700 hover:bg-blue-200 hover:text-blue-900 border border-blue-300 focus:ring-blue-400/40"
        } ${isOpen ? "ring-2 ring-blue-400 scale-105" : ""}`}
      >
        <span className="font-serif font-bold italic select-none">i</span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 z-[999] w-72 sm:w-80 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border text-left transition-all animate-in fade-in zoom-in-95 duration-150 ${alignmentClass} ${
            isDark
              ? "bg-slate-900/95 border-cyan-500/30 text-slate-100 shadow-cyan-950/50"
              : "bg-white/98 border-slate-200 text-slate-900 shadow-slate-900/20"
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200/40 dark:border-white/10 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs ${
                  isDark ? "bg-cyan-500/20 text-cyan-300" : "bg-blue-100 text-blue-700"
                }`}
              >
                <Info className="w-3 h-3" />
              </span>
              <h4 className="text-xs font-bold font-mono tracking-tight leading-snug">
                {title}
              </h4>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-2 text-[11px] leading-relaxed">
            <div>
              <span className="font-semibold text-slate-500 dark:text-slate-400 block uppercase text-[9px] tracking-wider font-mono mb-0.5">
                Functionality
              </span>
              <p className={isDark ? "text-slate-200" : "text-slate-700"}>
                {description}
              </p>
            </div>

            <div
              className={`p-2 rounded-xl border ${
                isDark
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                  : "bg-amber-50 border-amber-200/80 text-amber-900"
              }`}
            >
              <span className="font-bold flex items-center gap-1 text-[9px] uppercase tracking-wider font-mono mb-0.5">
                <ShieldAlert className="w-3 h-3" /> Disaster Use Case
              </span>
              <p className="text-[10.5px] leading-tight font-medium">
                {useCase}
              </p>
            </div>

            {techNote && (
              <div
                className={`p-1.5 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 ${
                  isDark
                    ? "bg-cyan-950/40 border-cyan-500/20 text-cyan-300"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                }`}
              >
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                <span>{techNote}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default FeatureInfoTooltip;
