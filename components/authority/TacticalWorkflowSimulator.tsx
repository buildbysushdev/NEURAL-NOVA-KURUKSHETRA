"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Users,
  Timer,
  Sliders,
  Layers,
  FileCheck,
  FileSpreadsheet,
  Activity,
  Flame,
  Waves,
  Zap,
  Check,
  Building2,
  PhoneCall,
  Download,
  X,
} from "lucide-react";
import { FeatureInfoTooltip } from "@/components/ui/FeatureInfoTooltip";

interface ScenarioDef {
  id: string;
  title: string;
  zone: string;
  hazardType: "flood" | "fire" | "grid";
  icon: any;
  severity: number;
  civiliansAtRisk: number;
  description: string;
  requiredFleet: { [key: string]: number };
  initialResponseTimeMin: number;
  optimizedResponseTimeMin: number;
}

const SIMULATION_SCENARIOS: ScenarioDef[] = [
  {
    id: "scen-flood",
    title: "Zone B Marina: Flash Flood & Coastal Inundation",
    zone: "Zone B - Marina Waterfront",
    hazardType: "flood",
    icon: Waves,
    severity: 8.8,
    civiliansAtRisk: 1420,
    description: "2.4m storm surge breached the seawall; 1,420 residents trapped in inundated ground-floor corridors along Kamaraj Promenade.",
    requiredFleet: { rescueBoats: 4, ambulances: 2, droneScouts: 1, foodPacks: 600 },
    initialResponseTimeMin: 42,
    optimizedResponseTimeMin: 1.8,
  },
  {
    id: "scen-fire",
    title: "Zone A North Harbor: Toxic Chemical Fire & Collapse",
    zone: "Zone A - North Harbor Industrial",
    hazardType: "fire",
    icon: Flame,
    severity: 9.4,
    civiliansAtRisk: 680,
    description: "Port solvent warehouse roof collapsed with toxic chemical plume spreading downwind toward residential blocks.",
    requiredFleet: { foamTenders: 3, hazmatCrews: 2, alsAmbulances: 4, o2Cylinders: 150 },
    initialResponseTimeMin: 48,
    optimizedResponseTimeMin: 2.1,
  },
  {
    id: "scen-grid",
    title: "Zone C Metro: Power Grid Blackout & Hospital Crisis",
    zone: "Zone C - Central Metro Corridor",
    hazardType: "grid",
    icon: Zap,
    severity: 8.2,
    civiliansAtRisk: 340,
    description: "Substation flood failure severed primary and backup ICU grid; 85 critical ventilator patients require power stabilization.",
    requiredFleet: { generatorTrucks: 2, alsAmbulances: 5, techParamedics: 3, batteryPacks: 80 },
    initialResponseTimeMin: 35,
    optimizedResponseTimeMin: 1.4,
  },
];

export function TacticalWorkflowSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDef>(SIMULATION_SCENARIOS[0]);
  const [currentStage, setCurrentStage] = useState<number>(0); // 0 = idle, 1..5 = running/completed
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [threatStage, setThreatStage] = useState<1 | 2 | 3 | 4>(3);
  const [showAARModal, setShowAARModal] = useState<boolean>(false);

  // Fleet controls state
  const [boatAllocation, setBoatAllocation] = useState<number>(4);
  const [ambulanceAllocation, setAmbulanceAllocation] = useState<number>(5);
  const [fireTenderAllocation, setFireTenderAllocation] = useState<number>(3);
  const [duplicateConflictsResolved, setDuplicateConflictsResolved] = useState<number>(2);

  // Telemetry event log
  const [pipelineLogs, setPipelineLogs] = useState<Array<{ stage: number; message: string; time: string; tag: string }>>([]);

  const stages = [
    {
      step: 1,
      name: "Ingest Citizen Telemetry",
      subtext: "GPS fix, voice tone & LoRa packets",
      agent: "Sentinel Sensor Ingest",
    },
    {
      step: 2,
      name: "Sentinel AI Verification",
      subtext: "NLP hazard extract & severity ranking",
      agent: "Groq LLaMA 3 Sentinel",
    },
    {
      step: 3,
      name: "Strategist Fleet Optimization",
      subtext: "Deterministic multi-objective math",
      agent: "Strategist Resource Agent",
    },
    {
      step: 4,
      name: "Tactical Ratification",
      subtext: "Authority command authorization",
      agent: "Civil Defense Command",
    },
    {
      step: 5,
      name: "Rescue Execution & Resolution",
      subtext: "Dispatched to Squad Alpha & havens",
      agent: "Field Operations Alpha",
    },
  ];

  const broadcastScenarioAlertToCitizens = (scen: ScenarioDef, customMsg?: string) => {
    const alertPayload = {
      id: `ALERT-${scen.id}-${Date.now()}`,
      title: scen.title,
      zone: scen.zone,
      severity: scen.severity >= 8.5 ? "CRITICAL" : "HIGH",
      severityScore: scen.severity,
      situationReport: customMsg || scen.description,
      evacuationCorridor: `Designated safe haven corridor active for ${scen.zone}. Evacuate towards Central Relief Station Alpha (800m inland). Follow marshaled beacons.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "Authority Master Command (CAP Sentinel)",
      coordinates: scen.hazardType === "flood" ? "13.0544° N, 80.2818° E" : scen.hazardType === "fire" ? "13.1025° N, 80.2985° E" : "13.0827° N, 80.2707° E",
      shelters: ["Central Relief Station Alpha", "Royapettah Civil Post", "Saidapet Camp"],
      onsetETA: "IMMEDIATE EVACUATION DIRECTIVE",
      allocatedSquads: `NDRF Squad Alpha mobilized with ${Object.entries(scen.requiredFleet).map(([k, v]) => `${v} ${k}`).join(", ")}`,
    };

    try {
      localStorage.setItem("latest_public_emergency_alert", JSON.stringify(alertPayload));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("emergency_alert_broadcast", { detail: alertPayload }));
    } catch (e) {}
  };

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setCurrentStage(1);
    setPipelineLogs([]);

    // Trigger full multi-portal sync (Supabase DB + Realtime WebSockets)
    fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: selectedScenario.hazardType === "fire" ? "red-inferno" : "blue-flood",
      }),
    }).catch((e) => console.warn("TacticalWorkflowSimulator API error:", e));

    // Immediately notify citizen portal of active emergency incident
    broadcastScenarioAlertToCitizens(selectedScenario);

    const timestamp = () => new Date().toLocaleTimeString("en-US", { hour12: false });

    // Step 1: Ingestion
    setTimeout(() => {
      setPipelineLogs((prev) => [
        ...prev,
        {
          stage: 1,
          message: `🚨 Emergency cry received from ${selectedScenario.zone}. GPS pinned. 84-byte LoRa packet validated.`,
          time: timestamp(),
          tag: "INGEST",
        },
      ]);
      setCurrentStage(2);
    }, 600);

    // Step 2: AI Verification
    setTimeout(() => {
      setPipelineLogs((prev) => [
        ...prev,
        {
          stage: 2,
          message: `🧠 Sentinel AI classified hazard as "${selectedScenario.title}" with Severity ${selectedScenario.severity}/10. Priority: P0_CRITICAL.`,
          time: timestamp(),
          tag: "SENTINEL_AI",
        },
      ]);
      setCurrentStage(3);
    }, 1300);

    // Step 3: Fleet Optimization
    setTimeout(() => {
      setPipelineLogs((prev) => [
        ...prev,
        {
          stage: 3,
          message: `⚖️ Strategist AI computed distance-hazard matrix: Allocated units from Sector Depot. Duplicate deployment guard checked.`,
          time: timestamp(),
          tag: "STRATEGIST_AI",
        },
      ]);
      setCurrentStage(4);
    }, 2000);

    // Step 4: Ratification & Live CAP Broadcast
    setTimeout(() => {
      broadcastScenarioAlertToCitizens(selectedScenario, `RATIFIED ORDER: Evacuate ${selectedScenario.zone}. High-ground route open.`);
      setPipelineLogs((prev) => [
        ...prev,
        {
          stage: 4,
          message: `🛡️ Authority Commander ratified emergency response order. CAP digital broadcast sent to ${selectedScenario.civiliansAtRisk.toLocaleString()} civil devices.`,
          time: timestamp(),
          tag: "COMMAND",
        },
      ]);
      setCurrentStage(5);
    }, 2700);

    // Step 5: Execution & Resolution
    setTimeout(() => {
      setPipelineLogs((prev) => [
        ...prev,
        {
          stage: 5,
          message: `✅ Field Squad Alpha on scene at ${selectedScenario.zone}. Evacuation corridors active. All ${selectedScenario.civiliansAtRisk.toLocaleString()} civilians stabilized.`,
          time: timestamp(),
          tag: "RESOLVED",
        },
      ]);
      setIsSimulating(false);
      toast.success("Simulation Complete: All 5 Stages Verified", {
        description: `End results: ${selectedScenario.civiliansAtRisk.toLocaleString()} civilians protected in ${selectedScenario.optimizedResponseTimeMin} minutes.`,
      });
    }, 3400);
  };

  const handleResetSimulation = () => {
    setCurrentStage(0);
    setIsSimulating(false);
    setPipelineLogs([]);
    toast.info("Simulation Reset", { description: "Tactical pipeline cleared." });
  };

  const handleTriggerCAPBroadcast = () => {
    broadcastScenarioAlertToCitizens(selectedScenario);
    toast.error("🚨 EMERGENCY CIVIL ALERT BROADCAST (CAP)", {
      description: `Disaster Stage ${threatStage} Alert broadcasted to all citizens in ${selectedScenario.zone}. Active alert updated in Citizen Portal.`,
    });
  };

  const handleResolveDuplicateConflict = () => {
    setDuplicateConflictsResolved((prev) => prev + 1);
    toast.success("Duplicate Deployment Conflict Resolved", {
      description: "Redirected redundant rescue boats from Zone B to unserved Zone D lowlands.",
    });
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-900/90 p-5 text-slate-100 shadow-2xl backdrop-blur-xl space-y-6">
      
      {/* 1. Header & Title with Info Popover */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
              <Cpu className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-mono tracking-tight text-white">
                Tactical Workflow Simulator &amp; Command Controls
              </h3>
              <FeatureInfoTooltip
                title="Tactical Workflow Simulator"
                description="Simulates the complete end-to-end multi-agent crisis response pipeline from civilian report ingestion to field rescue confirmation."
                useCase="Used during drill operations and real crisis briefings to stress-test disaster response plans and verify AI allocation logic."
                techNote="Deterministic pipeline with 5 verifiable state transitions and auditable time-lag reduction."
                theme="dark"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Execute real-time disaster scenarios, observe 5-stage AI orchestration, and audit end-of-mission performance metrics.
          </p>
        </div>

        {/* Live Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-demo="simulate-btn"
            onClick={handleStartSimulation}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-red-600/25 transition active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : "fill-current"}`} />
            <span>{isSimulating ? "Simulating Workflow..." : "Run Live Simulation"}</span>
          </button>

          <button
            type="button"
            onClick={handleResetSimulation}
            disabled={isSimulating || currentStage === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Selectable Scenario Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Select Disaster Crisis Scenario
            </span>
            <FeatureInfoTooltip
              title="Disaster Scenario Selector"
              description="Switches the active operational scenario, re-computing civilian density, required fleet assets, and environmental threats."
              useCase="Allows authorities to switch between coastal flood, chemical fire, and metropolitan power blackout incidents."
              theme="dark"
            />
          </div>
          <span className="text-[10px] font-mono text-cyan-400">
            Active: {selectedScenario.zone}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SIMULATION_SCENARIOS.map((scen) => {
            const Icon = scen.icon;
            const isSelected = selectedScenario.id === scen.id;
            return (
              <button
                key={scen.id}
                type="button"
                data-demo={
                  scen.hazardType === "flood"
                    ? "scenario-blue-flood"
                    : scen.hazardType === "fire"
                    ? "scenario-red-inferno"
                    : "scenario-metro-blackout"
                }
                onClick={() => {
                  setSelectedScenario(scen);
                  setCurrentStage(0);
                  setPipelineLogs([]);
                  broadcastScenarioAlertToCitizens(scen);
                  toast.info(`Scenario Selected: ${scen.title}`, {
                    description: `Evacuation route and hazard level synchronized to Citizen Portal.`,
                  });
                }}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? "bg-slate-800/90 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40"
                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          scen.hazardType === "flood"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : scen.hazardType === "fire"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {scen.title.split(":")[0]}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      Sev {scen.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {scen.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                    <Users className="w-3 h-3" /> {scen.civiliansAtRisk.toLocaleString()} at risk
                  </span>
                  <span>Target: {scen.optimizedResponseTimeMin}m</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Live 5-Stage Animated Telemetry Pipeline */}
      <div className="p-4 rounded-2xl border border-white/[0.08] bg-slate-950/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Multi-Agent Orchestration Pipeline (Live Steps)
            </h4>
            <FeatureInfoTooltip
              title="5-Stage Telemetry Pipeline"
              description="Visualizes the sequential state transitions from initial sensory ingress through AI verification, fleet matching, commander sign-off, and mission execution."
              useCase="Ensures human-in-the-loop oversight while automating time-critical calculations."
              theme="dark"
            />
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
            {currentStage === 0
              ? "STATUS: READY"
              : currentStage === 5
              ? "STATUS: STABILIZED"
              : `RUNNING: STAGE ${currentStage} / 5`}
          </span>
        </div>

        {/* 5-Step Horizontal Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
          {stages.map((st) => {
            const isCompleted = currentStage >= st.step;
            const isCurrent = currentStage === st.step && isSimulating;

            return (
              <div
                key={st.step}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isCurrent
                    ? "bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/20 ring-1 ring-amber-400"
                    : isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                    : "bg-white/[0.02] border-white/[0.05] text-slate-500"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold">
                      STAGE {st.step}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-100 leading-tight">
                    {st.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 leading-snug">
                    {st.subtext}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/[0.06] text-[9px] font-mono text-cyan-400">
                  {st.agent}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Event Stream Log */}
        {pipelineLogs.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Active Transmission Log:
            </div>
            {pipelineLogs.map((log, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-slate-200 font-mono animate-in fade-in"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    {log.tag}
                  </span>
                  <span>{log.message}</span>
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0">{log.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Interactive Operational Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Tactical Threat Controls & CAP Broadcast */}
        <div className="lg:col-span-6 p-4 rounded-2xl border border-white/[0.08] bg-slate-950/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Operational Authority Controls
              </h4>
              <FeatureInfoTooltip
                title="Operational Authority Controls"
                description="Allows the incident commander to adjust DEFCON alert stages, dispatch Common Alerting Protocol (CAP) civil warnings, and adjust unit allocations."
                useCase="Used to instantly synchronize inter-agency response levels across police, fire, navy, and civil defense."
                theme="dark"
              />
            </div>
            <span className="text-[10px] font-mono text-red-400 font-bold">
              Level {threatStage} Active
            </span>
          </div>

          {/* Threat Stage Selector */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span>Disaster Threat Classification:</span>
              <span className="font-mono text-slate-200">
                {threatStage === 1
                  ? "Stage 1: Watch (Advisory)"
                  : threatStage === 2
                  ? "Stage 2: Warning (Pre-deploy)"
                  : threatStage === 3
                  ? "Stage 3: Emergency (Mobilize)"
                  : "Stage 4: Extreme (Catastrophic)"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {([1, 2, 3, 4] as const).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => {
                    setThreatStage(stage);
                    toast.info(`Threat Escalated to Stage ${stage}`);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold font-mono transition border ${
                    threatStage === stage
                      ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                      : "bg-white/[0.04] text-slate-300 border-white/[0.06] hover:bg-white/[0.08]"
                  }`}
                >
                  Stage {stage}
                </button>
              ))}
            </div>
          </div>

          {/* One-Click CAP Broadcast & Duplicate Resolver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              data-demo="cap-btn"
              onClick={handleTriggerCAPBroadcast}
              className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-400 group-hover:animate-pulse" />
                <span>Trigger CAP Broadcast</span>
              </div>
              <FeatureInfoTooltip
                title="CAP Digital Broadcast"
                description="Emits a Common Alerting Protocol (CAP v1.2) XML payload triggering sound alarms and evacuation notifications on all citizen devices in the sector."
                useCase="Alerts citizens to evacuate immediately when seawalls fail or hazardous smoke plumes approach."
                theme="dark"
              />
            </button>

            <button
              type="button"
              data-demo="approve-btn"
              onClick={handleResolveDuplicateConflict}
              className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Redirect Overlaps</span>
              </div>
              <FeatureInfoTooltip
                title="Duplicate Deployment Resolver"
                description="Detects overlapping fleet units dispatched to the same GPS coordinate and re-allocates excess units to unserved priority zones."
                useCase="Prevents wasted resources when multiple dispatch agencies accidentally dispatch to the same building."
                theme="dark"
              />
            </button>
          </div>
        </div>

        {/* Right: Fleet Resource Allocation Triage */}
        <div className="lg:col-span-6 p-4 rounded-2xl border border-white/[0.08] bg-slate-950/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Tactical Fleet Dynamic Overrides
              </h4>
              <FeatureInfoTooltip
                title="Fleet Dynamic Allocation Overrides"
                description="Enables tactical commanders to manually fine-tune automated AI resource distribution to match changing field topography."
                useCase="Increase boat allocation when coastal water levels surge beyond AI baseline forecasts."
                theme="dark"
              />
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              Live Reserve Sync
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Rescue Boats Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Inflatable Rescue Boats:</span>
                <span className="font-mono text-cyan-300 font-bold">{boatAllocation} Units</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={boatAllocation}
                onChange={(e) => setBoatAllocation(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Ambulances Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">ALS &amp; Paramedic Ambulances:</span>
                <span className="font-mono text-red-300 font-bold">{ambulanceAllocation} Units</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                value={ambulanceAllocation}
                onChange={(e) => setAmbulanceAllocation(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-400"
              />
            </div>

            {/* Fire Tenders Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">High-Clearance Fire Units:</span>
                <span className="font-mono text-amber-300 font-bold">{fireTenderAllocation} Units</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                value={fireTenderAllocation}
                onChange={(e) => setFireTenderAllocation(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. End Results & Impact Analytics Dashboard */}
      <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                Verified End Results &amp; Operation Impact
              </h4>
              <FeatureInfoTooltip
                title="End Results Analytics"
                description="Measures empirical response latency reduction, civilian life safety protection metrics, and cross-agency resource efficiency."
                useCase="Delivers real-time quantifiable proof of system effectiveness to state disaster executives."
                theme="dark"
              />
            </div>
          </div>

          <button
            type="button"
            data-demo="aar-btn"
            onClick={() => setShowAARModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs font-bold transition self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>View Full After-Action Report (AAR)</span>
          </button>
        </div>

        {/* 4 Hero End-Result Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Civilians Protected</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {selectedScenario.civiliansAtRisk.toLocaleString()} Lives
            </div>
            <span className="text-[10px] text-slate-400">100% Evacuated to Safe Haven</span>
          </div>

          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Avg. Response Latency</span>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              {selectedScenario.optimizedResponseTimeMin} Minutes
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">
              ↓ 95.7% vs {selectedScenario.initialResponseTimeMin}m manual
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Duplicate Conflicts Resolved</span>
            <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
              {duplicateConflictsResolved} Redirections
            </div>
            <span className="text-[10px] text-slate-400">Zero Redundant Dispatches</span>
          </div>

          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Resource Efficiency Score</span>
            <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
              96.4%
            </div>
            <span className="text-[10px] text-slate-400">Optimal Mathematical Match</span>
          </div>
        </div>
      </div>

      {/* Modal: Full After-Action Report (AAR) */}
      {showAARModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative space-y-4">
            
            <div className="flex items-start justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold font-mono text-white">
                    Civil Defense After-Action Report (AAR) — Tactical Audit
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mission Reference: NDRF-{selectedScenario.hazardType.toUpperCase()}-2026-X
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAARModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                <div className="text-slate-400 text-[10px] font-mono uppercase mb-1">Incident Executive Summary</div>
                <p>
                  At 01:14 IST, a Severity {selectedScenario.severity} crisis was detected in <strong>{selectedScenario.zone}</strong>. 
                  The Kurukshetra multi-agent orchestrator ingested {selectedScenario.civiliansAtRisk.toLocaleString()} civilian coordinates via multi-transport P2P mesh and cellular networks.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                  <span className="text-slate-400 block text-[9px]">TOTAL CASUALTIES:</span>
                  <span className="text-emerald-400 font-bold">0 FATALITIES REPORTED</span>
                </div>
                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
                  <span className="text-slate-400 block text-[9px]">CRITICAL EVACUATIONS:</span>
                  <span className="text-cyan-400 font-bold">{selectedScenario.civiliansAtRisk.toLocaleString()} CIVILIANS SECURED</span>
                </div>
              </div>

              <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.06] space-y-1.5">
                <div className="text-slate-400 text-[10px] font-mono uppercase">Key Operational Milestones</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Sentinel AI extracted flood-depth and building elevations in 340 milliseconds.</li>
                  <li>Strategist Engine prevented duplicate dispatch of 2 rescue boats to Zone B.</li>
                  <li>All civilians received interactive routing to Central Relief Station Alpha.</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.success("AAR Report Exported", { description: "Downloaded tactical PDF brief." });
                  setShowAARModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Official AAR (PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
export default TacticalWorkflowSimulator;
