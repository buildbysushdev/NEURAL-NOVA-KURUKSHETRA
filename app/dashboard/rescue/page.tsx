"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Rescue Team Field Console (/dashboard/rescue/page.tsx)
 * ==============================================================================
 * 
 * Command Glass Tactical Design System for NDRF / SDRF:
 * - Live Incoming Authority Notification with precise GPS Coordinates
 * - OpenStreetMap Terrain & Road Navigability (Inundation depths, elevation profile)
 * - AI-Recommended Tactical Measures (Groq LLaMA 3.3 SOPs & safety perimeters)
 * - Two-Way Field Stock & Equipment Inventory Sync with Authority Central Depot
 * - Tactical AI Chatbot with Voice Recognition & Alert Sentinel
 * - Mission Task Cards with accept/resolve workflows
 */

import React, { useState, useEffect } from "react";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import TaskCard, { RescueTask } from "@/components/TaskCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Filter,
  UserCheck,
  Shield,
  Layers,
  AlertOctagon,
  Clock,
  Sparkles,
  Compass,
  Package,
  Brain,
  ListTodo
} from "lucide-react";

import { IncomingDispatchBanner } from "@/components/rescue/IncomingDispatchBanner";
import { TerrainRoadAnalysisPanel } from "@/components/rescue/TerrainRoadAnalysisPanel";
import { AITacticalMeasuresPanel } from "@/components/rescue/AITacticalMeasuresPanel";
import { RescueInventoryManager } from "@/components/rescue/RescueInventoryManager";
import { RescueAIChatbot } from "@/components/rescue/RescueAIChatbot";
import WalkieTalkie from "@/components/WalkieTalkie";
import { AIIncidentClusterPanel } from "@/components/rescue/AIIncidentClusterPanel";

const INITIAL_RESCUE_TASKS: RescueTask[] = [
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d901",
    type: "Structural Collapse",
    zone: "Zone A - North Harbor",
    location_name: "Port Warehouse 4, North Harbor Basin",
    description: "Port warehouse roof collapsed after torrential rainfall; multiple workers trapped under debris. Heavy extrication needed.",
    location_lat: 13.1025,
    location_lng: 80.2985,
    latitude: 13.1025,
    longitude: 80.2985,
    severity: "CRITICAL",
    severity_score: 9,
    status: "open",
    needed_resources: ["medical", "tent", "boats"],
    required_resources: ["medical", "tent", "boats"],
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d902",
    type: "Storm Surge & Flood",
    zone: "Zone B - Marina Waterfront",
    location_name: "Marina Beach Esplanade, Promenade Sector",
    description: "Storm surge breached coastal seawall along Marina Beach. Inundation entered residential communities. Standing water 1.4m.",
    location_lat: 13.0544,
    location_lng: 80.2818,
    latitude: 13.0544,
    longitude: 80.2818,
    severity: "CRITICAL",
    severity_score: 8,
    status: "in_progress",
    needed_resources: ["boats", "water"],
    required_resources: ["boats", "water"],
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d903",
    type: "Transformer Explosion",
    zone: "Zone C - Central Metro",
    location_name: "Metro Junction Substation, Anna Salai",
    description: "Electrical substation explosion following floodwater infiltration near hospital. 50m exclusion zone required.",
    location_lat: 13.0827,
    location_lng: 80.2707,
    latitude: 13.0827,
    longitude: 80.2707,
    severity: "HIGH",
    severity_score: 7,
    status: "open",
    needed_resources: ["fire_tender", "medical"],
    required_resources: ["fire_tender", "medical"],
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

export default function RescueDashboardPage() {
  const [tasks, setTasks] = useState<RescueTask[]>(INITIAL_RESCUE_TASKS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnDuty, setIsOnDuty] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"missions" | "terrain" | "measures" | "inventory" | "radio" | "clusters">("missions");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in_progress" | "resolved">("all");

  // Load duty state from localStorage on mount & listen to tab changes
  useEffect(() => {
    const savedDuty = localStorage.getItem("kurukshetra_rescue_duty");
    if (savedDuty !== null) {
      setIsOnDuty(savedDuty === "true");
    }

    const handleTabChange = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
      }
    };
    window.addEventListener("rescue_tab_change", handleTabChange);
    return () => window.removeEventListener("rescue_tab_change", handleTabChange);
  }, []);

  const handleDutyToggle = (duty: boolean) => {
    setIsOnDuty(duty);
    localStorage.setItem("kurukshetra_rescue_duty", String(duty));
    if (duty) {
      toast.success("Responder Status: On Duty", {
        description: "Your squad is actively receiving priority dispatch alerts.",
      });
    } else {
      toast.info("Responder Status: Standby", {
        description: "Duty paused. Standby on emergency radio channel.",
      });
    }
  };

  const fetchTasks = async () => {
    if (!isConfigured || !supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: supaErr } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (supaErr) throw supaErr;

      if (data && data.length > 0) {
        const mapped: RescueTask[] = data.map((d: any) => ({
          id: d.id?.toString(),
          type: d.type || "Rescue Incident",
          zone: "Assigned Sector",
          location_name: d.description ? d.description.slice(0, 45) : "Disaster Coordinate",
          description: d.description || "Active field response mission.",
          location_lat: Number(d.location_lat ?? d.latitude) || 13.0827,
          location_lng: Number(d.location_lng ?? d.longitude) || 80.2707,
          latitude: Number(d.location_lat ?? d.latitude) || 13.0827,
          longitude: Number(d.location_lng ?? d.longitude) || 80.2707,
          severity_score: d.severity_score !== undefined ? Number(d.severity_score) : 7,
          severity: d.severity || "HIGH",
          status: d.status || "open",
          needed_resources: d.needed_resources || [],
          required_resources: d.needed_resources || [],
          created_at: d.created_at,
        }));
        setTasks(mapped);
      }
    } catch (err: any) {
      console.warn("Using offline rescue tasks cache:", err);
      setError("Live incident database stream offline. Operating on cached local mission log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const unsubscribe = subscribeToIncidents((payload) => {
      if (payload.eventType === "INSERT") {
        const d = payload.new;
        if (d && (d.location_lat || d.latitude)) {
          const newTask: RescueTask = {
            id: d.id?.toString() || `task-${Date.now()}`,
            type: d.type || "Field Assignment",
            zone: "Immediate Sector",
            location_name: d.description ? d.description.slice(0, 40) : "Hazard Grid",
            description: d.description || "Emergency dispatch assignment.",
            location_lat: Number(d.location_lat ?? d.latitude) || 13.0827,
            location_lng: Number(d.location_lng ?? d.longitude) || 80.2707,
            latitude: Number(d.location_lat ?? d.latitude) || 13.0827,
            longitude: Number(d.location_lng ?? d.longitude) || 80.2707,
            severity_score: d.severity_score || 7,
            severity: d.severity || "HIGH",
            status: "open",
            needed_resources: d.needed_resources || [],
            required_resources: d.needed_resources || [],
            created_at: d.created_at || new Date().toISOString(),
          };

          setTasks((prev) => [newTask, ...prev]);
          toast.warning("🚨 New Mission Dispatched", {
            description: `${newTask.type} - Severity ${newTask.severity_score}/10`,
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleAccept = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "in_progress" } : t))
    );
    if (isConfigured && supabase) {
      await supabase.from("incidents").update({ status: "in_progress" }).eq("id", taskId);
    }
    toast.success("Mission Accepted", {
      description: "Squad telemetry updated: Status is EN ROUTE.",
    });
  };

  const handleComplete = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "resolved" } : t))
    );
    if (isConfigured && supabase) {
      await supabase.from("incidents").update({ status: "resolved" }).eq("id", taskId);
    }

    // Dynamic Reallocation Demonstration Trigger
    toast.success("Mission Marked Resolved", {
      description: "Strategist Agent notified. Allocated resources freed for dynamic reassignment.",
    });

    // Fire background API re-allocation check
    fetch("/api/ai/reallocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ critical_incident_id: taskId, execute_now: true }),
    }).catch((e) => console.log("Reallocation background dispatch:", e));
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6 text-slate-100 font-ibm-sans pb-24 relative">
      
      {/* 1. Live Authority Incoming Dispatch Banner with Coordinates */}
      <IncomingDispatchBanner
        onInspectTerrain={() => setActiveTab("terrain")}
      />

      {/* 2. Tactical Page Header */}
      <PageHeader
        eyebrow="NDRF / SDRF Tactical Field Command"
        title="Rescue Squad Alpha Operations"
        description="Active GPS dispatches, OpenStreetMap terrain reconnaissance, AI-recommended safety measures & field inventory"
        actions={
          <div className="flex items-center gap-3">
            {/* On / Standby Duty Switch */}
            <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => handleDutyToggle(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                  isOnDuty
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                On Duty
              </button>
              <button
                type="button"
                onClick={() => handleDutyToggle(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all ${
                  !isOnDuty
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Standby
              </button>
            </div>

            <button
              onClick={fetchTasks}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-slate-300 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Sync Feed</span>
            </button>
          </div>
        }
        statusIndicator={isOnDuty ? "live" : "offline"}
      />

      {error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs flex items-center justify-between gap-2 text-amber-300">
          <span>{error}</span>
          <button
            onClick={fetchTasks}
            className="font-mono text-[11px] font-semibold text-slate-200 hover:underline"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* 3. Tactical 4-Way Operational Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab("missions")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "missions"
              ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Missions Queue ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("terrain")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "terrain"
              ? "bg-blue-500/20 border border-blue-500/40 text-blue-300 shadow-md shadow-blue-500/10 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>OpenStreetMap Terrain &amp; Roads</span>
        </button>

        <button
          onClick={() => setActiveTab("measures")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "measures"
              ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-md shadow-cyan-500/10 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>AI Tactical Measures (SOPs)</span>
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "inventory"
              ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Field Stock &amp; HQ Inventory Sync</span>
        </button>

        <button
          onClick={() => setActiveTab("radio")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "radio"
              ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
          }`}
        >
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Walkie Mesh Comms (PTT)</span>
        </button>

        <button
          onClick={() => setActiveTab("clusters")}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition whitespace-nowrap ${
            activeTab === "clusters"
              ? "bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-md shadow-purple-500/10 font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <span>AI Incident Clusters (#17)</span>
        </button>
      </div>

      {/* Tab 1: Missions Queue */}
      {activeTab === "missions" && (
        <div className="space-y-4">
          {/* Sub-filters for tasks */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              {(["all", "open", "in_progress", "resolved"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                    filterStatus === status
                      ? "bg-white/[0.08] text-slate-100 shadow-sm font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                  }`}
                >
                  {status === "all" ? "All Tasks" : status === "in_progress" ? "In Progress" : status.toUpperCase()}
                </button>
              ))}
            </div>

            <span className="font-mono text-xs text-slate-500">
              {filteredTasks.length} active {filteredTasks.length === 1 ? "mission" : "missions"}
            </span>
          </div>

          {/* Skeleton Loaders */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3 animate-pulse"
                >
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32 bg-white/[0.06]" />
                    <Skeleton className="h-5 w-16 bg-white/[0.06]" />
                  </div>
                  <Skeleton className="h-12 w-full bg-white/[0.04]" />
                  <div className="flex justify-between pt-3 border-t border-white/[0.06]">
                    <Skeleton className="h-8 w-24 bg-white/[0.06]" />
                    <Skeleton className="h-8 w-28 bg-white/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTasks.length === 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                All Sector Missions Cleared
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                No pending tasks found for this filter. Stand by on emergency communications channel or trigger a crisis wave from the Authority War Room.
              </p>
            </div>
          )}

          {/* Tasks Grid */}
          {!loading && filteredTasks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAccept={handleAccept}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: OpenStreetMap Terrain & Road Navigability */}
      {activeTab === "terrain" && (
        <TerrainRoadAnalysisPanel
          latitude={13.0544}
          longitude={80.2818}
          zoneName="Marina Coastal Waterfront Basin"
        />
      )}

      {/* Tab 3: AI Tactical Directives (Groq LLaMA 3.3) */}
      {activeTab === "measures" && (
        <AITacticalMeasuresPanel
          incidentType="Storm Surge & Extreme Flooding"
          zoneName="Marina Waterfront Basin"
          severityScore={9}
        />
      )}

      {/* Tab 4: Field Stock & Depot Sync */}
      {activeTab === "inventory" && (
        <RescueInventoryManager />
      )}

      {/* Tab 5: Tactical Offline Mesh Radio (PTT) */}
      {activeTab === "radio" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Radio className="w-4 h-4" />
              <span>NDRF Tactical Field Radio · Offline Mesh Frequency Assignment</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Coordinated by Sentinel AI to prevent radio signal congestion across active flood sectors. Responders hear incoming civilian SOS voice packets with auto-replay, and can broadcast field directives back over CH 7 (462.7125 MHz).
            </p>
          </div>

          <div className="flex justify-center">
            <WalkieTalkie
              role="rescue"
              sector="Zone B • Marina Waterfront Basin"
              channel="CH 7 • 462.7125 MHz"
            />
          </div>
        </div>
      )}

      {/* Tab 6: AI Incident Clusters (Aggregates 50 SOS calls into Building B-17 Cluster #17) */}
      {activeTab === "clusters" && (
        <AIIncidentClusterPanel />
      )}

      {/* 4. Floating Tactical AI Copilot with Voice & Alert Sentinel */}
      <RescueAIChatbot />

    </div>
  );
}
