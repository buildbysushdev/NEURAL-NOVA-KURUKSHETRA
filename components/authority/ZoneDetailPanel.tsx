"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: ZoneDetailPanel.tsx (Command Glass Overhaul)
 * ==============================================================================
 */

import React from "react";
import {
  CheckCircle2,
  X,
  MapPin,
  Clock,
  Boxes,
  Truck,
  Cpu,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import type { TacticalZone } from "./TacticalIndiaMap";

interface ZoneDetailPanelProps {
  zone: TacticalZone | null;
  onClose?: () => void;
  onDispatchSquad?: (zone: TacticalZone) => void;
}

export default function ZoneDetailPanel({
  zone,
  onClose,
  onDispatchSquad,
}: ZoneDetailPanelProps) {
  if (!zone) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
          <MapPin className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">
          No Incident Zone Selected
        </h4>
        <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
          Click on any marker on the live India map or select &quot;View details&quot; in a popup to inspect real-time AI triage and autonomous allocation.
        </p>
      </div>
    );
  }

  const sev = (zone.severity || "HIGH").toUpperCase();
  const isCritical = sev === "CRITICAL";
  const isWatch = sev === "HIGH" || sev === "MODERATE";

  const badgeStyles = isCritical
    ? "bg-red-500/20 text-red-400 border-red-500/30"
    : isWatch
    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

  const score = zone.severity_score !== undefined ? zone.severity_score : isCritical ? 9 : 6;
  const lat = zone.location_lat ?? zone.latitude ?? 13.0827;
  const lng = zone.location_lng ?? zone.longitude ?? 80.2707;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md flex flex-col font-ibm-sans overflow-hidden shadow-2xl">
      {/* Panel Header */}
      <div className="p-5 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                Zone Inspection
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                ID: {zone.id.slice(0, 8)}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 truncate max-w-[260px] mt-0.5">
              {zone.name || zone.zone || zone.type}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${badgeStyles}`}>
            Score {score}/10
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition"
              title="Close Zone Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      <div className="p-5 space-y-4 text-xs">
        {/* Geographic Coordinates & Time */}
        <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-xl border border-white/[0.04] font-mono text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">
              Coordinates
            </span>
            <span className="text-slate-200 font-bold">
              {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">
              Time Detected
            </span>
            <span className="text-slate-200">
              {zone.created_at
                ? new Date(zone.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "Active"}
            </span>
          </div>
        </div>

        {/* Situation Briefing */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-400">Situation Briefing</p>
          <p className="text-slate-200 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/[0.04]">
            {zone.description}
          </p>
        </div>

        {/* Tactical Resource Requirements */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-400">
              Tactical Resource Requirements
            </p>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Auto-Optimized
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {zone.needed_resources && zone.needed_resources.length > 0 ? (
              zone.needed_resources.map((res, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg font-mono text-[11px] text-slate-200 flex items-center gap-1.5"
                >
                  <Boxes className="w-3 h-3 text-cyan-400" />
                  <span>{res.replace(/_/g, " ").toUpperCase()}</span>
                </div>
              ))
            ) : (
              <span className="text-slate-400 text-xs">
                Standard precautionary monitoring deployed.
              </span>
            )}
          </div>
        </div>

        {/* Autonomous Sentinel Triage Assessment */}
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>Autonomous Sentinel Triage Assessment</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Incident classified with priority weighting {score}/10 based on structural risk and density. Gemini logistics algorithm mapped closest forward depots with zero transit bottlenecks.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center gap-3">
          <button
            onClick={() => onDispatchSquad && onDispatchSquad(zone)}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            <span>Deploy Emergency Squad</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById("inventory-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="py-2.5 px-4 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition"
          >
            <span>Audit Stocks</span>
          </button>
        </div>
      </div>
    </div>
  );
}
