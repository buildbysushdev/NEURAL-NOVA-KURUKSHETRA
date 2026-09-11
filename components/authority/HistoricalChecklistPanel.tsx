"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Package,
  Shield,
  Sparkles,
  Loader2,
  Send,
  AlertOctagon,
  ChevronRight,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { ChecklistItem, TacticalChecklistResponse } from "@/lib/ai/checklist-agent";

interface HistoricalChecklistPanelProps {
  selectedZoneType?: string;
  selectedZoneLocation?: string;
}

export function HistoricalChecklistPanel({
  selectedZoneType = "flood",
  selectedZoneLocation = "Marina Waterfront Sector B, Chennai",
}: HistoricalChecklistPanelProps) {
  const [incidentType, setIncidentType] = useState<string>(selectedZoneType);
  const [location, setLocation] = useState<string>(selectedZoneLocation);
  const [severity, setSeverity] = useState<string>("critical");
  const [loading, setLoading] = useState<boolean>(false);
  const [checklistData, setChecklistData] = useState<TacticalChecklistResponse | null>(null);
  const [ratifiedItems, setRatifiedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedZoneType) setIncidentType(selectedZoneType.toLowerCase());
    if (selectedZoneLocation) setLocation(selectedZoneLocation);
  }, [selectedZoneType, selectedZoneLocation]);

  const handleGenerateChecklist = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/historical-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_type: incidentType,
          severity,
          location,
        }),
      });
      const data: TacticalChecklistResponse = await res.json();
      setChecklistData(data);
      toast.success("Tactical Precedent Checklist Generated", {
        description: `Correlated against ${data.matched_disasters.length} historical Indian catastrophes.`,
      });
    } catch (err: any) {
      toast.error("Failed to generate checklist", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate initial checklist on first mount
  useEffect(() => {
    handleGenerateChecklist();
  }, []);

  const handleRatify = (itemId: string, actionTitle: string) => {
    setRatifiedItems((prev) => ({ ...prev, [itemId]: true }));
    toast.success("Action Item Ratified & Dispatched", {
      description: `Task routed to Field Responders: "${actionTitle.slice(0, 45)}..."`,
    });
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "evacuation":
        return "bg-blue-500/15 text-blue-300 border-blue-500/30";
      case "medical":
        return "bg-red-500/15 text-red-300 border-red-500/30";
      case "logistics":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "communications":
        return "bg-purple-500/15 text-purple-300 border-purple-500/30";
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">
            Historical Disaster AI Checklist
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
          RAG Knowledge Engine
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Cross-references incoming incident parameters against 12+ verified Indian disasters (Kerala 2018, Fani 2019, Chennai 2015, Bhuj 2001) to generate actionable tactical commands citing verified historical precedents.
      </p>

      {/* Query Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div>
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Hazard Type
          </label>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className="w-full h-8 rounded-lg border border-white/[0.08] bg-slate-900/90 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="flood">Flood / Storm Surge</option>
            <option value="cyclone">Cyclone / Gale Winds</option>
            <option value="earthquake">Earthquake / Tremor</option>
            <option value="fire">Fire / Industrial Explosion</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Severity
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full h-8 rounded-lg border border-white/[0.08] bg-slate-900/90 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="critical">Critical (Immediate Evacuation)</option>
            <option value="high">High (Threat Imminent)</option>
            <option value="moderate">Moderate (Precautionary)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleGenerateChecklist}
            disabled={loading}
            className="w-full h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Synthesize Precedent</span>
          </button>
        </div>
      </div>

      {/* Matched Historical Precedents Strip */}
      {checklistData && checklistData.matched_disasters.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Correlated Historical Precedents:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {checklistData.matched_disasters.map((d) => (
              <span
                key={d.id}
                className="text-[11px] px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium"
              >
                🏛️ {d.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Checklist Items Stream */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {checklistData?.checklist.map((item) => {
          const isRatified = ratifiedItems[item.id];

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3.5 space-y-2.5 transition backdrop-blur-sm ${
                isRatified
                  ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.03]"
              }`}
            >
              {/* Top Row: Priority + Category + Time */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    PRIORITY {item.priority}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold border ${getCategoryColor(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                </div>
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Within {item.estimated_time_hours}h
                </span>
              </div>

              {/* Action Headline */}
              <h4 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
                {item.action}
              </h4>

              {/* Historical Precedent Citation Box */}
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-200/90 leading-relaxed font-mono">
                <span className="font-bold text-amber-400 block mb-0.5">
                  📚 Historical Precedent:
                </span>
                {item.historical_precedent}
              </div>

              {/* Tactical Rationale */}
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-300 font-medium">Tactical Rationale:</strong>{" "}
                {item.rationale}
              </p>

              {/* Resources & Ratification Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <Package className="w-3 h-3 text-slate-500" />
                  {item.resources_needed.map((res, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-300"
                    >
                      {res}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleRatify(item.id, item.action)}
                  disabled={isRatified}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    isRatified
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                      : "bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.10] active:scale-95"
                  }`}
                >
                  {isRatified ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ratified &amp; Dispatched</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Ratify Action Item</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
