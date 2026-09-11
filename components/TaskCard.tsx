"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: TaskCard.tsx (Rescue Team Mission & Field Action Card)
 * ==============================================================================
 * 
 * Command Glass Design System:
 * - Frosted glass surface (bg-white/[0.02] with white/[0.06] border)
 * - Severity-coded left accent border with ambient glow
 * - Dynamic status indicators: Open, En Route, Resolved
 * - Required equipment/resource tags with count pills
 * - One-click GPS navigation opening Google Maps directly
 * - Dynamic mission resolution trigger with automated reallocation callback
 */

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Boxes,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Check
} from "lucide-react";

export interface RescueTask {
  id: string;
  type: string;
  description: string;
  latitude?: number;
  longitude?: number;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  zone?: string;
  severity?: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | string;
  severity_score?: number;
  status: "open" | "assigned" | "in_progress" | "resolved" | "help_requested" | string;
  required_resources?: string[];
  needed_resources?: string[];
  assigned_to?: string;
  created_at?: string;
  victim_count?: number;
}

interface TaskCardProps {
  task: RescueTask;
  onAccept?: (taskId: string) => Promise<void> | void;
  onComplete?: (taskId: string) => Promise<void> | void;
  onRequestHelp?: (taskId: string) => Promise<void> | void;
}

export default function TaskCard({
  task,
  onAccept,
  onComplete,
  onRequestHelp,
}: TaskCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const score = task.severity_score !== undefined ? Number(task.severity_score) : 7;
  const isCritical = score >= 8 || task.severity === "CRITICAL";
  const isWatch = (score >= 5 && score < 8) || task.severity === "HIGH" || task.severity === "MODERATE";

  const severityStyles = isCritical
    ? {
        strip: "border-l-[3px] border-l-red-500 shadow-[-1px_0_15px_rgba(239,68,68,0.15)]",
        badge: "bg-red-500/15 text-red-400 border border-red-500/30",
        dot: "bg-red-400 animate-pulse-live",
        label: "CRITICAL",
      }
    : isWatch
    ? {
        strip: "border-l-[3px] border-l-amber-500 shadow-[-1px_0_15px_rgba(245,158,11,0.15)]",
        badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        dot: "bg-amber-400",
        label: "WATCH",
      }
    : {
        strip: "border-l-[3px] border-l-emerald-500 shadow-[-1px_0_15px_rgba(16,185,129,0.15)]",
        badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        dot: "bg-emerald-400",
        label: "SAFE",
      };

  const lat = task.latitude ?? task.location_lat ?? 13.0827;
  const lng = task.longitude ?? task.location_lng ?? 80.2707;

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAction = async (actionType: "accept" | "complete" | "help") => {
    setLoadingAction(actionType);
    try {
      if (actionType === "accept" && onAccept) await onAccept(task.id);
      if (actionType === "complete" && onComplete) await onComplete(task.id);
      if (actionType === "help" && onRequestHelp) await onRequestHelp(task.id);
    } finally {
      setLoadingAction(null);
    }
  };

  const isResolved = task.status === "resolved";
  const isInProgress = task.status === "in_progress";

  const resources = task.required_resources || task.needed_resources || [];

  return (
    <div
      className={`
        rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]
        ${severityStyles.strip} p-5 text-slate-100 backdrop-blur-md
        transition-all duration-300 flex flex-col justify-between
      `}
    >
      <div>
        {/* Header: Type, Zone & Severity Pill */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`w-2 h-2 rounded-full ${severityStyles.dot}`} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {task.zone || "TACTICAL SECTOR"}
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="font-mono text-[10px] text-slate-500">
                ID: {task.id.slice(0, 8)}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 capitalize tracking-tight">
              {task.type.replace(/_/g, " ")}
            </h3>
          </div>

          <div className="flex flex-col items-end flex-shrink-0">
            <span
              className={`font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg ${severityStyles.badge}`}
            >
              SEV {score}/10
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 mt-1">
              {isResolved ? "RESOLVED" : isInProgress ? "EN ROUTE" : "DISPATCH READY"}
            </span>
          </div>
        </div>

        {/* Description & Location Coordinates */}
        <div className="py-3.5 space-y-2.5 text-xs">
          <p className="text-slate-300 leading-relaxed line-clamp-3">
            {task.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-black/20 p-2.5 rounded-xl border border-white/[0.03]">
            <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate flex-1">{task.location_name || "Grid Coordinates"}</span>
            <span className="font-mono text-[10px] text-slate-500">
              {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
            </span>
          </div>

          {/* Required Resource Tags */}
          {resources.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <Boxes className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">Required:</span>
              {resources.map((res) => (
                <span
                  key={res}
                  className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-slate-300"
                >
                  {res.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleOpenGoogleMaps}
          className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 transition flex items-center gap-1.5"
        >
          <Navigation className="w-3.5 h-3.5 text-blue-400" />
          <span>Navigate</span>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {!isResolved && !isInProgress && (
            <button
              type="button"
              disabled={loadingAction === "accept"}
              onClick={() => handleAction("accept")}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5 disabled:opacity-60"
            >
              {loadingAction === "accept" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" />
                  <span>Accept Mission</span>
                </>
              )}
            </button>
          )}

          {isInProgress && (
            <button
              type="button"
              disabled={loadingAction === "complete"}
              onClick={() => handleAction("complete")}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 disabled:opacity-60"
            >
              {loadingAction === "complete" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </>
              )}
            </button>
          )}

          {isResolved && (
            <span className="font-mono text-xs text-emerald-400 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              MISSION RESOLVED
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
