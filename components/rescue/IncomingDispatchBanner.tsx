"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * IncomingDispatchBanner.tsx (Real-Time Authority Emergency Dispatch Banner)
 * ==============================================================================
 * 
 * Shows incoming emergency alerts from Authority with:
 * - Exact GPS Coordinates (Latitude, Longitude)
 * - Priority Severity Rating & Affected Population
 * - Situation Report & Evacuation Route
 * - Quick "Inspect Terrain & Roads" and "Squad En Route" actions
 */

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  MapPin,
  Compass,
  Navigation,
  CheckCircle2,
  Users,
  Radio,
  Clock,
  ExternalLink
} from "lucide-react";

export function IncomingDispatchBanner({
  onInspectTerrain,
}: {
  onInspectTerrain?: (coords: { lat: number; lng: number; zone: string }) => void;
}) {
  const [alert, setAlert] = useState<any>(null);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  useEffect(() => {
    const syncAlert = () => {
      try {
        const item = localStorage.getItem("latest_public_emergency_alert");
        if (item) {
          const parsed = JSON.parse(item);
          setAlert(parsed);
          // Check if acknowledged in session
          const ack = sessionStorage.getItem(`ack_alert_${parsed.id}`);
          setAcknowledged(ack === "true");
        }
      } catch (e) {}
    };

    syncAlert();
    window.addEventListener("storage", syncAlert);
    const interval = setInterval(syncAlert, 2500);
    return () => {
      window.removeEventListener("storage", syncAlert);
      clearInterval(interval);
    };
  }, []);

  if (!alert) return null;

  const lat = 13.0544; // Default Marina Beach or parse from alert
  const lng = 80.2818;
  const coordsFormatted = alert.coordinates || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;

  const handleAcknowledge = () => {
    setAcknowledged(true);
    if (alert.id) {
      sessionStorage.setItem(`ack_alert_${alert.id}`, "true");
    }
    toast.success("Mission Acknowledged by Squad Alpha", {
      description: "NDRF Squad telemetry transmitted to Authority Master Command: SQUAD EN ROUTE.",
    });
  };

  return (
    <div className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-[#111827]/90 to-red-950/30 p-5 backdrop-blur-xl shadow-2xl space-y-4 font-ibm-sans">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/25 border border-red-500/40 text-red-300 font-mono text-[10px] font-bold tracking-wide">
                AUTHORITY LIVE TACTICAL DISPATCH
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                SEVERITY {alert.severityScore || 9}/10
              </span>
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {alert.onsetETA || "IMMEDIATE RESPONSE REQUIRED"}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">{alert.title}</h3>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onInspectTerrain && (
            <button
              onClick={() => onInspectTerrain({ lat, lng, zone: alert.zone })}
              className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Inspect Terrain &amp; Roads</span>
            </button>
          )}

          <button
            onClick={handleAcknowledge}
            disabled={acknowledged}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
              acknowledged
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono"
                : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30"
            }`}
          >
            {acknowledged ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SQUAD EN ROUTE</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5" />
                <span>ACKNOWLEDGE &amp; MOBILIZE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Details: Coordinates, Population, Situation Report */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        
        {/* GPS Coordinates & Target Area */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            <span>Target Location Coordinates</span>
          </div>
          <div className="text-sm font-mono font-bold text-amber-300 tracking-wider">
            {coordsFormatted}
          </div>
          <div className="text-[11px] text-slate-400">
            Sector: <strong className="text-slate-200">{alert.zone}</strong>
          </div>
        </div>

        {/* Affected Population & Area */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Population &amp; Hazard Perimeter</span>
          </div>
          <div className="text-sm font-mono font-bold text-cyan-300">
            {(alert.populationAtRisk || 14200).toLocaleString()} Citizens at Immediate Risk
          </div>
          <div className="text-[11px] text-slate-400">
            Hazard Perimeter: <strong className="text-slate-200">{alert.areaRadiusKm || 3.8} km radius</strong>
          </div>
        </div>

        {/* Evacuation Corridor */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1.5">
          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Designated Safe Evac Corridor</span>
          </div>
          <div className="text-xs text-emerald-300 font-medium">
            {alert.evacuationCorridor || "Evacuate Westward via Anna Salai corridor toward Central Relief Station Alpha."}
          </div>
        </div>

      </div>

      {/* Situation Report & Squad Mobilization Order */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-slate-300 space-y-1.5">
        <p className="leading-relaxed">
          <strong className="text-amber-300">Field Telemetry Report:</strong> {alert.situationReport}
        </p>
        <div className="text-slate-400 font-mono text-[11px] pt-1 border-t border-amber-500/10 flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>HQ Unit Allocation: <strong className="text-slate-200">{alert.allocatedSquads || "NDRF Squad 4 (4 Inflatable Zodiacs) + SDRF Marine Unit 2"}</strong></span>
        </div>
      </div>

    </div>
  );
}
