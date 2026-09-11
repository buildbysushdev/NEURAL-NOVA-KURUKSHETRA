"use client";

import React from "react";
import {
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
  Radio,
  RadioTower,
  HardDrive,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles
} from "lucide-react";
import { DemoScenario, NetworkHealth } from "@/lib/resq/types";

interface DemoScenarioControllerProps {
  activeScenario: DemoScenario;
  network: NetworkHealth;
  onSelectScenario: (scenario: DemoScenario) => void;
  onToggleTransport: (transport: string, online: boolean) => void;
  loading: boolean;
}

const SCENARIOS: { id: DemoScenario; label: string; stepNumber: number; desc: string }[] = [
  { id: "scenario_1_normal", stepNumber: 1, label: "1. Normal Network", desc: "Cellular & Internet active. Clean cloud delivery." },
  { id: "scenario_2_cellular_down", stepNumber: 2, label: "2. Cellular Failure", desc: "Cellular fails. Auto-fallback to P2P Mesh." },
  { id: "scenario_3_total_blackout", stepNumber: 3, label: "3. Total Blackout", desc: "Zero connectivity. Packet saved in Store & Forward." },
  { id: "scenario_4_lora_recovery", stepNumber: 4, label: "4. LoRa Recovery", desc: "External LoRa node appears. Flushes buffered packet." },
  { id: "scenario_5_resource_shortage", stepNumber: 5, label: "5. Resource Shortage", desc: "Zone C Flash Flood (2 kids) competes with B17." },
  { id: "scenario_6_dynamic_reallocation", stepNumber: 6, label: "6. Dynamic Reallocation", desc: "System pre-empts & reassigns Rescue 02 to Zone C." },
  { id: "scenario_7_duplicate_deployment", stepNumber: 7, label: "7. Duplicate Deployment", desc: "Fire 01 & 02 both at B17. Redirects Fire 02 to Zone D." },
];

export function DemoScenarioController({
  activeScenario,
  network,
  onSelectScenario,
  onToggleTransport,
  loading,
}: DemoScenarioControllerProps) {
  return (
    <section aria-label="Demo Controller" className="rounded-2xl border border-amber-500/30 bg-slate-950/90 p-4 backdrop-blur-md shadow-2xl text-slate-100 mb-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <RadioTower className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                RESQNET PRESENTER DEMO CONTROLLER
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-500/30">
                5–7 MIN LIVE PITCH MODE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              One-click deterministic disaster timeline controls for hackathon judges
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectScenario("reset")}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* 7 Scenario Buttons */}
      <div className="mt-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
          SELECT SCENARIO STAGE:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {SCENARIOS.map((sc) => {
            const isActive = activeScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => onSelectScenario(sc.id)}
                disabled={loading}
                className={`flex flex-col items-start justify-between rounded-xl p-2.5 text-left transition border ${
                  isActive
                    ? "bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20 ring-1 ring-amber-400"
                    : "bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-800/80 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isActive ? "bg-amber-400 text-slate-950" : "bg-white/10 text-slate-400"
                  }`}>
                    STEP {sc.stepNumber}
                  </span>
                  {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 animate-pulse" />}
                </div>
                <div className="text-xs font-bold leading-tight line-clamp-1">{sc.label}</div>
                <div className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">{sc.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Transport Override Toggles */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            PRESENTER TRANSPORT TOGGLES (DIRECT NETWORK INTERFERENCE):
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onToggleTransport("cellular", !network.cellular)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border flex items-center gap-1.5 transition ${
                network.cellular
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-red-500/20 text-red-300 border-red-500/40"
              }`}
            >
              {network.cellular ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{network.cellular ? "Disable Cellular" : "Enable Cellular"}</span>
            </button>

            <button
              onClick={() => onToggleTransport("internet", !network.internet)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border flex items-center gap-1.5 transition ${
                network.internet
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-red-500/20 text-red-300 border-red-500/40"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>{network.internet ? "Disable Internet" : "Enable Internet"}</span>
            </button>

            <button
              onClick={() => onToggleTransport("p2p_mesh", !network.p2p_mesh)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border flex items-center gap-1.5 transition ${
                network.p2p_mesh
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                  : "bg-slate-800 text-slate-400 border-white/10"
              }`}
            >
              <Radio className="h-3 w-3" />
              <span>{network.p2p_mesh ? "Disable Wi-Fi/P2P" : "Enable Wi-Fi/P2P"}</span>
            </button>

            <button
              onClick={() => onToggleTransport("lora", !network.lora_gateway)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border flex items-center gap-1.5 transition ${
                network.lora_gateway
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20"
                  : "bg-slate-800 text-slate-400 border-white/10"
              }`}
            >
              <RadioTower className="h-3 w-3" />
              <span>{network.lora_gateway ? "Disable LoRa Gateway" : "Enable LoRa Gateway"}</span>
            </button>

            <button
              onClick={() => onToggleTransport("satellite", !network.satellite_simulated)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border flex items-center gap-1.5 transition ${
                network.satellite_simulated
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  : "bg-slate-800 text-slate-400 border-white/10"
              }`}
            >
              <Globe className="h-3 w-3" />
              <span>{network.satellite_simulated ? "Disable Satellite Sim" : "Simulate Satellite Gateway"}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
