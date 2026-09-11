"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Rescue Team Field Console (/dashboard/rescue/page.tsx)
 * ==============================================================================
 * 
 * Strict Institutional Design System:
 * - Base: #12161C, Card: #181E26, Border: #222933, Text: #F6F4EF
 * - Typography: IBM Plex Sans & IBM Plex Mono
 * - On Duty / Off Duty toggle switch
 * - Card-based task list with severity left-border strips
 * - Verb-driven action buttons ("Accept Field Mission", "Mark Mission Resolved")
 * - 3 States: Loading Skeletons, Empty Direction, Error with Retry
 */

import React, { useState, useEffect } from "react";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import TaskCard, { RescueTask } from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
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
  Clock
} from "lucide-react";

const INITIAL_RESCUE_TASKS: RescueTask[] = [
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d901",
    type: "Structural Collapse",
    zone: "Zone A - North Harbor",
    location_name: "Port Warehouse 4, North Harbor Basin",
    description: "Port warehouse roof collapsed after torrential rainfall; multiple workers trapped under debris.",
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
    description: "Storm surge breached coastal seawall along Marina Beach. Water entered lower residential communities.",
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
    description: "Electrical substation explosion following floodwater infiltration near hospital.",
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
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in_progress" | "resolved">("all");

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
      setError("Database stream synchronization degraded. Operating on cached mission log.");
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
          toast.warning("🚨 New Rescue Mission Dispatched", {
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
      await supabase.from("incidents").update({ status: "open" }).eq("id", taskId);
    }
    toast.success("Mission Accepted", {
      description: "Field responder squad status changed to EN ROUTE.",
    });
  };

  const handleComplete = async (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "resolved" } : t))
    );
    if (isConfigured && supabase) {
      await supabase.from("incidents").update({ status: "resolved" }).eq("id", taskId);
    }
    toast.success("Mission Resolved", {
      description: "Incident resolved. Resources marked free for autonomous re-allocation.",
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6 text-[#F6F4EF] font-ibm-sans pb-16">
      
      {/* Rescue Header & On Duty Toggle */}
      <div className="border border-[#222933] bg-[#181E26] p-4 sm:p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={isOnDuty ? "dot-safe" : "dot-watch"} />
            <span className="font-ibm-mono text-[11px] uppercase tracking-widest text-[#8A99AD]">
              TACTICAL FIELD DISPATCH // SQUAD ALPHA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F6F4EF]">
            Active Rescue Operations &amp; Sector Missions
          </h1>
          <p className="text-xs text-[#8A99AD] mt-0.5">
            Card-based responder assignment queue. Accept missions, review required equipment, and report resolution.
          </p>
        </div>

        {/* Duty Status Switch */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-sm border border-[#222933] bg-[#12161C] p-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOnDuty(true);
                toast.success("Responder Status: On Duty", {
                  description: "You are actively receiving dispatch calls.",
                });
              }}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                isOnDuty
                  ? "bg-[#3B6D11] text-white"
                  : "text-[#8A99AD] hover:text-[#F6F4EF]"
              }`}
            >
              On Duty
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOnDuty(false);
                toast.info("Responder Status: Off Duty", {
                  description: "Emergency standby mode active.",
                });
              }}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                !isOnDuty
                  ? "bg-[#854F0B] text-white"
                  : "text-[#8A99AD] hover:text-[#F6F4EF]"
              }`}
            >
              Off Duty
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={fetchTasks}
            disabled={loading}
            className="h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} />
            <span>Re-sync Missions</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="border border-[#222933] border-l-4 border-l-[#854F0B] bg-[#181E26] p-3 text-xs flex items-center justify-between gap-2">
          <span className="text-[#8A99AD]">{error}</span>
          <button
            onClick={fetchTasks}
            className="font-ibm-mono text-[11px] uppercase font-semibold text-[#F6F4EF] hover:underline"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-[#222933]">
        <div className="flex items-center gap-1">
          {(["all", "open", "in_progress", "resolved"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
                filterStatus === status
                  ? "bg-[#F6F4EF] text-[#12161C]"
                  : "text-[#8A99AD] hover:text-[#F6F4EF] hover:bg-[#181E26]"
              }`}
            >
              {status === "all" ? "All Tasks" : status.replace("_", " ")}
            </button>
          ))}
        </div>

        <span className="font-ibm-mono text-[11px] text-[#8A99AD]">
          {filteredTasks.length} MISSIONS DISPLAYED
        </span>
      </div>

      {/* STATE 1: LOADING SKELETONS */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-[#222933] bg-[#181E26] rounded-sm p-4 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32 bg-[#222933]" />
                <Skeleton className="h-4 w-16 bg-[#222933]" />
              </div>
              <Skeleton className="h-10 w-full bg-[#222933]/60" />
              <div className="flex justify-between pt-2 border-t border-[#222933]">
                <Skeleton className="h-7 w-24 bg-[#222933]" />
                <Skeleton className="h-7 w-28 bg-[#222933]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STATE 2: EMPTY STATE */}
      {!loading && filteredTasks.length === 0 && (
        <div className="border border-[#222933] bg-[#181E26] rounded-sm p-12 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-[#3B6D11] mx-auto opacity-70" strokeWidth={1.75} />
          <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#F6F4EF]">
            No Active Rescue Missions in Your Sector
          </h3>
          <p className="text-xs text-[#8A99AD] max-w-md mx-auto leading-relaxed">
            All emergency calls in this sector have been resolved or are being handled by adjoining units. Stand by on radio frequency VHF 156.8 MHz.
          </p>
          <div className="pt-2">
            <Button variant="secondary" onClick={fetchTasks} className="text-xs">
              Check Incident Feed Again
            </Button>
          </div>
        </div>
      )}

      {/* STATE 3: CARD-BASED TASK LIST */}
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
  );
}
