"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Zap,
  Radio,
  Shield,
  Activity,
  CheckCircle2,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Cpu,
  Database,
  Send,
  Sliders,
  Check,
} from "lucide-react";

interface AgentStep {
  id: number;
  agentName: string;
  engine: string;
  role: string;
  status: "idle" | "running" | "completed";
  latencyMs: number;
  confidence: number;
  badgeColor: string;
  outputSummary: string;
  dataPayload: Record<string, any>;
}

const DEFAULT_STEPS: AgentStep[] = [
  {
    id: 1,
    agentName: "Sentinel Telemetry Agent",
    engine: "Groq LLaMA 3 (<300ms)",
    role: "GIS & Satellite Ingestion",
    status: "completed",
    latencyMs: 240,
    confidence: 98,
    badgeColor: "cyan",
    outputSummary: "Ingested 139 FIRMS satellite fire spots + 2 USGS quakes + Citizen Marina Flood SOS.",
    dataPayload: {
      sensors_synced: 141,
      geo_cluster: "13.0544°N, 80.2818°E",
      dedup_status: "Unique Incident Identified (Haversine r=0.4km)",
    },
  },
  {
    id: 2,
    agentName: "Analyst Physics & Historical Agent",
    engine: "Historical Precedent RAG Engine",
    role: "Pattern Matching & Spread Physics",
    status: "completed",
    latencyMs: 380,
    confidence: 92,
    badgeColor: "blue",
    outputSummary: "Matched 2015 Chennai Inundation precedent. Calculated surge spread velocity at 140m/hr.",
    dataPayload: {
      precedent_matched: "2015 Marina Surge Event #CH-04",
      inundation_depth: "2.4 meters",
      projected_casualty_risk: "High without evacuation",
    },
  },
  {
    id: 3,
    agentName: "Strategist Allocation Agent",
    engine: "Google Gemini 3.6 Flash",
    role: "Multi-Depot VRP Optimization",
    status: "completed",
    latencyMs: 620,
    confidence: 96,
    badgeColor: "violet",
    outputSummary: "Optimized dispatch from Marina Waterfront Depot (Zone B). Allocated 4 boats & 2 ambulances.",
    dataPayload: {
      depot: "Marina Waterfront Forward Depot",
      resource_1: "4x Inflatable Zodiac Boats",
      resource_2: "2x 108 Advanced Life Support Ambulances",
      eta_arrival: "11 minutes",
    },
  },
  {
    id: 4,
    agentName: "Tri-Channel CAP v1.2 Dispatcher",
    engine: "Cell Broadcast & Webhook Relay",
    role: "Automated Citizen & Squad Alert",
    status: "completed",
    latencyMs: 190,
    confidence: 100,
    badgeColor: "amber",
    outputSummary: "Triggered 14,200 SMS Broadcasts, IVR Voice Warning, and Push Alerts to Rescue Squads.",
    dataPayload: {
      channels_activated: ["Cell Broadcast SMS", "IVR Voice Call", "Citizen In-App Alert"],
      recipient_count: 14200,
      protocol: "OASIS CAP v1.2 Compliant",
    },
  },
  {
    id: 5,
    agentName: "Executive Command In-The-Loop",
    engine: "Human-Governed Ratification",
    role: "Commander Approval & SOP Checklist",
    status: "completed",
    latencyMs: 0,
    confidence: 100,
    badgeColor: "emerald",
    outputSummary: "Authority Commander ratified allocation. Rescue Squads en route with green light.",
    dataPayload: {
      governance_mode: "Human-In-The-Loop (HITL)",
      ratification_id: "RAT-2026-9841",
      field_status: "EN_ROUTE",
    },
  },
];

export function AgentOrchestrationVisualizer() {
  const [steps, setSteps] = useState<AgentStep[]>(DEFAULT_STEPS);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setActiveStepIndex(0);

    // Reset all steps to idle
    setSteps((prev) =>
      prev.map((s) => ({ ...s, status: "idle" }))
    );

    let current = 0;
    const interval = setInterval(() => {
      if (current < DEFAULT_STEPS.length) {
        const stepNum = current;
        setActiveStepIndex(stepNum);

        // Set current to running
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === stepNum
              ? { ...s, status: "running" }
              : idx < stepNum
              ? { ...s, status: "completed" }
              : { ...s, status: "idle" }
          )
        );

        setTimeout(() => {
          // Set to completed
          setSteps((prev) =>
            prev.map((s, idx) => (idx === stepNum ? { ...s, status: "completed" } : s))
          );
        }, 800);

        current++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        setActiveStepIndex(null);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[680px] rounded-2xl border border-white/[0.08] bg-[#0d131f]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
            <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Multi-Agent Orchestration Engine</h3>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-[10px] font-mono text-violet-300">
                Autonomous Pipeline
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live Real-Time Inter-Agent Communication &amp; Decision Graph
            </p>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-violet-500/25 disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Orchestrating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Live Workflow</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {steps.map((step, idx) => {
          const isActive = activeStepIndex === idx;
          const isDone = step.status === "completed";
          const isRunning = step.status === "running";

          return (
            <div key={step.id} className="relative">
              {/* Connector Line between stages */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-5 top-12 bottom-[-16px] w-0.5 transition-all duration-500 ${
                    isDone
                      ? "bg-gradient-to-b from-cyan-500 to-violet-500"
                      : isRunning
                      ? "bg-gradient-to-b from-cyan-500 to-white/[0.1] animate-pulse"
                      : "bg-white/[0.08]"
                  }`}
                />
              )}

              {/* Node Card */}
              <div
                className={`relative rounded-2xl border p-4 transition-all duration-300 ${
                  isRunning
                    ? "bg-violet-950/30 border-violet-400/50 shadow-lg shadow-violet-500/20 scale-[1.01]"
                    : isActive
                    ? "bg-white/[0.06] border-cyan-400/40"
                    : isDone
                    ? "bg-slate-900/60 border-white/[0.08] hover:border-white/[0.15]"
                    : "bg-slate-950/40 border-white/[0.04] opacity-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    {/* Node circle badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs border flex-shrink-0 transition-all ${
                        isRunning
                          ? "bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/40 animate-pulse"
                          : isDone
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-white/[0.04] text-slate-400 border-white/[0.08]"
                      }`}
                    >
                      {isDone ? <Check className="w-5 h-5 text-cyan-400" /> : `0${step.id}`}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-white">{step.agentName}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-cyan-300">
                          {step.engine}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{step.role}</p>
                    </div>
                  </div>

                  {/* Status & Latency Pills */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold ${
                        isRunning
                          ? "bg-violet-500/20 border-violet-500/50 text-violet-300 animate-pulse"
                          : isDone
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-white/[0.04] border-white/[0.08] text-slate-400"
                      }`}
                    >
                      {isRunning ? "PROCESSING..." : isDone ? "EXECUTED" : "QUEUED"}
                    </span>
                    {step.latencyMs > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {step.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>

                {/* Output summary */}
                <p className="text-xs text-slate-300 leading-relaxed bg-black/25 p-3 rounded-xl border border-white/[0.04] mt-2 mb-2 font-sans">
                  {step.outputSummary}
                </p>

                {/* Live Data Payload Key-Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                  {Object.entries(step.dataPayload).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2 truncate">
                      <span className="text-slate-400">{key.replace(/_/g, " ")}:</span>
                      <span className="text-slate-200 font-semibold truncate">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
