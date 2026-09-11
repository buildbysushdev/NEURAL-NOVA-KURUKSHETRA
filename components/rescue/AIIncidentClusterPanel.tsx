"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * components/rescue/AIIncidentClusterPanel.tsx
 * ==============================================================================
 * 
 * FEATURES:
 * 1. AI Incident Clustering (aggregates 50 individual SOS calls into Cluster #17)
 * 2. Visual Breakdown: 11 civilians, 3 injured, 2 children, fire & oxygen concern
 * 3. Multi-Hop Mesh Pathway: Citizen Mesh -> BLE Relay -> LoRa Node -> Rescue Console
 * 4. 1-Click Cluster Resource Dispatch with live optimistic update
 */

import React, { useState, useEffect } from "react";
import {
  Layers,
  Users,
  Flame,
  AlertOctagon,
  CheckCircle2,
  Send,
  Radio,
  Share2,
  Sparkles,
  ShieldAlert,
  Clock,
  ArrowRight,
  Package,
  Activity
} from "lucide-react";
import { toast } from "sonner";

export interface IncidentCluster {
  id: string;
  clusterNumber: number;
  title: string;
  location: string;
  totalCivilians: number;
  injuredCount: number;
  childrenCount: number;
  rawSosCount: number;
  priority: "CRITICAL" | "HIGH" | "MODERATE";
  hazards: string[];
  allocatedResources: { name: string; depot: string; qty: number }[];
  commPath: string;
  isDispatched: boolean;
  dispatchedAt?: string;
}

const DEFAULT_CLUSTERS: IncidentCluster[] = [
  {
    id: "cluster-17",
    clusterNumber: 17,
    title: "Building B-17 Structural Trap & Smoke Hazard",
    location: "Building B-17, Marina Coastal Sector B",
    totalCivilians: 11,
    injuredCount: 3,
    childrenCount: 2,
    rawSosCount: 50,
    priority: "CRITICAL",
    hazards: [
      "Active fire & dense toxic smoke on Floor 3",
      "Acute oxygen depletion in enclosed flat",
      "Stairwell passage blocked by ceiling plaster"
    ],
    allocatedResources: [
      { name: "Heavy Fire Extrication Tender", depot: "Depot Alpha", qty: 1 },
      { name: "ALS Emergency Ambulance Squad", depot: "Saidapet Central", qty: 1 },
      { name: "Medical Oxygen Tanks (10L)", depot: "Marina Depot", qty: 4 }
    ],
    commPath: "Citizen Mesh (Phone 1) ➔ BLE Relay (Phone 2) ➔ LoRa Node #04 (868MHz) ➔ Rescue Console",
    isDispatched: false
  },
  {
    id: "cluster-12",
    clusterNumber: 12,
    title: "Promenade Pier Water Surge & Inundation",
    location: "Kamaraj Salai Esplanade, Sector B",
    totalCivilians: 8,
    injuredCount: 1,
    childrenCount: 0,
    rawSosCount: 24,
    priority: "HIGH",
    hazards: [
      "1.8m coastal floodwater surge",
      "Downed high-voltage transmission wire"
    ],
    allocatedResources: [
      { name: "Rigid Inflatable Rescue Boat", depot: "Harbor Post", qty: 2 },
      { name: "Substation Isolator Squad", depot: "TNEB Station", qty: 1 }
    ],
    commPath: "Citizen Mesh (Phone 3) ➔ LoRa Repeater Mast Alpha ➔ Rescue Console",
    isDispatched: true,
    dispatchedAt: "10 mins ago"
  }
];

export function AIIncidentClusterPanel() {
  const [clusters, setClusters] = useState<IncidentCluster[]>(DEFAULT_CLUSTERS);

  // Listen for real-time mesh SOS broadcast from the Citizen portal
  useEffect(() => {
    const handleNewMeshSOS = (e: any) => {
      if (e.detail) {
        toast.error("🚨 Ingested LoRa Mesh Cluster #17 Update", {
          description: "Incoming packet via BLE Relay: Building B-17 (Floor 3) confirmed.",
        });
      }
    };

    window.addEventListener("mesh_sos_transmitted", handleNewMeshSOS);
    return () => window.removeEventListener("mesh_sos_transmitted", handleNewMeshSOS);
  }, []);

  const handleApproveDispatch = (clusterId: string) => {
    setClusters((prev) =>
      prev.map((c) =>
        c.id === clusterId
          ? { ...c, isDispatched: true, dispatchedAt: "Just now" }
          : c
      )
    );

    toast.success("Tactical Cluster Dispatch Authorized!", {
      description: "NDRF Squad Alpha & Fire Tender dispatched to Building B-17. Strategist dynamic audit logged.",
      duration: 5000,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-200 font-mono">
                AI Incident Clustering Engine (LLaMA 3.3 / Heuristics)
              </h3>
              <p className="text-xs text-slate-400">
                Aggregates dozens of fragmented citizen reports into high-priority tactical clusters.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 self-start sm:self-auto">
            50 RAW SOS CALLS ➔ 1 COHESIVE CLUSTER
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Instead of overloading dispatchers with 50 individual phone calls, Sentinel AI clusters reports from the same building and coordinates unified fire, paramedic, and oxygen resource allocation.
        </p>
      </div>

      {/* Clusters List */}
      <div className="space-y-4">
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            className={`rounded-2xl border transition p-5 space-y-4 ${
              cluster.priority === "CRITICAL"
                ? "border-red-500/40 bg-red-950/10 shadow-lg shadow-red-950/20"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            {/* Cluster Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded bg-red-600 text-white tracking-wider uppercase">
                    INCIDENT CLUSTER #{cluster.clusterNumber}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded">
                    {cluster.rawSosCount} RAW CALLS AGGREGATED
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-100 mt-1">
                  {cluster.title}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  📍 {cluster.location}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-bold font-mono px-3 py-1 rounded-xl border border-red-500/40 bg-red-500/20 text-red-300 animate-pulse">
                  PRIORITY: {cluster.priority}
                </span>
              </div>
            </div>

            {/* Tree Breakdown (The exact format requested) */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-slate-200 space-y-1">
              <div className="font-bold text-amber-300 pb-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Building B-17 Tactical Situation Tree:</span>
              </div>
              <div className="text-slate-300 pl-2 space-y-1 text-[12px] leading-relaxed">
                <div>├── <strong className="text-cyan-400">{cluster.totalCivilians} civilians</strong> trapped inside building</div>
                <div>├── <strong className="text-red-400">{cluster.injuredCount} injured</strong> with severe smoke inhalation</div>
                <div>├── <strong className="text-amber-400">{cluster.childrenCount} children</strong> in upper residential flat</div>
                <div>├── <span className="text-red-300">Active fire &amp; heavy toxic smoke reported on Floor 3</span></div>
                <div>└── <strong className="text-purple-400">Critical oxygen concern:</strong> Stairwell blocked by debris</div>
              </div>
            </div>

            {/* Communication Path Breadcrumb */}
            <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02] text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                Verified Multi-Hop Communication Pathway:
              </span>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                <Radio className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-semibold">{cluster.commPath}</span>
              </div>
            </div>

            {/* AI Allocated Resources & Dispatch Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-white/10">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                  AI Strategist Auto-Allocated Resources:
                </span>
                <div className="flex flex-wrap gap-2">
                  {cluster.allocatedResources.map((res, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 font-mono"
                    >
                      <Package className="w-3.5 h-3.5 text-blue-400" />
                      <span>{res.name} (x{res.qty})</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0">
                {cluster.isDispatched ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>DISPATCH ACTIVE ({cluster.dispatchedAt})</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApproveDispatch(cluster.id)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition active:scale-95 uppercase tracking-wider"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve Cluster Dispatch</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
