"use client";

/**
 * ==============================================================================
 * RESQNET: Resilient Emergency Communication & Resource Coordination Network
 * Unified Hackathon Demonstration Console (/resqnet)
 * ==============================================================================
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Radio,
  RadioTower,
  Shield,
  Layers,
  Compass,
  Activity,
  FileText,
  Sparkles,
  RefreshCw,
  AlertOctagon,
  ArrowRight,
  Send,
  Home
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { DemoScenarioController } from "@/components/resqnet/DemoScenarioController";
import { CitizenEmergencyView } from "@/components/resqnet/CitizenEmergencyView";
import { CommandCenterDashboard } from "@/components/resqnet/CommandCenterDashboard";
import { CommNetworkMonitor } from "@/components/resqnet/CommNetworkMonitor";
import { AuditTimelineView } from "@/components/resqnet/AuditTimelineView";
import {
  ResqZone,
  ResqResource,
  EmergencyPacket,
  IncidentCluster,
  ResourceAllocation,
  NetworkHealth,
  TransportState,
  AuditEvent,
  DemoScenario
} from "@/lib/resq/types";
import { ConflictResolutionResult, DuplicateDetectionResult } from "@/lib/resq/allocation-engine";

export default function ResqnetPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"command" | "citizen" | "network" | "audit">("command");
  const [loading, setLoading] = useState<boolean>(false);

  // Core State
  const [zones, setZones] = useState<ResqZone[]>([]);
  const [resources, setResources] = useState<ResqResource[]>([]);
  const [packets, setPackets] = useState<EmergencyPacket[]>([]);
  const [clusters, setClusters] = useState<IncidentCluster[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [network, setNetwork] = useState<NetworkHealth>({
    cellular: true,
    internet: true,
    p2p_mesh: true,
    lora_gateway: false,
    store_forward_active: true,
    satellite_simulated: false,
    active_transport: "CELLULAR",
    pending_packets_count: 0,
    buffered_packets: [],
  });
  const [transports, setTransports] = useState<TransportState[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [activeScenario, setActiveScenario] = useState<DemoScenario>("scenario_1_normal");
  const [conflict, setConflict] = useState<ConflictResolutionResult | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateDetectionResult | null>(null);
  const [lastRoute, setLastRoute] = useState<any>(null);

  // Fetch initial state
  const fetchState = async () => {
    try {
      const res = await fetch("/api/resq/state");
      const json = await res.json();
      if (json.success && json.data) {
        setZones(json.data.zones || []);
        setResources(json.data.resources || []);
        setPackets(json.data.packets || []);
        setClusters(json.data.clusters || []);
        setAllocations(json.data.allocations || []);
        setNetwork(json.data.network);
        setTransports(json.data.transports || []);
        setAuditEvents(json.data.audit_events || []);
        setActiveScenario(json.data.active_scenario);
        setConflict(json.data.active_conflict);
        setDuplicate(json.data.active_duplicate);
        setLastRoute(json.data.last_delivery_route);
      }
    } catch (e) {
      console.error("Failed to fetch RESQNET state:", e);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Run Scenario
  const handleSelectScenario = async (scenario: DemoScenario) => {
    setLoading(true);
    try {
      const res = await fetch("/api/resq/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scenario", scenario }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setZones(json.data.zones);
        setResources(json.data.resources);
        setPackets(json.data.packets);
        setClusters(json.data.clusters);
        setAllocations(json.data.allocations);
        setNetwork(json.data.network);
        setTransports(json.data.transports);
        setAuditEvents(json.data.audit_events);
        setActiveScenario(json.data.active_scenario);
        setConflict(json.data.active_conflict);
        setDuplicate(json.data.active_duplicate);
        setLastRoute(json.data.last_delivery_route);

        // Notify presenter
        const labelMap: Record<DemoScenario, string> = {
          scenario_1_normal: "Scenario 1: Normal Network Active",
          scenario_2_cellular_down: "Scenario 2: Cellular Failure (P2P Mesh Engaged)",
          scenario_3_total_blackout: "Scenario 3: Total Blackout (Store & Forward Active)",
          scenario_4_lora_recovery: "Scenario 4: LoRa Gateway Recovered (868 MHz)",
          scenario_5_resource_shortage: "Scenario 5: Zone C Flood Escalation (Conflict Detected)",
          scenario_6_dynamic_reallocation: "Scenario 6: Dynamic Reallocation Executed",
          scenario_7_duplicate_deployment: "Scenario 7: Duplicate Deployment Flagged",
          reset: "Demo Environment Cleanly Reset",
        };
        toast.success(labelMap[scenario] || "Scenario updated");
      }
    } catch (e) {
      toast.error("Failed to trigger scenario");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Transport
  const handleToggleTransport = async (transport: string, online: boolean) => {
    try {
      const res = await fetch("/api/resq/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_transport", transport, online }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setNetwork(json.data.network);
        setTransports(json.data.transports);
        setAuditEvents(json.data.audit_events);
        setLastRoute(json.data.last_delivery_route);
        toast.info(`Transport ${transport.toUpperCase()} set to ${online ? "ONLINE" : "OFFLINE"}`);
      }
    } catch (e) {
      toast.error("Failed to toggle transport");
    }
  };

  // Submit Citizen SOS
  const handleSubmitSos = async (message: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/resq/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setPackets(json.data.state.packets);
        setLastRoute(json.data.route);
        setAuditEvents(json.data.state.audit_events);
        toast.success("Emergency SOS Submitted", {
          description: json.data.route.status_text,
        });
      }
    } catch (e) {
      toast.error("Failed to send SOS");
    } finally {
      setLoading(false);
    }
  };

  // Resolve Duplicate Deployment
  const handleResolveDuplicate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resq/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve_duplicate" }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setAllocations(json.data.allocations);
        setResources(json.data.resources);
        setDuplicate(json.data.active_duplicate);
        setAuditEvents(json.data.audit_events);
        toast.success("Redirection Confirmed", {
          description: "Fire Team 02 successfully rerouted to Zone D Industrial Plant.",
        });
      }
    } catch (e) {
      toast.error("Failed to resolve duplicate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] bg-gradient-to-br from-[#090D16] via-[#0D1322] to-[#11192E] text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      {/* Top Banner Navigation */}
      <header className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-red-600 text-white font-bold shadow-lg shadow-amber-500/20">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                RESQNET
              </h1>
              <span className="rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold">
                PS20 HACKATHON MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Resilient Emergency Communication &amp; Resource Coordination Network
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/authority")}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-slate-300 transition flex items-center gap-1.5"
          >
            <Compass className="h-3.5 w-3.5 text-blue-400" />
            <span>Authority War Room</span>
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-slate-300 transition flex items-center gap-1.5"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Presenter Scenario Controller Bar (Sticky Top) */}
        <DemoScenarioController
          activeScenario={activeScenario}
          network={network}
          onSelectScenario={handleSelectScenario}
          onToggleTransport={handleToggleTransport}
          loading={loading}
        />

        {/* 4 Main View Switcher Tabs */}
        <nav aria-label="RESQNET Views" className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("command")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "command"
                ? "bg-red-600/20 border border-red-500/50 text-white shadow-md shadow-red-500/10 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Shield className="h-4 w-4 text-red-400" />
            <span>Rescue Command Center (Zones A–D)</span>
          </button>

          <button
            onClick={() => setActiveTab("citizen")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "citizen"
                ? "bg-amber-500/20 border border-amber-500/50 text-white shadow-md shadow-amber-500/10 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Send className="h-4 w-4 text-amber-400" />
            <span>Citizen Emergency Interface</span>
          </button>

          <button
            onClick={() => setActiveTab("network")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "network"
                ? "bg-cyan-500/20 border border-cyan-500/50 text-white shadow-md shadow-cyan-500/10 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>Network Health &amp; Topology</span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-emerald-500/20 border border-emerald-500/50 text-white shadow-md shadow-emerald-500/10 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            <span>Audit Timeline ({auditEvents.length})</span>
          </button>
        </nav>

        {/* Tab 1: Command Center Dashboard */}
        {activeTab === "command" && (
          <CommandCenterDashboard
            zones={zones}
            resources={resources}
            packets={packets}
            clusters={clusters}
            allocations={allocations}
            network={network}
            conflict={conflict}
            duplicate={duplicate}
            onResolveDuplicate={handleResolveDuplicate}
            onRunScenario={handleSelectScenario}
            loading={loading}
          />
        )}

        {/* Tab 2: Citizen Emergency Interface */}
        {activeTab === "citizen" && (
          <CitizenEmergencyView
            network={network}
            latestPacket={packets[0]}
            lastRoute={lastRoute}
            onSubmitSos={handleSubmitSos}
            loading={loading}
          />
        )}

        {/* Tab 3: Communication Network Monitor */}
        {activeTab === "network" && (
          <CommNetworkMonitor network={network} transports={transports} />
        )}

        {/* Tab 4: Audit Timeline View */}
        {activeTab === "audit" && <AuditTimelineView events={auditEvents} />}
      </main>

      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}
