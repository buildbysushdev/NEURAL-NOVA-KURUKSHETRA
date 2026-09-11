"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: TaskCard.tsx (Rescue Team Mission & Action Card)
 * ==============================================================================
 * 
 * Features:
 * 1. Displays Incident Triage Card: Location, Coordinates, Severity Badge, Status.
 * 2. Required Resources pill tags (e.g. Inflatable Boats, Trauma Kit, Ropes).
 * 3. Primary Actions:
 *    - "Accept Task": Shifts status to 'in_progress'.
 *    - "Mark Complete": Updates status to 'resolved' in Supabase.
 *    - "Request Help": Sends emergency assistance/reinforcement beacon.
 *    - "Navigate": Opens external turn-by-turn navigation via Google Maps.
 * 4. Urgent visual styling (Critical/High severity pulses, dark mode glassmorphism).
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Package,
  ShieldAlert,
  Loader2,
  ExternalLink,
  Flame,
  LifeBuoy
} from "lucide-react";

export interface RescueTask {
  id: string;
  type: string;
  description: string;
  latitude?: number;
  longitude?: number;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  zone?: string;
  severity?: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | string;
  severity_score?: number; // 0 to 10 scale from backend
  status: "open" | "assigned" | "in_progress" | "resolved" | "help_requested" | string;
  required_resources?: string[];
  needed_resources?: string[];
  assigned_to?: string;
  created_at?: string;
  victim_count?: number;
}

interface TaskCardProps {
  task: RescueTask;
  onAccept?: (taskId: string) => Promise<void> | void;
  onComplete?: (taskId: string) => Promise<void> | void;
  onRequestHelp?: (taskId: string) => Promise<void> | void;
}

export default function TaskCard({
  task,
  onAccept,
  onComplete,
  onRequestHelp
}: TaskCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Derive severity tier from score or string
  const severityTier = task.severity_score !== undefined
    ? task.severity_score >= 8 ? "CRITICAL" : task.severity_score >= 6 ? "HIGH" : task.severity_score >= 4 ? "MODERATE" : "LOW"
    : (task.severity || "HIGH").toUpperCase();

  // Severity color mappings & badges
  const severityConfig = {
    CRITICAL: {
      bg: "bg-red-500/15 text-red-400 border-red-500/40",
      dot: "bg-red-500 animate-ping",
      cardBorder: "border-red-500/40 hover:border-red-500/70"
    },
    HIGH: {
      bg: "bg-orange-500/15 text-orange-400 border-orange-500/40",
      dot: "bg-orange-500",
      cardBorder: "border-orange-500/40 hover:border-orange-500/70"
    },
    MODERATE: {
      bg: "bg-amber-500/15 text-amber-400 border-amber-500/40",
      dot: "bg-amber-500",
      cardBorder: "border-amber-500/30 hover:border-amber-500/60"
    },
    LOW: {
      bg: "bg-blue-500/15 text-blue-400 border-blue-500/40",
      dot: "bg-blue-500",
      cardBorder: "border-blue-500/30 hover:border-blue-500/60"
    }
  }[severityTier as "CRITICAL" | "HIGH" | "MODERATE" | "LOW"] || {
    bg: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    dot: "bg-slate-500",
    cardBorder: "border-border"
  };

  // Status badge config
  const statusConfig = {
    open: {
      label: "Open • Immediate Dispatch",
      className: "bg-blue-950/60 text-blue-400 border-blue-800/60"
    },
    assigned: {
      label: "Assigned to You",
      className: "bg-blue-950/60 text-blue-400 border-blue-800/60"
    },
    in_progress: {
      label: "Mission In Progress",
      className: "bg-amber-950/60 text-amber-300 border-amber-700/60 animate-pulse"
    },
    resolved: {
      label: "Mission Resolved",
      className: "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
    },
    help_requested: {
      label: "Backup Requested",
      className: "bg-red-950/80 text-red-300 border-red-700/80 animate-pulse font-bold"
    }
  }[task.status] || {
    label: task.status.toUpperCase(),
    className: "bg-slate-900 text-slate-300 border-slate-700"
  };

  // Coordinates from backend contract
  const taskLat = task.location_lat ?? task.latitude ?? 13.0827;
  const taskLng = task.location_lng ?? task.longitude ?? 80.2707;
  const displayResources = task.needed_resources || task.required_resources || ["Standard Rescue Gear"];

  // Handler wrappers with loading indicator
  const handleAction = async (actionName: string, actionFn?: (id: string) => Promise<void> | void) => {
    if (!actionFn) return;
    try {
      setLoadingAction(actionName);
      await actionFn(task.id);
    } catch (err) {
      console.error(`Error performing ${actionName}:`, err);
    } finally {
      setLoadingAction(null);
    }
  };

  // Direct Google Maps Direction URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${taskLat},${taskLng}`;

  return (
    <Card
      className={`group relative overflow-hidden bg-card/85 backdrop-blur-md transition-all duration-300 shadow-md hover:shadow-xl ${severityConfig.cardBorder} ${
        task.status === "resolved" ? "opacity-75" : ""
      }`}
    >
      {/* Top Severity Indicator Banner */}
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-2.5 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${severityConfig.dot}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${severityConfig.dot}`} />
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${severityConfig.bg}`}>
            {task.severity_score !== undefined ? `SCORE: ${task.severity_score}/10` : `${severityTier} PRIORITY`}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
          <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            {task.type}
          </span>
        </div>

        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </div>

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground leading-snug flex items-center gap-2">
              {task.zone || task.location_name || `Sector ${taskLat.toFixed(3)}, ${taskLng.toFixed(3)}`}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span>GPS: {taskLat.toFixed(4)}, {taskLng.toFixed(4)}</span>
              {task.created_at && (
                <>
                  <span className="text-border">•</span>
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span>{new Date(task.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </>
              )}
            </CardDescription>
          </div>

          {task.victim_count && task.victim_count > 0 && (
            <div className="text-right shrink-0 bg-red-950/40 border border-red-800/40 rounded-lg px-2.5 py-1">
              <span className="text-[10px] uppercase font-bold text-red-400 block tracking-wider">Victims</span>
              <span className="text-sm font-black text-red-200">~{task.victim_count} Persons</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm pb-4">
        {/* Incident Situation Description */}
        <p className="text-foreground/90 text-xs sm:text-sm leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/40">
          {task.description}
        </p>

        {/* Required Resources Section */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 mb-2">
            <Package className="w-3.5 h-3.5 text-blue-400" />
            <span>Needed Rescue Resources:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {displayResources && displayResources.length > 0 ? (
              displayResources.map((resource, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-secondary/80 text-secondary-foreground border border-border px-2 py-0.5 rounded-md capitalize"
                >
                  <LifeBuoy className="w-3 h-3 text-cyan-400" />
                  {resource}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">Standard Field Kit</span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-border/40 bg-muted/10">
        {/* Navigation Action */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs font-medium border-border/70 hover:bg-muted hover:text-foreground gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>Navigate</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground ml-0.5" />
          </Button>
        </a>

        {/* Dynamic Action Buttons depending on status */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {task.status === "assigned" && (
            <Button
              size="sm"
              onClick={() => handleAction("accept", onAccept)}
              disabled={loadingAction !== null}
              className="flex-1 sm:flex-none text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {loadingAction === "accept" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Radio className="w-3.5 h-3.5 mr-1.5" />
              )}
              Accept Task
            </Button>
          )}

          {task.status !== "resolved" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("help", onRequestHelp)}
              disabled={loadingAction !== null || task.status === "help_requested"}
              className={`text-xs font-medium border-red-500/40 text-red-400 hover:bg-red-950/30 hover:text-red-300 ${
                task.status === "help_requested" ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loadingAction === "help" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-red-500" />
              )}
              {task.status === "help_requested" ? "Backup Called" : "Request Help"}
            </Button>
          )}

          {task.status !== "resolved" ? (
            <Button
              size="sm"
              onClick={() => handleAction("complete", onComplete)}
              disabled={loadingAction !== null}
              className="flex-1 sm:flex-none text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {loadingAction === "complete" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              Mark Complete
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/40 border border-emerald-800/50 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolved</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
