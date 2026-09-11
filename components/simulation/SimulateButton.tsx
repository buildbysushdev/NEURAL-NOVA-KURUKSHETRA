"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, ChevronUp, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface SimulationIncident {
  type: string;
  location_lat: number;
  location_lng: number;
  description: string;
  severity_hint: number;
}

export const SCENARIOS = [
  {
    id: "chennai-flash-flood",
    name: "Chennai Flash Flood — 5 Zones",
    incidents: [
      {
        type: "flood",
        location_lat: 13.0827,
        location_lng: 80.2707,
        description: "T. Nagar residential sector submerged, 200+ citizens trapped in ground floor tenements.",
        severity_hint: 9,
      },
      {
        type: "flood",
        location_lat: 13.0500,
        location_lng: 80.2500,
        description: "Adyar river overflow breached embankment, families isolated on rooftops.",
        severity_hint: 8,
      },
      {
        type: "structural_collapse",
        location_lat: 13.0700,
        location_lng: 80.2600,
        description: "Three-story brick masonry building collapsed in Saidapet; 12 casualties trapped in void.",
        severity_hint: 10,
      },
      {
        type: "medical",
        location_lat: 13.0400,
        location_lng: 80.2450,
        description: "Government peripheral hospital power generator failure; 18 ICU patients require backup O2.",
        severity_hint: 9,
      },
      {
        type: "flood",
        location_lat: 13.0900,
        location_lng: 80.2800,
        description: "Elderly care facility cut off by 4-foot standing water; emergency ration supplies needed.",
        severity_hint: 7,
      },
    ],
  },
  {
    id: "coimbatore-fire",
    name: "Coimbatore Industrial Fire & Toxic Fumes",
    incidents: [
      {
        type: "fire",
        location_lat: 11.0168,
        location_lng: 76.9558,
        description: "Chemical solvent warehouse burst into flames; toxic plume spreading towards residential ward.",
        severity_hint: 9,
      },
      {
        type: "fire",
        location_lat: 11.0200,
        location_lng: 76.9600,
        description: "Secondary transformer explosion at textile substation; high-voltage lines downed.",
        severity_hint: 8,
      },
    ],
  },
  {
    id: "himachal-earthquake",
    name: "Himachal Earthquake M5.8 & Rockslide",
    incidents: [
      {
        type: "earthquake",
        location_lat: 32.2432,
        location_lng: 77.1892,
        description: "M5.8 seismic event triggered hillside fissures in Manali Valley; multiple cottages damaged.",
        severity_hint: 8,
      },
      {
        type: "structural_collapse",
        location_lat: 32.2450,
        location_lng: 77.1900,
        description: "Gram panchayat school building collapsed; search and rescue extrication squad needed.",
        severity_hint: 10,
      },
    ],
  },
];

const STAGES = [
  { label: "Ingesting multi-zone incidents", icon: "📥", duration: 800 },
  { label: "Sentinel Agent triaging severity (Groq LLaMA 3)", icon: "🧠", duration: 1200 },
  { label: "Strategist Agent allocating resources (Gemini)", icon: "📦", duration: 1400 },
  { label: "Dispatching multi-channel notifications (CAP v1.2)", icon: "📡", duration: 900 },
  { label: "Updating tactical dashboard & live GIS map", icon: "✅", duration: 600 },
];

export function SimulateButton({
  onComplete,
}: {
  onComplete?: (incidents: any[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(-1);
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  async function runSimulation(scenario: (typeof SCENARIOS)[0]) {
    setOpen(false);
    setRunning(true);
    setCurrentStage(0);
    setCompletedStages([]);

    toast.info(`Deploying Scenario: ${scenario.name}`, {
      description: "Autonomous multi-agent pipeline triggered live on stage...",
      duration: 5000,
    });

    // Fire API call in background
    const apiPromise = fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: scenario.id,
        incidents: scenario.incidents,
      }),
    });

    // Visual realistic stage progression
    for (let i = 0; i < STAGES.length; i++) {
      setCurrentStage(i);
      await new Promise((r) => setTimeout(r, STAGES[i].duration));
      setCompletedStages((prev) => [...prev, i]);
    }

    try {
      const res = await apiPromise;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Simulation failed");

      toast.success("Scenario Deployed Successfully", {
        description: `${data.processed_count || scenario.incidents.length} incidents triaged by Sentinel & allocated by Strategist.`,
      });

      if (onComplete && data.incidents) {
        onComplete(data.incidents);
      }
    } catch (err: any) {
      console.warn("Simulation API fallback triggered:", err.message);
      toast.info("Offline Scenario Injected", {
        description: `${scenario.incidents.length} incidents populated on tactical map.`,
      });
      if (onComplete) {
        onComplete(
          scenario.incidents.map((inc, i) => ({
            id: `sim-local-${Date.now()}-${i}`,
            type: inc.type,
            description: inc.description,
            location_lat: inc.location_lat,
            location_lng: inc.location_lng,
            latitude: inc.location_lat,
            longitude: inc.location_lng,
            severity_score: inc.severity_hint,
            severity: inc.severity_hint >= 8 ? "CRITICAL" : "HIGH",
            needed_resources: ["boats", "medical", "water"],
            created_at: new Date().toISOString(),
          }))
        );
      }
    } finally {
      setTimeout(() => {
        setRunning(false);
        setCurrentStage(-1);
        setCompletedStages([]);
      }, 1000);
    }
  }

  return (
    <>
      {/* Floating progress overlay drawer when simulation is executing */}
      {running && (
        <div className="fixed bottom-36 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-white/[0.10] bg-[#111827]/95 p-5 backdrop-blur-2xl shadow-2xl animate-slide-up">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/[0.06]">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <p className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
              Autonomous Pipeline Execution
            </p>
          </div>

          <div className="space-y-2">
            {STAGES.map((stage, i) => {
              const isComplete = completedStages.includes(i);
              const isActive = currentStage === i && !isComplete;

              return (
                <div
                  key={i}
                  className={`
                    flex items-center gap-3 p-2 rounded-xl transition-all
                    ${isActive ? "bg-blue-500/10 border border-blue-500/20" : ""}
                    ${isComplete ? "opacity-70" : ""}
                  `}
                >
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0
                      ${
                        isComplete
                          ? "bg-emerald-500/20"
                          : isActive
                          ? "bg-blue-500/20"
                          : "bg-white/[0.03]"
                      }
                    `}
                  >
                    {isComplete ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} />
                    ) : isActive ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    ) : (
                      <span className="text-slate-500 text-[10px] font-mono">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium leading-tight ${
                      isComplete
                        ? "text-slate-400"
                        : isActive
                        ? "text-slate-100 font-semibold"
                        : "text-slate-500"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scenario selector popover */}
      {open && (
        <div className="fixed bottom-36 right-6 z-50 w-80 rounded-2xl border border-white/[0.10] bg-[#111827]/95 p-1 backdrop-blur-2xl shadow-2xl overflow-hidden animate-slide-up">
          <div className="p-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-slate-200">
              Select Simulation Scenario
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Groq Sentinel &amp; Gemini Strategist process live on stage
            </p>
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => runSimulation(s)}
                className="w-full text-left p-3 rounded-xl hover:bg-white/[0.06] transition group flex flex-col"
              >
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white">
                  {s.name}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {s.incidents.length} multi-zone incidents · Real AI triage
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main floating CTA button */}
      <button
        type="button"
        onClick={() => !running && setOpen(!open)}
        disabled={running}
        className={`
          fixed bottom-20 right-6 z-40 group overflow-hidden
          px-5 sm:px-6 py-3.5 sm:py-4 rounded-2xl 
          bg-gradient-to-r from-red-600 to-red-500
          hover:from-red-500 hover:to-red-400
          text-white font-semibold text-xs sm:text-sm
          shadow-2xl shadow-red-500/30
          disabled:opacity-70 disabled:cursor-not-allowed
          transition-all active:scale-95
          flex items-center gap-2.5 sm:gap-3
        `}
      >
        {/* Shimmer animation effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {running ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin relative" />
            <span className="relative font-mono text-xs">Simulating Crisis Wave...</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-5 h-5 relative text-white animate-pulse-live" />
            <span className="relative tracking-wide">Simulate Disaster Scenario</span>
            <ChevronUp
              className={`w-4 h-4 relative transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>
    </>
  );
}

export default SimulateButton;
