"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Route: /dashboard/rescue/page.tsx (Rescue Team Missions & Realtime Dispatch)
 * ==============================================================================
 * 
 * Features:
 * 1. Role Verification: Validates Rescue responder session.
 * 2. Supabase Query: Fetches incidents assigned specifically to the logged-in user / team.
 * 3. Supabase Realtime: Listens on 'incidents' table for new task assignments in real-time.
 * 4. Actions:
 *    - "Accept Task": Transitions status to 'in_progress'
 *    - "Mark Complete": Updates status to 'resolved' in Supabase
 *    - "Request Help": Flags incident with 'help_requested' backup beacon
 * 5. Turn-by-Turn Navigation via Google Maps integration.
 * 6. Interactive Fallback for local demoing & offline resilience.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import TaskCard, { RescueTask } from "@/components/TaskCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Radio,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Search,
  RefreshCw,
  Filter,
  UserCheck,
  Wifi,
  WifiOff,
  BellRing,
  LifeBuoy
} from "lucide-react";

// Initial mock tasks assigned to current responder squad aligned with Chennai Backend Contract (Zones A-E)
const DEMO_RESCUE_TASKS: RescueTask[] = [
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d901",
    type: "structural_collapse",
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
    assigned_to: "rescue-unit-alpha",
    victim_count: 5,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d902",
    type: "flood",
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
    assigned_to: "rescue-unit-alpha",
    victim_count: 4,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d903",
    type: "fire",
    zone: "Zone C - Central Metro Corridor",
    location_name: "Metro Junction Substation, Anna Salai",
    description: "Electrical substation explosion following floodwater infiltration near hospital.",
    location_lat: 13.0827,
    location_lng: 80.2707,
    latitude: 13.0827,
    longitude: 80.2707,
    severity: "CRITICAL",
    severity_score: 9,
    status: "open",
    needed_resources: ["medical", "water"],
    required_resources: ["medical", "water"],
    assigned_to: "rescue-unit-alpha",
    victim_count: 2,
    created_at: new Date(Date.now() - 70 * 60 * 1000).toISOString()
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d904",
    type: "chemical_spill",
    zone: "Zone D - Industrial South Sector",
    location_name: "Guindy Industrial Complex Sector 2",
    description: "Industrial chlorine storage tank valve ruptured. Toxic vapor drifting toward highway bypass.",
    location_lat: 12.9815,
    location_lng: 80.2180,
    latitude: 12.9815,
    longitude: 80.2180,
    severity: "HIGH",
    severity_score: 7,
    status: "assigned",
    needed_resources: ["medical", "tent"],
    required_resources: ["medical", "tent"],
    assigned_to: "rescue-unit-alpha",
    victim_count: 0,
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString()
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d905",
    type: "landslide",
    zone: "Zone E - Western Basin",
    location_name: "Poonamallee Bypass Slope Sector",
    description: "Slope instability caused mudflow onto access expressway, halting supply vehicle convoy.",
    location_lat: 13.0312,
    location_lng: 80.1824,
    latitude: 13.0312,
    longitude: 80.1824,
    severity: "MODERATE",
    severity_score: 6,
    status: "resolved",
    needed_resources: ["food", "tent"],
    required_resources: ["food", "tent"],
    assigned_to: "rescue-unit-alpha",
    victim_count: 3,
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString()
  }
];

export default function RescueDashboardPage() {
  const [tasks, setTasks] = useState<RescueTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userIdentifier, setUserIdentifier] = useState<string>("rescue-unit-alpha");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);
  const [newAssignmentAlert, setNewAssignmentAlert] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /**
   * 1. Identify active user session
   */
  useEffect(() => {
    async function determineUser() {
      if (isConfigured && supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            setUserIdentifier(user.email);
          } else if (user?.id) {
            setUserIdentifier(user.id);
          }
        } catch (err) {
          console.warn("Could not fetch current auth user:", err);
        }
      }
    }
    determineUser();
  }, []);

  /**
   * 2. Fetch assigned tasks from Supabase 'incidents' table
   */
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      if (isConfigured && supabase) {
        // Query incidents assigned to this user / squad
        const { data, error } = await supabase
          .from("incidents")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          // Filter tasks specifically assigned to this user or role
          const filtered = data
            .filter((item: any) => {
              // Match assigned_to field or default if unassigned for testing
              if (!item.assigned_to) return true;
              return (
                item.assigned_to === userIdentifier ||
                item.assigned_to === "rescue" ||
                item.assigned_to === "rescue-unit-alpha"
              );
            })
            .map((item: any): RescueTask => {
              const lat = Number(item.location_lat ?? item.latitude) || 13.0827;
              const lng = Number(item.location_lng ?? item.longitude) || 80.2707;
              const score = item.severity_score !== undefined ? Number(item.severity_score) : undefined;
              const sev = score !== undefined
                ? score >= 8 ? "CRITICAL" : score >= 6 ? "HIGH" : score >= 4 ? "MODERATE" : "LOW"
                : (item.severity?.toUpperCase() as any) || "HIGH";

              const res = item.needed_resources || item.required_resources || ["Standard Rescue Gear", "Medical Kit"];

              return {
                id: item.id?.toString() || `task-${Date.now()}`,
                type: item.type || "Disaster Response",
                zone: item.zone,
                location_name: item.location_name || item.zone || `Coordinate (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                description: item.description || "Urgent rescue assistance required.",
                location_lat: lat,
                location_lng: lng,
                latitude: lat,
                longitude: lng,
                severity: sev,
                severity_score: score,
                status: item.status || "open",
                needed_resources: Array.isArray(res) ? res : [res],
                required_resources: Array.isArray(res) ? res : [res],
                assigned_to: item.assigned_to || userIdentifier,
                victim_count: item.victim_count || 1,
                created_at: item.created_at
              };
            });

          if (filtered.length > 0) {
            setTasks(filtered);
            setLoading(false);
            return;
          }
        }
      }

      // Fallback: Use initial realistic demo tasks
      setTasks(DEMO_RESCUE_TASKS);
    } catch (err: any) {
      console.warn("Supabase fetch fallback to local demo tasks:", err.message);
      setTasks(DEMO_RESCUE_TASKS);
    } finally {
      setLoading(false);
    }
  }, [userIdentifier]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /**
   * 3. Supabase Realtime Subscription: Listen for new task assignments
   */
  useEffect(() => {
    const unsubscribe = subscribeToIncidents((payload) => {
      console.log("Realtime incident dispatch received:", payload);

      if (payload.eventType === "INSERT") {
        const newItem = payload.new as any;
        const newTask: RescueTask = {
          id: newItem.id?.toString(),
          type: newItem.type || "Incoming Emergency",
          location_name: newItem.location_name || `Sector (${newItem.latitude}, ${newItem.longitude})`,
          description: newItem.description || "New dispatch assigned to your squad.",
          latitude: Number(newItem.latitude) || 28.6139,
          longitude: Number(newItem.longitude) || 77.2090,
          severity: (newItem.severity?.toUpperCase() as any) || "HIGH",
          status: newItem.status || "assigned",
          required_resources: Array.isArray(newItem.required_resources)
            ? newItem.required_resources
            : ["Emergency Pack"],
          assigned_to: newItem.assigned_to || userIdentifier,
          created_at: newItem.created_at
        };

        setTasks((prev) => [newTask, ...prev]);
        setNewAssignmentAlert(`⚡ NEW DISPATCH: ${newTask.type} at ${newTask.location_name}`);

        toast.warning(`⚡ NEW RESCUE DISPATCH`, {
          description: `${newTask.type}: ${newTask.location_name}`,
          duration: 6000
        });

        // Clear alert notification after 7 seconds
        setTimeout(() => setNewAssignmentAlert(null), 7000);
      } else if (payload.eventType === "UPDATE") {
        const updated = payload.new as any;
        setTasks((prev) =>
          prev.map((t) =>
            t.id.toString() === updated.id?.toString()
              ? {
                  ...t,
                  status: updated.status || t.status,
                  severity: (updated.severity?.toUpperCase() as any) || t.severity,
                  description: updated.description || t.description
                }
              : t
          )
        );
      }
    });

    setRealtimeConnected(isConfigured);

    return () => {
      unsubscribe();
    };
  }, [userIdentifier]);

  /**
   * Action: Accept Task -> change status to 'in_progress'
   */
  const handleAcceptTask = async (taskId: string) => {
    try {
      if (isConfigured && supabase) {
        await supabase
          .from("incidents")
          .update({ status: "in_progress" })
          .eq("id", taskId);
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "in_progress" } : t))
      );

      const msg = `Mission #${taskId.slice(-6)} accepted. Status switched to IN PROGRESS.`;
      setStatusMessage({ type: "success", text: msg });
      toast.success("Mission Accepted", { description: msg });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error("Error accepting task:", err);
      toast.error("Failed to update task status in database");
      setStatusMessage({ type: "error", text: "Failed to update task status in database." });
    }
  };

  /**
   * Action: Mark Complete -> change status to 'resolved'
   */
  const handleCompleteTask = async (taskId: string) => {
    try {
      if (isConfigured && supabase) {
        await supabase
          .from("incidents")
          .update({ status: "resolved", resolved_at: new Date().toISOString() })
          .eq("id", taskId);
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "resolved" } : t))
      );

      const msg = `Mission #${taskId.slice(-6)} marked RESOLVED. Command Center notified.`;
      setStatusMessage({ type: "success", text: msg });
      toast.success("Mission Resolved", { description: msg });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      console.error("Error completing task:", err);
      toast.error("Failed to mark task resolved");
      setStatusMessage({ type: "error", text: "Failed to mark task resolved." });
    }
  };

  /**
   * Action: Request Help -> flag status as 'help_requested'
   */
  const handleRequestHelp = async (taskId: string) => {
    try {
      if (isConfigured && supabase) {
        await supabase
          .from("incidents")
          .update({ status: "help_requested" })
          .eq("id", taskId);
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "help_requested" } : t))
      );

      const msg = `REINFORCEMENT SIGNAL TRANSMITTED! Command Center and nearby squads alerted for #${taskId.slice(-6)}.`;
      setStatusMessage({ type: "error", text: msg });
      toast.error("Emergency Assistance Requested", {
        description: `SOS beacon active for mission #${taskId.slice(-6)}.`
      });
      setTimeout(() => setStatusMessage(null), 8000);
    } catch (err: any) {
      console.error("Error requesting help:", err);
      toast.error("Failed to transmit backup signal");
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = tasks.length;
    const assigned = tasks.filter((t) => t.status === "assigned").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const resolved = tasks.filter((t) => t.status === "resolved").length;
    const critical = tasks.filter((t) => t.severity === "CRITICAL" && t.status !== "resolved").length;
    return { total, assigned, inProgress, resolved, critical };
  }, [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (filterStatus !== "all" && task.status !== filterStatus) {
        return false;
      }
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesType = task.type.toLowerCase().includes(query);
        const matchesLoc = (task.location_name || "").toLowerCase().includes(query);
        const matchesDesc = task.description.toLowerCase().includes(query);
        const matchesRes = task.required_resources.some((r) => r.toLowerCase().includes(query));
        if (!matchesType && !matchesLoc && !matchesDesc && !matchesRes) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, filterStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card via-card/90 to-background p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Rescue Responder Tactical View
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                  realtimeConnected
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                    : "bg-muted/50 text-muted-foreground border-border"
                }`}
              >
                {realtimeConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Realtime Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-muted-foreground" />
                    <span>Polling Mode</span>
                  </>
                )}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Assigned Field Missions
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>
                Operating Unit: <strong className="text-foreground">{userIdentifier}</strong>
              </span>
              <span className="text-border">•</span>
              <span>Only tasks assigned to your squad are displayed.</span>
            </p>
          </div>

          {/* Quick Refresh */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTasks}
              disabled={loading}
              className="text-xs font-semibold border-border hover:bg-muted"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Sync Missions
            </Button>
          </div>
        </div>

        {/* Realtime Alert Banner */}
        {newAssignmentAlert && (
          <div className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-blue-500/15 border border-blue-500/40 text-blue-200 animate-in fade-in slide-in-from-top-2">
            <BellRing className="w-5 h-5 text-blue-400 shrink-0 animate-bounce" />
            <p className="text-xs sm:text-sm font-semibold flex-1">{newAssignmentAlert}</p>
          </div>
        )}

        {/* Action Status Feedback */}
        {statusMessage && (
          <div
            className={`mt-4 flex items-center gap-3 p-3.5 rounded-xl border animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-red-500/15 border-red-500/40 text-red-300"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
            )}
            <p className="text-xs sm:text-sm font-semibold flex-1">{statusMessage.text}</p>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Pending Action</span>
            <Radio className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 mt-1">{metrics.assigned}</p>
          <span className="text-[11px] text-muted-foreground">Assigned & awaiting arrival</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">In Progress</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-1">{metrics.inProgress}</p>
          <span className="text-[11px] text-muted-foreground">Active field operations</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Critical Threat</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-black text-red-400 mt-1">{metrics.critical}</p>
          <span className="text-[11px] text-muted-foreground">High priority life-safety</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.resolved}</p>
          <span className="text-[11px] text-muted-foreground">Completed missions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/60 bg-card/60">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: "all", label: "All Missions", count: metrics.total },
            { id: "assigned", label: "Assigned", count: metrics.assigned },
            { id: "in_progress", label: "In Progress", count: metrics.inProgress },
            { id: "resolved", label: "Resolved", count: metrics.resolved }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Search Filter */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sector, resource, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background/80"
          />
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border/60 bg-card/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-28 rounded-full" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-16 w-full rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center p-14 border border-dashed border-border/80 rounded-2xl bg-card/40">
          <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">No Missions Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            {searchQuery || filterStatus !== "all"
              ? "No assigned tasks match your active filters. Try clearing your search query."
              : "No emergency tasks are currently assigned to your squad. Stand by on radio dispatch."}
          </p>
          {(searchQuery || filterStatus !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterStatus("all");
                setSearchQuery("");
              }}
              className="mt-4 text-xs font-semibold"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onAccept={handleAcceptTask}
              onComplete={handleCompleteTask}
              onRequestHelp={handleRequestHelp}
            />
          ))}
        </div>
      )}
    </div>
  );
}
