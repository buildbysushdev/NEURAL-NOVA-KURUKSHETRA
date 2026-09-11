"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: ZoneDetailPanel.tsx (Tactical Zone Inspector with Analyst Agent Telemetry)
 * ==============================================================================
 * 
 * Embeds deep physical parameters, escalation prediction, demographic impact,
 * and actionable evacuation directives via RichAlertCard.
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
  Shield,
  Activity
} from "lucide-react";
import type { TacticalZone } from "./TacticalIndiaMap";
import { RichAlertCard } from "@/components/notifications/RichAlertCard";
import { generateFallbackAnalysis } from "@/lib/agents/analyst";

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
          <MapPin className="w-6 h-6 text-blue-400" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">
          No Incident Zone Selected
        </h4>
        <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
          Click on any marker on the live India map or select a sector from the telemetry feed to inspect real-time AI triage and physical parameter analysis.
        </p>
      </div>
    );
  }

  const sev = (zone.severity || "HIGH").toUpperCase();
  const isCritical = sev === "CRITICAL";
  const isWatch = sev === "HIGH" || sev === "MODERATE";

  const score = zone.severity_score !== undefined ? zone.severity_score : isCritical ? 9 : 6;
  const lat = zone.location_lat ?? zone.latitude ?? 13.0827;
  const lng = zone.location_lng ?? zone.longitude ?? 80.2707;

  // Generate enriched analysis if not already attached to zone
  const analysis = React.useMemo(() => {
    const rawEnriched = (zone as any).enriched_data;
    if (rawEnriched && Object.keys(rawEnriched).length > 0) {
      return {
        enriched_data: (zone as any).enriched_data,
        prediction_data: (zone as any).prediction_data,
        impact_data: (zone as any).impact_data,
        recommended_actions: (zone as any).recommended_actions,
      };
    }
    return generateFallbackAnalysis({
      incidentId: zone.id,
      type: zone.type || "Disaster Event",
      description: zone.description,
      location: { lat, lng },
      locationName: zone.name || zone.zone,
      severityScore: score,
    });
  }, [zone, score, lat, lng]);

  const richIncident = {
    id: zone.id,
    type: zone.type || "Hazard Incident",
    location_name: zone.name || zone.zone || "Sector Grid",
    description: zone.description,
    severity_score: score,
    enriched_data: analysis.enriched_data,
    prediction_data: analysis.prediction_data,
    impact_data: analysis.impact_data,
    recommended_actions: analysis.recommended_actions,
    created_at: zone.created_at || new Date().toISOString(),
  };

  return (
    <div className="space-y-4 font-ibm-sans">
      {/* Top Bar with Close Button */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-live" />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
            Sector Telemetry Inspector
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Embed Full RichAlertCard Component */}
      <RichAlertCard incident={richIncident} />

      {/* Quick Action Controls */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => onDispatchSquad && onDispatchSquad(zone)}
          className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          <span>Dispatch Emergency Squad</span>
        </button>

        <button
          onClick={() => {
            const el = document.getElementById("inventory-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="py-3 px-4 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition whitespace-nowrap"
        >
          <span>Audit Stocks</span>
        </button>
      </div>
    </div>
  );
}
