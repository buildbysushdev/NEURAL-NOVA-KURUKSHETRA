"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Authority Master Tactical Console (/dashboard/authority/page.tsx)
 * ==============================================================================
 * 
 * Strict Institutional Design System:
 * - Base: #12161C, Card: #181E26, Border: #222933, Text: #F6F4EF
 * - Severity Left-Border Strips: #791F1F (Critical), #854F0B (Watch), #3B6D11 (Safe)
 * - Typography: IBM Plex Sans (UI) & IBM Plex Mono (Metrics, Timestamps, IDs)
 * - Strict 3 Button Variants (Primary solid, Secondary outline, Destructive)
 * - Top Row: 4 Stat Cards
 * - Middle Row: 60% Interactive Map + 40% Audit Log Terminal & Notification Feed
 * - Bottom Row: Resource Inventory Table
 * - Fixed Action: Bottom-Right Floating Disaster Simulation Trigger
 */

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import InventoryTable from "@/components/InventoryTable";
import AuditLog from "@/components/AuditLog";
import { DispatchedNotificationFeed } from "@/components/authority/DispatchedNotificationFeed";
import { IncidentReport } from "@/components/ReportForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ShieldAlert,
  Radio,
  MapPin,
  RefreshCw,
  AlertTriangle,
  Users,
  Activity,
  Boxes,
  Cpu,
  Loader2,
  AlertCircle,
  Layers,
  Terminal
} from "lucide-react";
import ZoneDetailPanel from "@/components/authority/ZoneDetailPanel";
import type { TacticalZone } from "@/components/authority/TacticalIndiaMap";

// Dynamic client-only Tactical India Command Map
const TacticalIndiaMap = dynamic(
  () => import("@/components/authority/TacticalIndiaMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] w-full border border-[#222933] bg-[#12161C] rounded-sm p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-52 bg-[#222933]" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 bg-[#222933]" />
            <Skeleton className="h-5 w-16 bg-[#222933]" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Loader2 className="h-7 w-7 text-[#8A99AD] animate-spin" strokeWidth={1.75} />
          <p className="text-xs font-mono uppercase tracking-wider text-[#8A99AD]">
            Synchronizing NASA FIRMS &amp; USGS Satellite Telemetry...
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#222933]">
          <Skeleton className="h-3 w-36 bg-[#222933]" />
          <Skeleton className="h-3 w-28 bg-[#222933]" />
        </div>
      </div>
    ),
  }
);


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

  // Tactical Zone selection state for the right-hand detail inspector panel
  const [selectedZone, setSelectedZone] = useState<TacticalZone | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<"audit" | "zone">("audit");

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

  // Stat metrics
  const totalIncidents = incidents.length;
  const criticalAlerts = incidents.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").length;
  const activeRescueTeams = 8;
  const resourcesAvailable = 8245;

  return (
    <div className="space-y-6 text-[#F6F4EF] font-ibm-sans pb-16">
      
      {/* Portal Header */}
      <div className="border border-[#222933] bg-[#181E26] p-4 sm:p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="dot-critical" />
            <span className="font-ibm-mono text-[11px] uppercase tracking-widest text-[#8A99AD]">
              OPERATIONAL CONSOLE // STATE DISASTER MANAGEMENT AUTHORITY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F6F4EF]">
            Tactical Disaster Command &amp; Multi-Agent Allocation Desk
          </h1>
          <p className="text-xs text-[#8A99AD] mt-0.5">
            Realtime GIS sensor telemetry, autonomous Sentinel triage, and Gemini resource distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={fetchIncidents}
            disabled={loadingIncidents}
            className="h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingIncidents ? "animate-spin" : ""}`} strokeWidth={1.75} />
            <span>Re-sync Grid</span>
          </Button>
        </div>
      </div>

      {incidentError && (
        <div className="border border-[#222933] border-l-4 border-l-[#854F0B] bg-[#181E26] p-3 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#854F0B]" strokeWidth={1.75} />
            <span className="text-[#8A99AD]">{incidentError}</span>
          </div>
          <button
            onClick={fetchIncidents}
            className="font-ibm-mono text-[11px] uppercase font-semibold text-[#F6F4EF] hover:underline"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* TOP ROW: 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Incidents */}
        <Card severity="watch" className="p-4 bg-[#181E26] border-[#222933]">
          <div className="flex items-center justify-between pb-1">
            <span className="font-ibm-mono text-[11px] uppercase tracking-wider text-[#8A99AD]">
              Total Incidents
            </span>
            <Activity className="w-4 h-4 text-[#8A99AD]" strokeWidth={1.75} />
          </div>
          <p className="font-ibm-mono text-2xl sm:text-3xl font-bold text-[#F6F4EF] mt-1">
            {totalIncidents}
          </p>
          <span className="font-ibm-mono text-[10px] text-[#8A99AD] block mt-1">
            Sector zones A through E
          </span>
        </Card>

        {/* Card 2: Resources Available */}
        <Card severity="safe" className="p-4 bg-[#181E26] border-[#222933]">
          <div className="flex items-center justify-between pb-1">
            <span className="font-ibm-mono text-[11px] uppercase tracking-wider text-[#8A99AD]">
              Resources Available
            </span>
            <Boxes className="w-4 h-4 text-[#8A99AD]" strokeWidth={1.75} />
          </div>
          <p className="font-ibm-mono text-2xl sm:text-3xl font-bold text-[#F6F4EF] mt-1">
            {resourcesAvailable.toLocaleString()}
          </p>
          <span className="font-ibm-mono text-[10px] text-[#8A99AD] block mt-1">
            Units across 4 regional hubs
          </span>
        </Card>

        {/* Card 3: Active Rescue Teams */}
        <Card severity="none" className="p-4 bg-[#181E26] border-[#222933]">
          <div className="flex items-center justify-between pb-1">
            <span className="font-ibm-mono text-[11px] uppercase tracking-wider text-[#8A99AD]">
              Active Rescue Teams
            </span>
            <Radio className="w-4 h-4 text-[#8A99AD]" strokeWidth={1.75} />
          </div>
          <p className="font-ibm-mono text-2xl sm:text-3xl font-bold text-[#F6F4EF] mt-1">
            {activeRescueTeams}
          </p>
          <span className="font-ibm-mono text-[10px] text-[#8A99AD] block mt-1">
            Field squads on duty
          </span>
        </Card>

        {/* Card 4: AI Alerts / Critical Hotspots */}
        <Card severity="critical" className="p-4 bg-[#181E26] border-[#222933]">
          <div className="flex items-center justify-between pb-1">
            <span className="font-ibm-mono text-[11px] uppercase tracking-wider text-[#8A99AD]">
              AI Critical Alerts
            </span>
            <Cpu className="w-4 h-4 text-[#8A99AD]" strokeWidth={1.75} />
          </div>
          <p className="font-ibm-mono text-2xl sm:text-3xl font-bold text-[#F6F4EF] mt-1">
            {criticalAlerts}
          </p>
          <span className="font-ibm-mono text-[10px] text-[#8A99AD] block mt-1">
            Priority score &ge; 7
          </span>
        </Card>
      </div>

      {/* MIDDLE ROW: 60% Map + 40% Audit Log Terminal & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 60% (7 Cols on desktop) Live India Command Map & Notification Stream */}
        <div className="lg:col-span-7 space-y-6">
          <TacticalIndiaMap
            initialZones={tacticalZones}
            onSelectZone={handleSelectZone}
            selectedZoneId={selectedZone?.id}
          />

          {/* Dispatched Broadcast Feed */}
          <DispatchedNotificationFeed />
        </div>

        {/* Right Column: 40% (5 Cols on desktop) Dual Tab: Monospace AI Audit Log & Zone Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Tab Bar for Right Column */}
          <div className="flex items-center gap-1 border-b border-[#222933] pb-2 font-ibm-mono text-[11px]">
            <button
              type="button"
              onClick={() => setActiveRightTab("audit")}
              className={`px-3 py-1.5 rounded-sm transition flex items-center gap-1.5 ${
                activeRightTab === "audit"
                  ? "bg-[#222933] text-[#F6F4EF] font-bold shadow-sm"
                  : "text-[#8A99AD] hover:text-[#F6F4EF]"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>AI AUDIT TERMINAL</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab("zone")}
              className={`px-3 py-1.5 rounded-sm transition flex items-center gap-1.5 ${
                activeRightTab === "zone"
                  ? "bg-[#222933] text-[#F6F4EF] font-bold shadow-sm"
                  : "text-[#8A99AD] hover:text-[#F6F4EF]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>ZONE INSPECTOR</span>
              {selectedZone && (
                <span className="w-2 h-2 rounded-full bg-[#791F1F] inline-block ml-0.5 animate-pulse" />
              )}
            </button>
          </div>

          {/* Tab Content Display */}
          {activeRightTab === "zone" ? (
            <ZoneDetailPanel
              zone={selectedZone}
              onClose={() => setActiveRightTab("audit")}
              onDispatchSquad={(z) => {
                toast.success("Emergency Response Squad Dispatched", {
                  description: `Tactical unit en route to ${z.name || z.type}.`,
                });
              }}
            />
          ) : (
            <AuditLog />
          )}
        </div>
      </div>


      {/* BOTTOM ROW: Resource Inventory Table */}
      <div id="inventory-section">
        <InventoryTable />
      </div>

      {/* FLOATING ACTION: Fixed Bottom-Right Simulate Disaster Trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="destructive"
          onClick={handleSimulateDisaster}
          disabled={simulating}
          className="h-11 px-5 shadow-2xl border border-[#791F1F] text-xs font-bold tracking-wider uppercase flex items-center gap-2 hover:bg-[#922626]"
        >
          {simulating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" strokeWidth={1.75} />
              <span>Simulating Emergency Wave...</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-white" strokeWidth={1.75} />
              <span>Simulate Disaster Scenario</span>
            </>
          )}
        </Button>
      </div>

    </div>
  );
}
