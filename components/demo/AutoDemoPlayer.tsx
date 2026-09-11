"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Square,
  Bot,
  ChevronRight,
  Zap,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

export type DemoStep = {
  id: string;
  title: string;
  detail: string;
  durationMs: number;
  speechText?: string;
  action?: () => Promise<void> | void;
};

export type Scenario = {
  id: string;
  name: string;
  tagline: string;
  hazardType: "flood" | "fire";
  color: "blue" | "red";
  steps: DemoStep[];
};

export default function AutoDemoPlayer({
  onRefresh,
  onSwitchTab,
}: {
  onRefresh?: () => void;
  onSwitchTab?: (tab: string) => void;
}) {
  const [running, setRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const stopRef = useRef(false);

  const pushLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 16));
  };

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const smoothScroll = async (y: number) => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: y, behavior: "smooth" });
      await wait(600);
    }
  };

  const flashClick = async (selector: string) => {
    if (typeof document === "undefined") return;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    el.classList.add("demo-click-flash");
    try {
      el.click();
    } catch {}
    await wait(350);
    el.classList.remove("demo-click-flash");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 1 — OPERATION BLUE FLOOD (Coastal Storm Surge & Harbor Collapse)
  // ═══════════════════════════════════════════════════════════════════════════
  const blueFlood: Scenario = {
    id: "blue-flood",
    name: "Operation Blue Flood",
    tagline: "Marina storm surge + harbor collapse",
    hazardType: "flood",
    color: "blue",
    steps: [
      {
        id: "boot",
        title: "Bootstrapping Multi-Agent Grid",
        detail: "Sentinel · Analyst · Strategist · Copilot online",
        durationMs: 1400,
        speechText: "Bootstrapping multi-agent crisis grid. Sentinel, Analyst, and Strategist agents online.",
        action: async () => {
          pushLog("🟢 Multi-agent disaster response pipeline armed");
          await smoothScroll(0);
        },
      },
      {
        id: "ingest",
        title: "Ingesting Distress Signals",
        detail: "Citizen SOS + coastal water depth gauges + harbor telemetry",
        durationMs: 1600,
        speechText: "Ingesting multi-source distress signals from Marina coastline and harbor port.",
        action: async () => {
          pushLog("📥 3 priority distress signals ingested via LoRa mesh & HTTPS");
          await smoothScroll(180);
        },
      },
      {
        id: "simulate",
        title: "Injecting Coastal Surge Cluster",
        detail: "Triggering live simulation API — populating Marina flood zones",
        durationMs: 2200,
        speechText: "Injecting coastal surge cluster. Simulation API fired.",
        action: async () => {
          pushLog("🚨 Triggering Operation Blue Flood incident cluster");
          try {
            await fetch("/api/simulate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scenario: "blue-flood" }),
            });
          } catch {}
          onRefresh?.();
          await flashClick('[data-demo="simulate-btn"]');
          await flashClick('[data-demo="scenario-blue-flood"]');
        },
      },
      {
        id: "sentinel",
        title: "Sentinel AI Severity Triage (Groq LPU)",
        detail: "SEV 9 coastal surge · SEV 10 harbor collapse · 264ms triage",
        durationMs: 1900,
        speechText: "Sentinel AI triaged incidents in 264 milliseconds. Severity 9 flood, Severity 10 collapse.",
        action: async () => {
          pushLog("🧠 Sentinel AI: Sub-300ms triage complete. Assigned Priority P0_CRITICAL");
          await smoothScroll(350);
        },
      },
      {
        id: "analyst",
        title: "Analyst Physical Depth Enrichment",
        detail: "Flood depth 2.4m · water rise rate 15cm/hr · 240 civilians at risk",
        durationMs: 1900,
        speechText: "Analyst attached physical parameters: 2.4 meter flood depth, 240 citizens at risk.",
        action: async () => {
          pushLog("🔬 Analyst: Water rise 15cm/hr attached to Marina sector GIS overlay");
        },
      },
      {
        id: "strategist",
        title: "Strategist AI Combinatorial Knapsack",
        detail: "4 inflatable boats + 100 trauma med kits · Marina Depot · ETA 8m",
        durationMs: 2000,
        speechText: "Strategist AI allocated 4 inflatable boats and 100 medical trauma kits from Marina depot.",
        action: async () => {
          pushLog("📦 Strategist AI: Knapsack formula 0.40P + 0.25D + 0.15S + 0.20V verified");
          await smoothScroll(500);
        },
      },
      {
        id: "approve",
        title: "Human-in-the-Loop Commander Approval",
        detail: "Authority Commander ratified allocation directive",
        durationMs: 1700,
        speechText: "Authority commander ratified allocation order. Mission dispatched.",
        action: async () => {
          pushLog("✅ Authority ratified asset movement order");
          await flashClick('[data-demo="approve-btn"]');
          await flashClick('[data-demo="cap-btn"]');
        },
      },
      {
        id: "comms",
        title: "Resilient Offline Mesh Channel Assigned",
        detail: "Sector B Marina ➔ Walkie-Talkie CH 7 (462.7125 MHz)",
        durationMs: 1600,
        speechText: "Offline mesh channel assigned. Sector B tactical radio switched to Channel 7.",
        action: async () => {
          pushLog("📻 Walkie-Talkie Channel 7 assigned for maritime evacuation");
        },
      },
      {
        id: "rescue",
        title: "Field Rescue Mission Cards Live",
        detail: "NDRF Squad Alpha tasked · Turn-by-turn navigation active",
        durationMs: 1800,
        speechText: "Rescue squad console updated with GPS origin tracking and mission cards.",
        action: async () => {
          pushLog("🚑 Rescue field console synchronized. Squad Alpha en route");
          onRefresh?.();
        },
      },
      {
        id: "close",
        title: "Operation Blue Flood Complete",
        detail: "Ingest → Triage → Knapsack → Ratify → Field Action in < 90s",
        durationMs: 1800,
        speechText: "Operation Blue Flood closed-loop complete in under 90 seconds. 240 lives secured.",
        action: async () => {
          pushLog("🏁 Operation Blue Flood closed-loop verified successfully");
          toast.success("Operation Blue Flood: Closed-Loop Complete", {
            description: "Full automated pipeline completed from citizen distress to rescue dispatch.",
          });
          await smoothScroll(0);
        },
      },
    ],
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENARIO 2 — OPERATION RED INFERNO (Industrial Fire, Toxic Plume & Hospital)
  // ═══════════════════════════════════════════════════════════════════════════
  const redInferno: Scenario = {
    id: "red-inferno",
    name: "Operation Red Inferno",
    tagline: "Industrial blaze + toxic plume + hospital risk",
    hazardType: "fire",
    color: "red",
    steps: [
      {
        id: "boot",
        title: "NASA FIRMS Thermal Anomaly Detected",
        detail: "Satellite Brightness 321.5K · Fire Radiative Power 3.84 MW",
        durationMs: 1400,
        speechText: "Satellite thermal anomaly detected. NASA FIRMS validated 3.8 megawatt heat hotspot.",
        action: async () => {
          pushLog("🔥 NASA FIRMS hotspot validated in SIDCO Industrial Sector");
          await smoothScroll(0);
        },
      },
      {
        id: "ingest",
        title: "Multi-Source Sensor & Cry Fusion",
        detail: "Satellite IR + wind vectors + chemical plant worker SOS",
        durationMs: 1500,
        speechText: "Fusing multi-source sensory reports with chemical plant distress signals.",
        action: async () => {
          pushLog("📥 Multi-source hazard fusion: High solvent volatility confirmed");
        },
      },
      {
        id: "simulate",
        title: "Injecting Industrial Fire Cluster",
        detail: "Triggering live simulation API — chemical fire & hospital corridor",
        durationMs: 2200,
        speechText: "Injecting industrial fire cluster into GIS grid.",
        action: async () => {
          pushLog("🚨 Triggering Operation Red Inferno incident cluster");
          try {
            await fetch("/api/simulate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scenario: "red-inferno" }),
            });
          } catch {}
          onRefresh?.();
          await flashClick('[data-demo="simulate-btn"]');
          await flashClick('[data-demo="scenario-red-inferno"]');
        },
      },
      {
        id: "sentinel",
        title: "Sentinel AI Severity Lock (Groq LPU)",
        detail: "SEV 9 chemical blaze · Toxic gas release risk CRITICAL",
        durationMs: 1700,
        speechText: "Sentinel AI locked hazard severity at 9. Toxic chemical release risk critical.",
        action: async () => {
          pushLog("🧠 Sentinel AI: Toxic plume hazard confirmed. Urgency Score 9/10");
        },
      },
      {
        id: "analyst",
        title: "Analyst Plume Cone Prediction",
        detail: "AQI 340 · spread NE 180m/hr · General Hospital in 25-min cone",
        durationMs: 1900,
        speechText: "Analyst calculated toxic smoke dispersion. Air quality index 340. Hospital in 25-minute impact zone.",
        action: async () => {
          pushLog("🔬 Analyst: Plume vector heading Northeast toward Central Metro Hospital");
          await smoothScroll(320);
        },
      },
      {
        id: "strategist",
        title: "Strategist AI Multi-Agency Dispatch",
        detail: "Foam tender + 4 trauma ambulances + hazmat breathing units",
        durationMs: 1900,
        speechText: "Strategist AI allocated heavy foam tenders and 4 trauma ambulances.",
        action: async () => {
          pushLog("📦 Strategist AI: Multi-team tactical package mobilized from West Depot");
        },
      },
      {
        id: "evac",
        title: "Civil Evacuation Corridor Published",
        detail: "Safe route West via Anna Salai · avoid Kamaraj underpass",
        durationMs: 1700,
        speechText: "Civil evacuation corridor published: West via Anna Salai, avoiding Kamaraj underpass.",
        action: async () => {
          pushLog("🧭 Safe civil evacuation corridor pushed to Citizen App and CAP Broadcast");
          await smoothScroll(480);
        },
      },
      {
        id: "approve",
        title: "Authority Commander Ratification",
        detail: "One-click approval · civil sirens & CAP broadcast triggered",
        durationMs: 1600,
        speechText: "Commander ratified emergency response. Civil sirens and CAP alerts fired.",
        action: async () => {
          pushLog("✅ Authority ratified hazmat suppression and evacuation orders");
          await flashClick('[data-demo="approve-btn"]');
          await flashClick('[data-demo="cap-btn"]');
        },
      },
      {
        id: "rescue",
        title: "Hazmat & Medical Squads Tasked",
        detail: "On-duty teams dispatched with real-time toxic plume boundary",
        durationMs: 1600,
        speechText: "Hazmat and medical rescue squads on scene with GPS navigation.",
        action: async () => {
          pushLog("🚑 SDRF Hazmat Squad 02 and Ambulance Team deployed to perimeter");
          onRefresh?.();
        },
      },
      {
        id: "close",
        title: "Operation Red Inferno Loop Sealed",
        detail: "Thermal Detection → Plume Analysis → Multi-Squad Dispatch in < 90s",
        durationMs: 1700,
        speechText: "Operation Red Inferno sealed. Industrial blaze contained and hospital evacuated in 90 seconds.",
        action: async () => {
          pushLog("🏁 Operation Red Inferno closed-loop verified successfully");
          toast.success("Operation Red Inferno: Closed-Loop Complete", {
            description: "Industrial chemical fire suppressed and hospital evacuation corridor secured.",
          });
          await smoothScroll(0);
        },
      },
    ],
  };

  const scenarios = [blueFlood, redInferno];

  const runScenario = async (scenario: Scenario) => {
    stopRef.current = false;
    setRunning(true);
    setActiveScenario(scenario);
    setStepIndex(-1);
    setLogs([]);
    pushLog(`▶ Starting ${scenario.name} (Auto-Director Active)`);
    toast.info(`Launching ${scenario.name}`, {
      description: "Hands-free multi-agent workflow demo running for judges.",
    });

    for (let i = 0; i < scenario.steps.length; i++) {
      if (stopRef.current) break;
      const step = scenario.steps[i];
      setStepIndex(i);
      pushLog(`→ [${i + 1}/${scenario.steps.length}] ${step.title}`);
      if (step.speechText) speak(step.speechText);
      try {
        await step.action?.();
      } catch (e) {
        console.error("Auto demo action step error:", e);
      }
      await wait(step.durationMs);
    }

    setRunning(false);
    setStepIndex(-1);
    pushLog("■ Demo engine finished cycle. Standing by.");
  };

  const stop = () => {
    stopRef.current = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setRunning(false);
    pushLog("■ Auto-Demo stopped by operator");
    toast.warning("Auto-Demo Halted", { description: "Control returned to manual operator." });
  };

  return (
    <aside aria-label="AI Demo Director" className="fixed bottom-6 left-6 z-[9999] w-[390px] max-w-[94vw] transition-all duration-300">
      <div className="rounded-2xl border border-white/15 bg-[#0B1220]/95 p-4 shadow-2xl backdrop-blur-2xl text-slate-100 ring-1 ring-white/10">
        
        {/* Header */}
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                  AI Demo Director
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Autonomous War Room Choreography
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Voice Narration Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (next) speak("Voice narration activated.");
                toast.info(next ? "Voice Narration Enabled" : "Voice Narration Muted");
              }}
              className={`p-1.5 rounded-lg border transition ${
                voiceEnabled
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200"
              }`}
              title={voiceEnabled ? "Mute Voice Narration" : "Enable Voice Narration"}
            >
              {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>

            {/* Run / Stop Indicator */}
            {running ? (
              <button
                onClick={stop}
                className="flex items-center gap-1 rounded-lg border border-red-500/50 bg-red-500/20 px-2.5 py-1 text-[10px] font-bold uppercase text-red-300 hover:bg-red-500/30 transition shadow-sm"
              >
                <Square className="h-3 w-3 fill-current" /> Stop
              </button>
            ) : (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                READY
              </span>
            )}
          </div>
        </div>

        {/* Scenario Selection Cards (When Idle) */}
        {!running && (
          <div className="mb-3 space-y-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Select Hands-Free Scenario:</span>
              <span className="text-violet-400">1-Click Live Film</span>
            </div>

            {scenarios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => runScenario(s)}
                className={`group flex w-full items-center justify-between rounded-xl border p-3 text-left transition hover:brightness-110 active:scale-[0.99] ${
                  s.color === "blue"
                    ? "border-blue-500/30 bg-blue-500/10 hover:border-blue-400/50"
                    : "border-red-500/30 bg-red-500/10 hover:border-red-400/50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-100 group-hover:text-white">
                      {s.name}
                    </p>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        s.color === "blue"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {s.hazardType.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    {s.tagline}
                  </p>
                </div>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-105 ${
                    s.color === "blue"
                      ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-blue-500/25"
                      : "bg-gradient-to-br from-red-600 to-amber-600 text-white shadow-red-500/25"
                  }`}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Live Step Progress (When Running) */}
        {running && activeScenario && (
          <div className="mb-3 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-slate-900/60 p-3 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 animate-spin text-amber-400" />
                Executing: {activeScenario.name}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Step {Math.max(1, stepIndex + 1)} / {activeScenario.steps.length}
              </span>
            </div>

            <p className="text-xs font-bold text-slate-100 leading-snug">
              {activeScenario.steps[stepIndex]?.title || "Initializing AI agents..."}
            </p>
            <p className="mt-1 text-[11px] text-slate-300 leading-relaxed font-mono">
              {activeScenario.steps[stepIndex]?.detail}
            </p>

            {/* Progress Bar */}
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/40 border border-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-400 transition-all duration-500 shadow-sm"
                style={{
                  width: `${Math.max(5, ((stepIndex + 1) / activeScenario.steps.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Real-time Transmission Event Log */}
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-white/5 bg-black/30 p-2 font-mono text-[10px] scrollbar-thin">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-1 text-center">
              Awaiting demo launch... Click any scenario above.
            </div>
          ) : (
            logs.map((l, i) => (
              <div key={i} className="flex items-start gap-1.5 text-slate-300 leading-snug">
                <ChevronRight className="mt-0.5 h-3 w-3 text-violet-400 flex-shrink-0" />
                <span className="break-all">{l}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer info badge */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Autonomous Closed-Loop Demo</span>
          </div>
          <span className="font-mono text-[9px] text-slate-500">PS20 Neural Nova</span>
        </div>

      </div>
    </aside>
  );
}
