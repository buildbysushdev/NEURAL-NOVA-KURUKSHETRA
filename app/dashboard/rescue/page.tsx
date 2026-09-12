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
import RescueDemoActor from "@/components/demo/RescueDemoActor";
import dynamic from "next/dynamic";

const SupplyRouteAnimation = dynamic(
  () => import("@/components/authority/SupplyRouteAnimation").then((m) => ({ default: m.SupplyRouteAnimation })),
  { ssr: false }
);


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
  const [latestCitizenVoice, setLatestCitizenVoice] = useState<any>(null);
  const [showRescueRoute, setShowRescueRoute] = useState(false);


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

    // Check localStorage for any recently submitted citizen reports or dispatches
    try {
      const localIncidents: any[] = JSON.parse(localStorage.getItem("citizen_submitted_incidents") || "[]");
      if (localIncidents.length > 0) {
        setTasks((prev) => {
          const newTasks: RescueTask[] = localIncidents
            .filter((l) => !prev.some((p) => p.id === l.id.toString()))
            .map((d) => ({
              id: d.id.toString(),
              type: d.type || "Citizen Emergency SOS",
              zone: "Assigned Sector",
              location_name: d.description ? d.description.slice(0, 45) : "Disaster Coordinate",
              description: d.description || "Active emergency dispatch.",
              location_lat: Number(d.location_lat ?? d.latitude) || 13.0827,
              location_lng: Number(d.location_lng ?? d.longitude) || 80.2707,
              latitude: Number(d.location_lat ?? d.latitude) || 13.0827,
              longitude: Number(d.location_lng ?? d.longitude) || 80.2707,
              severity_score: d.severity_score || 8,
              severity: d.severity || "CRITICAL",
              status: "open",
              needed_resources: d.needed_resources || ["boats", "medical"],
              required_resources: d.needed_resources || ["boats", "medical"],
              created_at: d.created_at || new Date().toISOString(),
            }));
          return [...newTasks, ...prev];
        });
      }

      const voiceRaw = localStorage.getItem("latest_citizen_voice_cry");
      if (voiceRaw) {
        setLatestCitizenVoice(JSON.parse(voiceRaw));
      }
    } catch (e) {}

    const seenTaskIds = new Set(INITIAL_RESCUE_TASKS.map((t) => t.id));

    const handleIncomingDispatch = (d: any) => {
      if (!d || !d.id) return;
      const idStr = d.id.toString();
      const newTask: RescueTask = {
        id: idStr,
        type: d.type || "Citizen Emergency SOS",
        zone: "Assigned Sector",
        location_name: d.description ? d.description.slice(0, 45) : "Disaster Coordinate",
        description: d.description || "Active emergency dispatch from Sentinel AI.",
        location_lat: Number(d.location_lat ?? d.latitude) || 13.0827,
        location_lng: Number(d.location_lng ?? d.longitude) || 80.2707,
        latitude: Number(d.location_lat ?? d.latitude) || 13.0827,
        longitude: Number(d.location_lng ?? d.longitude) || 80.2707,
        severity_score: d.severity_score || 8,
        severity: d.severity || "CRITICAL",
        status: "open",
        needed_resources: d.needed_resources || ["boats", "medical"],
        required_resources: d.needed_resources || ["boats", "medical"],
        created_at: d.created_at || new Date().toISOString(),
      };

      setTasks((prev) => {
        if (prev.some((t) => t.id === idStr)) return prev;
        return [newTask, ...prev];
      });

      if (!seenTaskIds.has(idStr)) {
        seenTaskIds.add(idStr);
        toast.error("🚨 IMMEDIATE RESCUE DISPATCH ALERT", {
          id: `rescue-dispatch-${idStr}`,
          description: `${newTask.type} at [${newTask.latitude?.toFixed(4)}, ${newTask.longitude?.toFixed(4)}]: ${newTask.description.slice(0, 50)}...`,
          duration: 5000,
        });
      }
    };

    const handleStorage = (e: StorageEvent) => {
      try {
        if (e.key && e.key !== "kurukshetra_latest_incident" && e.key !== "kurukshetra_latest_dispatch" && e.key !== "latest_citizen_voice_cry") {
          return;
        }
        const raw = localStorage.getItem("kurukshetra_latest_incident") || localStorage.getItem("kurukshetra_latest_dispatch");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.id && !seenTaskIds.has(parsed.id.toString())) {
            handleIncomingDispatch(parsed);
          }
        }
        const voiceRaw = localStorage.getItem("latest_citizen_voice_cry");
        if (voiceRaw) {
          setLatestCitizenVoice(JSON.parse(voiceRaw));
        }
      } catch (err) {}
    };

    let lastVoiceNotice = 0;
    const handleVoiceTransmitted = (e: any) => {
      if (e.detail) {
        setLatestCitizenVoice(e.detail);
        const now = Date.now();
        if (now - lastVoiceNotice > 3000) {
          lastVoiceNotice = now;
          toast.error("🚨 LIVE CITIZEN VOICE SOS RECEIVED", {
            id: `rescue-voice-sos-${e.detail?.timestamp || now}`,
            description: `Voice broadcast from ${e.detail?.location?.locationName || "Sector B"} (${e.detail?.location?.building || "Building B-17"}). Coords locked.`,
            duration: 5000,
          });
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    const customListener = (e: any) => handleIncomingDispatch(e.detail);
    window.addEventListener("kurukshetra:incident_reported", customListener);
    window.addEventListener("kurukshetra:dispatch_created", customListener);
    window.addEventListener("kurukshetra:voice_transmitted", handleVoiceTransmitted);

    let broadcastChannel: any = null;
    if (supabase) {
      broadcastChannel = supabase
        .channel("kurukshetra-realtime-sync")
        .on("broadcast", { event: "scenario_simulated" }, (payload: any) => {
          if (payload?.payload?.incidents) {
            const incoming: RescueTask[] = payload.payload.incidents.map((d: any) => ({
              id: d.id.toString(),
              type: d.type || "Rescue Incident",
              zone: d.location_name || "Assigned Sector",
              location_name: d.location_name || (d.description ? d.description.slice(0, 45) : "Disaster Coordinate"),
              description: d.description || "Active field response mission.",
              location_lat: Number(d.location_lat ?? d.latitude) || 13.0827,
              location_lng: Number(d.location_lng ?? d.longitude) || 80.2707,
              latitude: Number(d.location_lat ?? d.latitude) || 13.0827,
              longitude: Number(d.location_lng ?? d.longitude) || 80.2707,
              severity_score: d.severity_score !== undefined ? Number(d.severity_score) : 8,
              severity: d.severity || (d.severity_score >= 8 ? "CRITICAL" : "HIGH"),
              status: d.status || "open",
              needed_resources: d.needed_resources || ["boats", "medical"],
              required_resources: d.needed_resources || ["boats", "medical"],
              created_at: d.created_at || new Date().toISOString(),
            }));
            setTasks((prev) => {
              const existingIds = new Set(incoming.map((i) => i.id));
              return [...incoming, ...prev.filter((p) => !existingIds.has(p.id))];
            });
            toast.error("🚨 NEW DISASTER MISSIONS DISPATCHED TO SQUAD", {
              description: `${incoming.length} priority field missions generated by Strategist AI. Ready for immediate accept.`,
              duration: 6000,
            });
          }
        })
        .on("broadcast", { event: "rescue_status_updated" }, (payload: any) => {
          const p = payload?.payload;
          if (p?.incidentId && p?.status) {
            setTasks((prev) =>
              prev.map((t) => (t.id === p.incidentId ? { ...t, status: p.status } : t))
            );
          }
        })
        .subscribe();
    }

    const unsubscribe = subscribeToIncidents((payload) => {
      if (payload.eventType === "INSERT") {
        const d = payload.new;
        if (d && (d.location_lat || d.latitude)) {
          handleIncomingDispatch(d);
        }
      }
    });

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("kurukshetra:incident_reported", customListener);
      window.removeEventListener("kurukshetra:dispatch_created", customListener);
      window.removeEventListener("kurukshetra:voice_transmitted", handleVoiceTransmitted);
      if (broadcastChannel && supabase) supabase.removeChannel(broadcastChannel);
      unsubscribe();
    };
  }, []);

  const handleAccept = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "in_progress" } : t))
    );
    // Show rescue route animation
    setShowRescueRoute(true);

    try {
      await fetch("/api/rescue/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocationId: taskId,
          incidentId: taskId,
          status: "in_progress",
        }),
      });
    } catch (e) {
      console.warn("handleAccept API warning:", e);
    }

    if (isConfigured && supabase) {
      try {
        await supabase.from("incidents").update({ status: "in_progress" }).eq("id", taskId);
      } catch (err) {}
    }

    toast.success("Mission Accepted", {
      description: "Squad telemetry updated: Status is EN ROUTE. Citizen portal notified.",
    });
  };

  const handleComplete = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "resolved" } : t))
    );

    try {
      await fetch("/api/rescue/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocationId: taskId,
          incidentId: taskId,
          status: "resolved",
        }),
      });
    } catch (e) {
      console.warn("handleComplete API warning:", e);
    }

    if (isConfigured && supabase) {
      try {
        await supabase.from("incidents").update({ status: "resolved" }).eq("id", taskId);
      } catch (err) {}
    }

    // Dynamic Reallocation Demonstration Trigger
    toast.success("Mission Marked Resolved", {
      description: "Strategist Agent notified. Citizen received safe clearance. Resources freed for dynamic reassignment.",
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
      <RescueDemoActor />
      
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
          {/* Authority Live Tactical Dispatch Banner */}
          <IncomingDispatchBanner onInspectTerrain={() => setActiveTab("terrain")} />

          {/* Rescue Route Distance Animation */}
          {showRescueRoute && (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <SupplyRouteAnimation showRescueRoute={true} autoPlay={true} compact={true} />
            </div>
          )}

          {/* Real-time Citizen Voice SOS Banner */}
          {latestCitizenVoice && (
            <div className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-950/50 via-[#0F172A] to-amber-950/40 p-5 backdrop-blur-xl shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/50 text-red-300 font-mono text-[10px] font-bold animate-pulse">
                        LIVE CITIZEN VOICE SOS
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">
                        {latestCitizenVoice.channel || "CH 7 • 462.7125 MHz"}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {latestCitizenVoice.timestamp || "Just now"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      Emergency Voice Distress from {latestCitizenVoice.location?.locationName || "Marina Sector B"}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const taskId = `task-voice-${Date.now()}`;
                      const newTask: RescueTask = {
                        id: taskId,
                        type: "Citizen Voice SOS",
                        zone: "Zone B - Marina Waterfront",
                        location_name: latestCitizenVoice.location?.locationName || "Marina Sector B",
                        description: `Voice Distress: Immediate assistance requested at ${latestCitizenVoice.location?.locationName || "Marina Sector B"} (${latestCitizenVoice.location?.building || "B-17"}, ${latestCitizenVoice.location?.floor || "Floor 3"}).`,
                        location_lat: latestCitizenVoice.location?.lat || 13.0544,
                        location_lng: latestCitizenVoice.location?.lng || 80.2818,
                        latitude: latestCitizenVoice.location?.lat || 13.0544,
                        longitude: latestCitizenVoice.location?.lng || 80.2818,
                        severity: "CRITICAL",
                        severity_score: 9.8,
                        status: "in_progress",
                        needed_resources: ["rescue_boats", "medical_kits", "paramedics"],
                        required_resources: ["rescue_boats", "medical_kits", "paramedics"],
                        created_at: new Date().toISOString(),
                      };
                      setTasks((prev) => [newTask, ...prev.filter((t) => t.id !== taskId)]);
                      toast.success("🚨 SQUAD ALPHA EN ROUTE TO VOICE SOS", {
                        description: `Dispatched to [${newTask.latitude.toFixed(4)}, ${newTask.longitude.toFixed(4)}] (${latestCitizenVoice.location?.building || "Building B-17"}). Telemetry synced.`,
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dispatch Squad Alpha Here</span>
                  </button>
                </div>
              </div>

              {/* Coordinates, Landmark, and Audio row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">GPS Origin Coordinates</span>
                  <div className="text-xs font-mono font-bold text-amber-300">
                    {(latestCitizenVoice.location?.lat || 13.0544).toFixed(4)}° N, {(latestCitizenVoice.location?.lng || 80.2818).toFixed(4)}° E
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${latestCitizenVoice.location?.lat || 13.0544},${latestCitizenVoice.location?.lng || 80.2818}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-mono pt-1"
                  >
                    Open in Google Maps →
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Landmark &amp; Floor Elevation</span>
                  <div className="text-xs font-bold text-slate-100">
                    {latestCitizenVoice.location?.building || "Building B-17 (Flat 304)"}, {latestCitizenVoice.location?.floor || "Floor 3"}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400">
                    Above 1.4m standing water floodline
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Offline Mesh Audio Stream</span>
                  {latestCitizenVoice.audioUrl ? (
                    <audio src={latestCitizenVoice.audioUrl} controls className="w-full h-8 mt-1" />
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-300 font-mono pt-1">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                      <span>Encapsulated Opus/16kHz Mesh Packet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
