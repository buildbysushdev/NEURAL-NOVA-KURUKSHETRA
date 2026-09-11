"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  color: "blue" | "emerald" | "violet" | "red" | "amber";
  trend?: { direction: "up" | "down"; value: string } | string;
  onClick?: () => void;
  infoTooltip?: React.ReactNode;
}

const colorMap = {
  blue: {
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    glow: "bg-blue-500",
    strip: "bg-blue-500",
    valueGlow: "drop-shadow-[0_0_12px_rgba(59,130,246,0.25)]",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    glow: "bg-emerald-500",
    strip: "bg-emerald-500",
    valueGlow: "drop-shadow-[0_0_12px_rgba(16,185,129,0.25)]",
  },
  violet: {
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    glow: "bg-violet-500",
    strip: "bg-violet-500",
    valueGlow: "drop-shadow-[0_0_12px_rgba(139,92,246,0.25)]",
  },
  red: {
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    glow: "bg-red-500",
    strip: "bg-red-500",
    valueGlow: "drop-shadow-[0_0_12px_rgba(239,68,68,0.25)]",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    glow: "bg-amber-500",
    strip: "bg-amber-500",
    valueGlow: "drop-shadow-[0_0_12px_rgba(245,158,11,0.25)]",
  },
};

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick,
  infoTooltip,
}: StatCardProps) {
  const c = colorMap[color] || colorMap.blue;

  const trendObj =
    typeof trend === "string"
      ? { direction: trend.includes("-") ? ("down" as const) : ("up" as const), value: trend }
      : trend;

  return (
    <div
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-2xl 
        border border-white/[0.06] bg-white/[0.02]
        hover:bg-white/[0.04] hover:border-white/[0.10]
        transition-all duration-300 backdrop-blur-md
        ${onClick ? "cursor-pointer" : "cursor-default"}
      `}
    >
      {/* Colored ambient gradient blob in corner */}
      <div
        className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${c.glow}`}
      />

      {/* Left severity strip */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${c.strip} opacity-70`}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider font-mono">
              {label}
            </p>
            {infoTooltip}
          </div>
          <div
            className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}
          >
            <Icon className={`w-[18px] h-[18px] ${c.iconColor}`} strokeWidth={1.75} />
          </div>
        </div>

        {/* Big value */}
        <div className="flex items-baseline gap-2">
          <p
            className={`text-3xl sm:text-4xl font-bold text-slate-100 font-mono tabular-nums tracking-tight ${c.valueGlow}`}
          >
            {value}
          </p>
          {trendObj && (
            <span
              className={`text-xs font-medium font-mono ${
                trendObj.direction === "up" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {trendObj.direction === "up" ? "↑" : "↓"} {trendObj.value}
            </span>
          )}
        </div>

        {/* Subtitle */}
        <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
      </div>
    </div>
  );
}

export default StatCard;
