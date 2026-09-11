"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: ZoneDetailPanel.tsx
 * ==============================================================================
 * 
 * Strict Institutional Design System:
 * - Base: #181E26, Border: #222933, Text: #F6F4EF
 * - Severity Strips: #791F1F (Critical), #854F0B (Watch), #3B6D11 (Safe)
 * - Typography: IBM Plex Sans (UI) & IBM Plex Mono (Coordinates, IDs, Timestamps)
 */

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  X,
  MapPin,
  Clock,
  Boxes,
  ShieldCheck,
  Radio,
  Truck,
  Cpu,
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
      <div className="border border-[#222933] bg-[#181E26] rounded-sm p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-[#141920] border border-[#222933] flex items-center justify-center mx-auto text-[#8A99AD]">
          <MapPin className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <h4 className="font-mono text-xs uppercase font-bold text-[#F6F4EF] tracking-wider">
          No Incident Zone Selected
        </h4>
        <p className="text-xs text-[#8A99AD] max-w-[260px] mx-auto leading-relaxed">
          Select any marker on the India Tactical Map or click &quot;View details&quot; in a popup to inspect real-time AI triage and logistics.
        </p>
      </div>
    );
  }

  const sev = (zone.severity || "HIGH").toUpperCase();
  const isCritical = sev === "CRITICAL";
  const isWatch = sev === "HIGH" || sev === "MODERATE";

  const borderColor = isCritical
    ? "border-l-[#791F1F]"
    : isWatch
    ? "border-l-[#854F0B]"
    : "border-l-[#3B6D11]";

  const badgeBg = isCritical
    ? "bg-[#791F1F] text-white border-[#A83232]"
    : isWatch
    ? "bg-[#854F0B] text-white border-[#B26B10]"
    : "bg-[#3B6D11] text-white border-[#559E18]";

  const score = zone.severity_score !== undefined ? zone.severity_score : isCritical ? 9 : 6;
  const lat = zone.location_lat ?? zone.latitude ?? 13.0827;
  const lng = zone.location_lng ?? zone.longitude ?? 80.2707;

  return (
    <div className={`border border-[#222933] border-l-4 ${borderColor} bg-[#181E26] rounded-sm flex flex-col font-ibm-sans overflow-hidden shadow-lg`}>
      {/* Panel Header */}
      <div className="p-4 border-b border-[#222933] bg-[#141920] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={
                isCritical
                  ? "dot-critical"
                  : isWatch
                  ? "dot-watch"
                  : "dot-safe"
              }
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A99AD]">
              ZONE INSPECTION // ID: {zone.id.slice(0, 8)}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#F6F4EF] truncate max-w-[280px]">
            {zone.name || zone.zone || zone.type}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${badgeBg}`}>
            SCORE {score}/10
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-[#8A99AD] hover:text-[#F6F4EF] hover:bg-[#222933] rounded transition"
              title="Close Zone Inspector"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body */}
      <div className="p-4 space-y-4 text-xs">
        {/* Geo Telemetry */}
        <div className="grid grid-cols-2 gap-2 bg-[#12161C] p-2.5 rounded border border-[#222933] font-mono text-[11px]">
          <div>
            <span className="text-[#8A99AD] block text-[10px]">COORDINATES</span>
            <span className="text-[#F6F4EF] font-bold">
              {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
            </span>
          </div>
          <div>
            <span className="text-[#8A99AD] block text-[10px]">TIME RECORDED</span>
            <span className="text-[#F6F4EF]">
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

        {/* Incident Narrative */}
        <div className="space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A99AD] block">
            Situation Briefing
          </span>
          <p className="text-[#F6F4EF] leading-relaxed bg-[#141920] p-3 rounded border border-[#222933]">
            {zone.description}
          </p>
        </div>

        {/* Extracted Needs & Allocation Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A99AD]">
              Tactical Resource Requirements
            </span>
            <span className="font-mono text-[10px] text-[#3B6D11] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Auto-Optimized
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {zone.needed_resources && zone.needed_resources.length > 0 ? (
              zone.needed_resources.map((res, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 bg-[#12161C] border border-[#222933] rounded font-mono text-[10px] text-[#F6F4EF] flex items-center gap-1.5"
                >
                  <Boxes className="w-3 h-3 text-[#38BDF8]" strokeWidth={1.75} />
                  <span>{res.replace(/_/g, " ").toUpperCase()}</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-[#8A99AD] font-mono">
                Standard perimeter monitoring resources deployed.
              </span>
            )}
          </div>
        </div>

        {/* AI Autonomous Triage Box */}
        <div className="border border-[#222933] bg-[#141920] p-3 rounded space-y-1.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8A99AD] uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-[#A78BFA]" />
            <span>Autonomous Sentinel Triage Assessment</span>
          </div>
          <p className="text-[11px] text-[#CBD5E1] leading-relaxed">
            Incident classified with priority weighting {score}/10 based on structural risk and population vulnerability. Gemini logistics algorithm routed closest forward supply from Central Logistics Hub.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-[#222933] flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onDispatchSquad && onDispatchSquad(zone)}
            className="flex-1 h-8 text-[11px] font-bold tracking-wider uppercase bg-[#F6F4EF] text-[#12161C] hover:bg-white flex items-center justify-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Deploy Immediate Squad</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const el = document.getElementById("inventory-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="h-8 text-[11px] font-mono text-[#F6F4EF] border-[#222933] bg-[#12161C] hover:bg-[#181E26]"
          >
            <span>Audit Stocks</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
