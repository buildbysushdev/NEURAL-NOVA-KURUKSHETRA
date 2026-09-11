"use client";

import React from "react";
import {
  ShieldAlert,
  Flame,
  Users,
  Building2,
  Ambulance,
  Truck,
  HeartPulse,
  Package,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Compass,
  Radio,
  MapPin,
  Activity,
  ShieldCheck,
  LifeBuoy
} from "lucide-react";
import {
  ResqZone,
  ResqResource,
  EmergencyPacket,
  IncidentCluster,
  ResourceAllocation,
  NetworkHealth
} from "@/lib/resq/types";
import { ConflictResolutionResult, DuplicateDetectionResult } from "@/lib/resq/allocation-engine";

interface CommandCenterDashboardProps {
  zones: ResqZone[];
  resources: ResqResource[];
  packets: EmergencyPacket[];
  clusters: IncidentCluster[];
  allocations: ResourceAllocation[];
  network: NetworkHealth;
  conflict: ConflictResolutionResult | null;
  duplicate: DuplicateDetectionResult | null;
  onResolveDuplicate: () => void;
  onRunScenario: (scenario: any) => void;
  loading: boolean;
}

export function CommandCenterDashboard({
  zones,
  resources,
  packets,
  clusters,
  allocations,
  network,
  conflict,
  duplicate,
  onResolveDuplicate,
  onRunScenario,
  loading,
}: CommandCenterDashboardProps) {
  // Aggregate dashboard stats
  const totalIncidents = zones.reduce((acc, z) => acc + z.activeIncidentsCount, 0);
  const totalCriticalCivilians = zones.reduce((acc, z) => acc + z.criticalCiviliansCount, 0);
  const availableFireTeams = resources.filter((r) => r.type === "fire_team" && r.status === "AVAILABLE").length;
  const availableAmbulances = resources.filter((r) => r.type === "ambulance" && r.status === "AVAILABLE").length;
  const availableRescueVehicles = resources.filter((r) => r.type === "rescue_vehicle" && r.status === "AVAILABLE").length;
  const deployedCount = resources.filter((r) => r.status === "DISPATCHED" || r.status === "BUSY").length;

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-slate-950 p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 font-mono font-bold text-base">
            HQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-400">
                RESQNET TACTICAL DISASTER COMMAND CENTER
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-400 border border-red-500/40 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                DISASTER STATUS: ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Coordinating multi-agency response across Zones A, B, C, and D
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">Connected Zones:</span>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            A, B
          </span>
          <span className="text-[11px] font-mono text-slate-400">Degraded:</span>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            C
          </span>
          <span className="text-[11px] font-mono text-slate-400">Disconnected:</span>
          <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
            D
          </span>
        </div>
      </div>

      {/* 2. Key Metric Counter Widgets (10 core metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-white/10 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Active Incidents</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{totalIncidents} Open</div>
          <span className="text-[10px] text-slate-400">Across 4 disaster zones</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Critical Civilians</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">{totalCriticalCivilians} Trapped</div>
          <span className="text-[10px] text-slate-400">High vulnerability index</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Available Fleet</span>
            <Truck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-400">
            {availableFireTeams} Fire / {availableAmbulances} Amb
          </div>
          <span className="text-[10px] text-slate-400">{availableRescueVehicles} Rescue 4x4 available</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/90 p-3">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Medical Supplies</span>
            <HeartPulse className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">8 Kits / 5 O2</div>
          <span className="text-[10px] text-slate-400">Hospital Depot stock</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/90 p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Active Deployments</span>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-400">{deployedCount} Deployed</div>
          <span className="text-[10px] text-slate-400">Real-time mission tracking</span>
        </div>
      </div>

      {/* 3. 4-Zone Status Cards Grid */}
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Compass className="h-3.5 w-3.5 text-cyan-400" />
          <span>Geographic Zone Threat Matrix (4 Fictional Sectors)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`rounded-2xl border p-4 transition bg-slate-900/80 ${
                zone.severity === "CRITICAL"
                  ? "border-red-500/40 shadow-md shadow-red-500/10"
                  : "border-amber-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  {zone.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    zone.severity === "CRITICAL"
                      ? "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {zone.severity}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{zone.name}</h4>
              <p className="text-[11px] text-slate-400 mb-3">{zone.type}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-white/10 font-mono">
                <div>
                  <span className="text-slate-500 block text-[9px]">INCIDENTS</span>
                  <span className="text-slate-200 font-bold">{zone.activeIncidentsCount} active</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">TRAPPED</span>
                  <span className="text-amber-400 font-bold">{zone.criticalCiviliansCount} civilians</span>
                </div>
              </div>

              <div className="mt-2 text-[10px] font-mono flex items-center justify-between text-slate-400 pt-1">
                <span>COMM: {zone.commStatus}</span>
                <span>DEPLOYED: {zone.deployedResourcesCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Conflict & Dynamic Reallocation Banner (Steps 9 & 10) */}
      {conflict && conflict.has_conflict && (
        <div className="rounded-2xl border border-red-500/60 bg-red-950/40 p-5 shadow-2xl animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white font-bold">
              ⚠️
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">
                DYNAMIC REALLOCATION TRIGGERED
              </span>
              <h3 className="text-base font-bold text-white">
                {conflict.conflict_title}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-black/40 p-3 rounded-xl border border-red-500/30 mb-3 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">INCIDENT A (Urban Sector):</span>
              <span className="text-slate-200 font-bold">{conflict.incident_a?.title}</span>
              <p className="text-[11px] text-slate-400">Priority: {conflict.incident_a?.priority}</p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">INCIDENT C (Flooded Lowlands):</span>
              <span className="text-amber-300 font-bold">{conflict.incident_c?.title}</span>
              <p className="text-[11px] text-red-400 font-semibold">{conflict.incident_c?.vulnerable}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-200 space-y-1 mb-3">
            <p><strong>Clinical &amp; Tactical Evaluation:</strong></p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {conflict.recommendation}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400">
              Coordination Agent: Deterministic Preemption Evaluated
            </span>
            <button
              onClick={() => onRunScenario("scenario_6_dynamic_reallocation")}
              disabled={loading}
              className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
            >
              <span>Approve Dynamic Reallocation ➔ Assign Rescue 02 to Zone C</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Duplicate Effort Detection Alert Banner (Step 11) */}
      {duplicate && duplicate.has_duplicate && (
        <div className="rounded-2xl border border-amber-500/60 bg-amber-950/40 p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-400 animate-bounce" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                  TACTICAL DUPLICATE GUARD
                </span>
                <h3 className="text-sm font-bold text-white">
                  ⚠ DUPLICATE RESOURCE DEPLOYMENT DETECTED
                </h3>
              </div>
            </div>
            <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
              Location: {duplicate.location_name}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Both <strong>{duplicate.duplicate_units.join(" and ")}</strong> are currently deployed to the same incident. Redundant allocation detected while Zone D has zero assigned fire engines.
          </p>

          <div className="rounded-xl bg-black/40 p-3 text-xs text-amber-200 border border-amber-500/30 font-mono mb-3">
            <strong>System Recommendation:</strong> {duplicate.recommendation}
          </div>

          <div className="flex justify-end">
            <button
              onClick={onResolveDuplicate}
              disabled={loading}
              className="rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Redirect Fire Team 02 to Zone D Chemical Fire</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Active Incidents & AI Incident Clustering (#B17) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Incidents List */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-bold">Active Priority Incidents</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {packets.length} Incident Packets Logged
            </span>
          </div>

          <div className="space-y-3">
            {packets.map((pkt) => (
              <div
                key={pkt.packet_id}
                className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-red-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    {pkt.packet_id} · {pkt.location.name}
                  </span>
                  <span className="font-mono text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
                    {pkt.priority}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{pkt.message}</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                  <span>Trapped: {pkt.people}</span>
                  <span>Injured: {pkt.injured}</span>
                  <span>Delivered via: {pkt.delivered_transport}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Incident Clustering Card (#B17) */}
        <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
              <h3 className="text-sm font-bold">AI Incident Clustering Engine</h3>
            </div>
            <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 text-[10px] font-mono font-bold">
              INCIDENT CLUSTER #B17
            </span>
          </div>

          <div className="rounded-xl bg-purple-950/30 border border-purple-500/20 p-3.5 text-xs space-y-2 font-mono">
            <div className="text-slate-200 font-bold">Building B17 Cluster Breakdown:</div>
            <ul className="space-y-1 text-slate-300 text-[11px]">
              <li>├── Estimated Civilians: 3+ Trapped</li>
              <li>├── Casualties: 2 Injured (Smoke Inhalation)</li>
              <li>├── Evidence Base: 4 Citizen SOS Reports Synthesized</li>
              <li>└── Primary Hazard: Active Toxic Smoke &amp; Blocked Egress</li>
            </ul>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">
              Synthesized Citizen Reports (Evidence Stream):
            </span>
            <div className="space-y-1.5">
              {clusters[0]?.reports.map((rep, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-white/5 p-2 text-[11px] flex items-center justify-between border border-white/5"
                >
                  <span className="text-slate-400 font-mono text-[10px]">{rep.citizen}:</span>
                  <span className="text-slate-200 italic">&ldquo;{rep.text}&rdquo;</span>
                  <span className="text-slate-500 font-mono text-[9px]">{rep.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Resource Allocation & Mathematical Rationale Panel (Step 8) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold">
              Deterministic Multi-Objective Resource Allocation Matrix
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            AUDITABLE MATHEMATICAL SCORING
          </span>
        </div>

        {allocations.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No active dispatches. Advance to Scenario 4 (LoRa Recovery) or click Allocate to dispatch.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {allocations.map((alloc) => (
              <div
                key={alloc.id}
                className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{alloc.resource_name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Score: {alloc.score}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {alloc.justification}
                </p>
                <div className="text-[9px] font-mono text-slate-500 pt-1 border-t border-white/10">
                  Target: {alloc.incident_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
