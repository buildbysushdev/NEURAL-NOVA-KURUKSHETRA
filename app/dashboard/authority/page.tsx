"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Authority Master Tactical Console (/dashboard/authority/page.tsx)
 * ==============================================================================
 * 
 * Command Glass Design System:
 * - Frosted glass cards on deep gradient background
 * - Purposeful severity accents: Critical (#EF4444), Warning (#F59E0B), Safe (#10B981), Info (#3B82F6)
 * - Hero Stat Cards with ambient glow blobs and drop-shadow metrics
 * - Live India GIS Command Map with NASA FIRMS & USGS real-time feeds
 * - Timeline-style AI Agent Audit Trail with manual commander ratification
 * - Glowing CTA "Simulate Disaster Scenario" with animated shimmer
 */

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import InventoryTable from "@/components/InventoryTable";
import AuditLog from "@/components/AuditLog";
import { DispatchedNotificationFeed } from "@/components/authority/DispatchedNotificationFeed";
import { IncidentReport } from "@/components/ReportForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Shield,
  Activity,
  Package,
  Users,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Layers,
  MapPin,
  TrendingUp,
  Loader2,
  History,
  Radio,
  BookOpen,
  Brain,
  Cpu,
  BellRing,
} from "lucide-react";
import ZoneDetailPanel from "@/components/authority/ZoneDetailPanel";
import { HistoricalChecklistPanel } from "@/components/authority/HistoricalChecklistPanel";
import { CAPDispatchPanel } from "@/components/authority/CAPDispatchPanel";
import { AICopilotPanel } from "@/components/authority/AICopilotPanel";
import { EmergencyAlertsTab } from "@/components/authority/EmergencyAlertsTab";
import { AgentOrchestrationVisualizer } from "@/components/authority/AgentOrchestrationVisualizer";
import { WeatherTelemetryBar } from "@/components/authority/WeatherTelemetryBar";
import type { TacticalZone } from "@/components/authority/TacticalIndiaMap";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { SimulateButton } from "@/components/simulation/SimulateButton";
import { MesmerizingSimulationModal } from "@/components/authority/MesmerizingSimulationModal";

// Dynamic client-only Tactical India Command Map with shape-matching skeleton loading
const TacticalIndiaMap = dynamic(
  () => import("@/components/authority/TacticalIndiaMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between backdrop-blur-md">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-52 bg-white/[0.06]" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 bg-white/[0.06]" />
            <Skeleton className="h-5 w-16 bg-white/[0.06]" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Loader2 className="h-7 w-7 text-slate-400 animate-spin" strokeWidth={1.75} />
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Synchronizing NASA FIRMS &amp; USGS Satellite Telemetry...
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <Skeleton className="h-3 w-36 bg-white/[0.06]" />
          <Skeleton className="h-3 w-28 bg-white/[0.06]" />
        </div>
      </div>
    ),
  }
);

// Legend Dot Component
function LegendDot({
  color,
  label,
}: {
  color: "red" | "amber" | "emerald";
  label: string;
}) {
  const dotClass = {
    red: "bg-red-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${dotClass[color]}`} />
      <span className="text-[11px] text-slate-400">{label}</span>
    </div>
  );
}

const INITIAL_MASTER_INCIDENTS: IncidentReport[] = [
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d901",
    type: "Structural Collapse",
    description: "Port warehouse roof collapsed after torrential rainfall; multiple workers trapped. [Zone A - North Harbor]",
    location_lat: 13.1025,
    location_lng: 80.2985,
    latitude: 13.1025,
    longitude: 80.2985,
    severity: "CRITICAL",
    severity_score: 9,
    needed_resources: ["medical", "tent", "boats"],
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d902",
    type: "Storm Surge & Coastal Flood",
    description: "Storm surge breached coastal seawall along Marina Beach. Water entered residential communities. [Zone B - Marina]",
    location_lat: 13.0544,
    location_lng: 80.2818,
    latitude: 13.0544,
    longitude: 80.2818,
    severity: "CRITICAL",
    severity_score: 8,
    needed_resources: ["boats", "water"],
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d903",
    type: "Electrical Transformer Fire",
    description: "Substation short-circuit from flood infiltration near Anna Salai corridor. [Zone C - Central Metro]",
    location_lat: 13.0827,
    location_lng: 80.2707,
    latitude: 13.0827,
    longitude: 80.2707,
    severity: "HIGH",
    severity_score: 7,
    needed_resources: ["fire_tender", "medical"],
    created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d904",
    type: "Road Blockage & Rising Water",
    description: "Debris blocking canal discharge route. Heavy machinery required for clearing. [Zone D - Velachery]",
    location_lat: 12.9815,
    location_lng: 80.218,
    latitude: 12.9815,
    longitude: 80.218,
    severity: "MODERATE",
    severity_score: 5,
    needed_resources: ["machinery"],
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

export default function AuthorityDashboardPage() {
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_MASTER_INCIDENTS);
  const [loadingIncidents, setLoadingIncidents] = useState<boolean>(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState<boolean>(false);

  // Tactical Right Column Tab Selector (Copilot, Alerts, Orchestration, Checklist, Zone, Audit, Dispatch)
  const [selectedZone, setSelectedZone] = useState<TacticalZone | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<
    "copilot" | "alerts" | "orchestration" | "checklist" | "zone" | "audit" | "dispatch"
  >("copilot");

  const tacticalZones: TacticalZone[] = React.useMemo(() => {
    return incidents.map((inc) => ({
      id: inc.id,
      name: (inc as any).zone || inc.type,
      zone: (inc as any).zone,
      type: inc.type,
      description: inc.description,
      latitude: inc.location_lat ?? inc.latitude ?? 13.0827,
      longitude: inc.location_lng ?? inc.longitude ?? 80.2707,
      location_lat: inc.location_lat ?? inc.latitude ?? 13.0827,
      location_lng: inc.location_lng ?? inc.longitude ?? 80.2707,
      severity: inc.severity || "HIGH",
      severity_score: inc.severity_score,
      status: "open",
      needed_resources: inc.needed_resources,
      created_at: inc.created_at,
    }));
  }, [incidents]);

  const handleSelectZone = (zone: TacticalZone) => {
    setSelectedZone(zone);
    setActiveRightTab("zone");
  };

  // Fetch incidents from Supabase
  const fetchIncidents = async () => {
    if (!isConfigured || !supabase) return;
    setLoadingIncidents(true);
    setIncidentError(null);
    try {
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: IncidentReport[] = data.map((d: any) => {
          const lat = Number(d.location_lat ?? d.latitude) || 13.0827;
          const lng = Number(d.location_lng ?? d.longitude) || 80.2707;
          const score = d.severity_score !== undefined ? Number(d.severity_score) : undefined;
          const sev =
            score !== undefined
              ? score >= 8
                ? "CRITICAL"
                : score >= 6
                ? "HIGH"
                : score >= 4
                ? "MODERATE"
                : "LOW"
              : (d.severity?.toUpperCase() as any) || "HIGH";

          return {
            id: d.id?.toString(),
            type: d.type || "Hazard Incident",
            description: d.description || "Active emergency coordinate.",
            location_lat: lat,
            location_lng: lng,
            latitude: lat,
            longitude: lng,
            severity: sev,
            severity_score: score,
            needed_resources: d.needed_resources || [],
            created_at: d.created_at,
          };
        });
        setIncidents(mapped);
      }
    } catch (err: any) {
      console.warn("Using local incident telemetry fallback:", err);
      setIncidentError("Realtime database synchronization degraded. Operating in local buffer mode.");
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    const unsubscribe = subscribeToIncidents((payload) => {
      const newItem = payload.new;
      if (newItem && (newItem.location_lat || newItem.latitude) && (newItem.location_lng || newItem.longitude)) {
        const lat = Number(newItem.location_lat ?? newItem.latitude);
        const lng = Number(newItem.location_lng ?? newItem.longitude);
        const score = newItem.severity_score !== undefined ? Number(newItem.severity_score) : undefined;
        const sev =
          score !== undefined
            ? score >= 8
              ? "CRITICAL"
              : score >= 6
              ? "HIGH"
              : score >= 4
              ? "MODERATE"
              : "LOW"
            : (newItem.severity?.toUpperCase() as any) || "HIGH";

        const incident: IncidentReport = {
          id: newItem.id?.toString() || `inc-${Date.now()}`,
          type: newItem.type || "Disaster Emergency",
          description: newItem.description || "Active emergency incident reported.",
          location_lat: lat,
          location_lng: lng,
          latitude: lat,
          longitude: lng,
          severity: sev,
          severity_score: score,
          needed_resources: newItem.needed_resources || [],
          created_at: newItem.created_at || new Date().toISOString(),
        };

        setIncidents((prev) => {
          const exists = prev.some((i) => i.id === incident.id);
          if (exists) return prev.map((i) => (i.id === incident.id ? incident : i));
          return [incident, ...prev];
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // One-Click "Simulate Disaster" action
  const handleSimulateDisaster = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/demo/simulate-disaster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      const rawIncidents = data.simulated_incidents || data.incidents;

      if (data.success && rawIncidents && Array.isArray(rawIncidents)) {
        const mapped: IncidentReport[] = rawIncidents.map((d: any) => ({
          id: d.id?.toString() || `sim-${Date.now()}`,
          type: d.type || "Disaster Event",
          description: d.description || "Simulated emergency sector.",
          location_lat: Number(d.location_lat ?? d.latitude) || 13.0827,
          location_lng: Number(d.location_lng ?? d.longitude) || 80.2707,
          latitude: Number(d.location_lat ?? d.latitude) || 13.0827,
          longitude: Number(d.location_lng ?? d.longitude) || 80.2707,
          severity:
            d.severity_score >= 8
              ? "CRITICAL"
              : d.severity_score >= 6
              ? "HIGH"
              : d.severity_score >= 4
              ? "MODERATE"
              : "LOW",
          severity_score: d.severity_score || 8,
          needed_resources: d.needed_resources || [],
          created_at: d.created_at || new Date().toISOString(),
        }));

        setIncidents((prev) => [...mapped, ...prev]);
        toast.success("Simulation Wave Dispatched", {
          description: "5 multi-zone disaster clusters injected into tactical map.",
        });
      }
    } catch (err) {
      toast.info("Offline Wave Triggered", {
        description: "Simulated tactical wave updated on local master map.",
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleSimulationComplete = (newIncidents: any[]) => {
    if (newIncidents && newIncidents.length > 0) {
      const mapped: IncidentReport[] = newIncidents.map((d: any) => {
        const lat = Number(d.location_lat ?? d.latitude) || 13.0827;
        const lng = Number(d.location_lng ?? d.longitude) || 80.2707;
        const score = d.severity_score || 8;
        return {
          id: d.id?.toString() || `sim-${Date.now()}-${Math.random()}`,
          type: d.type || "Disaster Event",
          description: d.description || "Simulated emergency sector.",
          location_lat: lat,
          location_lng: lng,
          latitude: lat,
          longitude: lng,
          severity:
            score >= 8
              ? "CRITICAL"
              : score >= 6
              ? "HIGH"
              : score >= 4
              ? "MODERATE"
              : "LOW",
          severity_score: score,
          needed_resources: d.needed_resources || ["rescue_boats", "medical_kits"],
          created_at: d.created_at || new Date().toISOString(),
        };
      });
      setIncidents((prev) => [...mapped, ...prev]);
    }
    fetchIncidents();
  };

  // Stat metrics
  const totalIncidents = incidents.length;
  const criticalAlerts = incidents.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").length;
  const activeRescueTeams = 8;
  const resourcesAvailable = "8,245";

  return (
    <div className="space-y-6 text-slate-100 font-ibm-sans pb-24 relative">
      
      {/* 8. Page Header — Clean Command Glass */}
      <PageHeader
        eyebrow="Operational Console — State Disaster Management Authority"
        title="Tactical Disaster Command"
        description="Real-time GIS telemetry, autonomous Sentinel triage, and Strategist AI resource distribution"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setSimulationModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white text-sm font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95 border border-red-400/40"
            >
              <Cpu className="w-4 h-4 animate-pulse" />
              <span>Simulate Crisis Wave (Live Swarm)</span>
            </button>

            <button
              onClick={fetchIncidents}
              disabled={loadingIncidents}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] transition shadow-sm self-start sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loadingIncidents ? "animate-spin text-white" : ""}`} />
              <span>Re-sync Grid</span>
            </button>
          </div>
        }
        statusIndicator="live"
      />

      {incidentError && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs flex items-center justify-between gap-2 text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{incidentError}</span>
          </div>
          <button
            onClick={fetchIncidents}
            className="font-mono text-[11px] font-semibold text-slate-200 hover:underline"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* 4. Stats Cards Row (The Hero Numbers) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Incidents"
          value={totalIncidents.toString()}
          subtitle="Sector zones A through E"
          icon={Activity}
          trend="+2 in last hour"
          color="blue"
        />
        <StatCard 
          label="Resources Available"
          value={resourcesAvailable}
          subtitle="Units across 4 regional hubs"
          icon={Package}
          color="emerald"
        />
        <StatCard 
          label="Active Rescue Teams"
          value={activeRescueTeams.toString()}
          subtitle="Field squads on duty"
          icon={Users}
          color="violet"
        />
        <StatCard 
          label="AI Critical Alerts"
          value={criticalAlerts.toString()}
          subtitle="Priority score ≥ 7"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* 5 & 6. Middle Section: Map + Telemetry + AI System Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 60% (7 Cols) Live Tactical India Map & Telemetry HUD */}
        <div id="map-section" className="lg:col-span-7 space-y-4">
          
          {/* Real-time Environmental & Weather Telemetry HUD */}
          <WeatherTelemetryBar fireCount={139} quakeCount={2} />

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden backdrop-blur-md">
            {/* Map Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Regional Incident Telemetry (Crisp Esri Tactical Canvas)
                </h3>
              </div>
              
              {/* Legend Dots */}
              <div className="flex items-center gap-4">
                <LegendDot color="red" label="Critical" />
                <LegendDot color="amber" label="Watch" />
                <LegendDot color="emerald" label="Safe" />
              </div>
            </div>

            {/* Live Command Map Container */}
            <TacticalIndiaMap
              initialZones={tacticalZones}
              onSelectZone={handleSelectZone}
              selectedZoneId={selectedZone?.id}
            />
          </div>

          {/* Dispatched Broadcast Notification Feed */}
          <DispatchedNotificationFeed />
        </div>

        {/* Right Column: 40% (5 Cols) Live AI Copilot, Emergency Alerts & Workflow Tabs */}
        <div id="audit-section" className="lg:col-span-5 space-y-4">
          {/* Command Console 7-Way Tab Header */}
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-3 text-xs font-medium overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveRightTab("copilot")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeRightTab === "copilot"
                  ? "bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Copilot (Live)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab("alerts")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeRightTab === "alerts"
                  ? "bg-red-500/15 border border-red-500/40 text-red-300 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Emergency Alerts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab("orchestration")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeRightTab === "orchestration"
                  ? "bg-violet-500/15 border border-violet-500/40 text-violet-300 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span>AI Workflow</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab("checklist")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeRightTab === "checklist"
                  ? "bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Checklist</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab("zone")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeRightTab === "zone"
                  ? "bg-blue-500/15 border border-blue-500/40 text-blue-300 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Zone Inspector</span>
              {selectedZone && (
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab("audit")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeRightTab === "audit"
                  ? "bg-white/[0.08] text-slate-100 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>Audit Trail</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab("dispatch")}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                activeRightTab === "dispatch"
                  ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>CAP Dispatch</span>
            </button>
          </div>

          {/* Right Column Content Panel */}
          {activeRightTab === "copilot" ? (
            <AICopilotPanel />
          ) : activeRightTab === "alerts" ? (
            <EmergencyAlertsTab />
          ) : activeRightTab === "orchestration" ? (
            <AgentOrchestrationVisualizer />
          ) : activeRightTab === "zone" ? (
            <ZoneDetailPanel
              zone={selectedZone}
              onClose={() => setActiveRightTab("copilot")}
              onDispatchSquad={(z) => {
                toast.success("Emergency Response Squad Dispatched", {
                  description: `Tactical unit en route to ${z.name || z.type}.`,
                });
              }}
            />
          ) : activeRightTab === "checklist" ? (
            <HistoricalChecklistPanel
              selectedZoneType={selectedZone?.type}
              selectedZoneLocation={selectedZone?.name || selectedZone?.zone}
            />
          ) : activeRightTab === "dispatch" ? (
            <CAPDispatchPanel />
          ) : (
            <AuditLog />
          )}
        </div>
      </div>



      {/* Bottom: Resource Inventory Table in Glass Container */}
      <div id="inventory-section" className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-md">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-200">
            Regional Logistics &amp; Relief Stock Inventory
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time supply tracking across designated Forward Relief Depots.
          </p>
        </div>
        <InventoryTable />
      </div>

      {/* Autonomous Simulation Launcher (Scenario Picker + 5-Stage Live Drawer) */}
      <SimulateButton onComplete={handleSimulationComplete} />

      {/* Mesmerizing Multi-Agent Crisis Simulator Modal & Ratification Engine */}
      <MesmerizingSimulationModal
        isOpen={simulationModalOpen}
        onClose={() => setSimulationModalOpen(false)}
        onSimulationDispatched={(scen) => {
          const newIncident: IncidentReport = {
            id: `sim-${Date.now()}`,
            type: scen.type,
            description: `${scen.name}: ${scen.summary}`,
            location_lat: scen.lat,
            location_lng: scen.lng,
            latitude: scen.lat,
            longitude: scen.lng,
            severity: "CRITICAL",
            severity_score: scen.severity,
            needed_resources: ["rescue_boats", "medical_kits", "life_jackets"],
            created_at: new Date().toISOString(),
          };
          setIncidents((prev) => [newIncident, ...prev]);
        }}
      />

    </div>
  );
}
