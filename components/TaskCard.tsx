"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: TaskCard.tsx (Rescue Team Mission & Action Card)
 * ==============================================================================
 * 
 * Strict Institutional Design System:
 * - Base: #12161C, Card: #181E26, Border: #222933, Text: #F6F4EF
 * - Severity Left-Border Strips: #791F1F (Critical), #854F0B (Watch), #3B6D11 (Safe)
 * - Typography: IBM Plex Sans & IBM Plex Mono for metrics/coordinates
 * - Verb-driven button phrases ("Accept Field Mission", "Mark Mission Resolved", "Navigate to Sector")
 */

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Boxes,
  Loader2,
  ExternalLink,
  ShieldAlert
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
  severity_score?: number;
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
  onRequestHelp,
}: TaskCardProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const score = task.severity_score !== undefined ? Number(task.severity_score) : 7;
  const isCritical = score >= 8 || task.severity === "CRITICAL";
  const isWatch = (score >= 5 && score < 8) || task.severity === "HIGH" || task.severity === "MODERATE";

  const severityStripClass = isCritical
    ? "border-l-4 border-l-[#791F1F]"
    : isWatch
    ? "border-l-4 border-l-[#854F0B]"
    : "border-l-4 border-l-[#3B6D11]";

  const dotClass = isCritical
    ? "dot-critical"
    : isWatch
    ? "dot-watch"
    : "dot-safe";

  const lat = task.latitude ?? task.location_lat ?? 13.0827;
  const lng = task.longitude ?? task.location_lng ?? 80.2707;

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAction = async (actionType: "accept" | "complete" | "help") => {
    setLoadingAction(actionType);
    try {
      if (actionType === "accept" && onAccept) await onAccept(task.id);
      if (actionType === "complete" && onComplete) await onComplete(task.id);
      if (actionType === "help" && onRequestHelp) await onRequestHelp(task.id);
    } finally {
      setLoadingAction(null);
    }
  };

  const isResolved = task.status === "resolved";
  const isInProgress = task.status === "in_progress";

  const resources = task.required_resources || task.needed_resources || [];

  return (
    <Card className={`border border-[#222933] bg-[#181E26] ${severityStripClass} rounded-sm p-4 text-[#F6F4EF]`}>
      {/* Header: Title & Severity Score */}
      <div className="flex items-start justify-between gap-3 pb-2 border-b border-[#222933]">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={dotClass} />
            <span className="font-ibm-mono text-[10px] uppercase tracking-wider text-[#8A99AD]">
              {task.zone || "SECTOR OPERATION"}
            </span>
            <span className="text-[#8A99AD] text-xs">•</span>
            <span className="font-ibm-mono text-[10px] text-[#8A99AD]">
              ID: {task.id.slice(0, 8)}
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#F6F4EF] capitalize">
            {task.type.replace(/_/g, " ")}
          </h3>
        </div>

        <div className="flex flex-col items-end flex-shrink-0">
          <span className="font-ibm-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-[#12161C] border border-[#222933]">
            SEV {score}/10
          </span>
          <span className="font-ibm-mono text-[9px] uppercase tracking-wider text-[#8A99AD] mt-1">
            {isResolved ? "MISSION RESOLVED" : isInProgress ? "EN ROUTE" : "DISPATCH READY"}
          </span>
        </div>
      </div>

      {/* Description & Location */}
      <div className="py-3 space-y-2 text-xs">
        <p className="text-[#8A99AD] leading-relaxed">
          {task.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-[#F6F4EF]">
          <MapPin className="w-3.5 h-3.5 text-[#8A99AD] flex-shrink-0" strokeWidth={1.75} />
          <span className="truncate">{task.location_name || "Assigned Sector Grid"}</span>
          <span className="font-ibm-mono text-[10px] text-[#8A99AD] ml-auto">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>

        {/* Resource Badges */}
        {resources.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <Boxes className="w-3 h-3 text-[#8A99AD]" strokeWidth={1.75} />
            <span className="text-[10px] font-mono text-[#8A99AD] uppercase mr-1">Required:</span>
            {resources.map((res) => (
              <span
                key={res}
                className="font-ibm-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm bg-[#12161C] border border-[#222933] text-[#F6F4EF]"
              >
                {res}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Actions with Verb Phrases */}
      <div className="pt-3 border-t border-[#222933] flex items-center justify-between gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleOpenGoogleMaps}
          className="h-8 text-xs"
        >
          <Navigation className="w-3 h-3 mr-1" strokeWidth={1.75} />
          Navigate to Sector
        </Button>

        <div className="flex items-center gap-2 ml-auto">
          {!isResolved && !isInProgress && (
            <Button
              variant="primary"
              size="sm"
              disabled={loadingAction === "accept"}
              onClick={() => handleAction("accept")}
              className="h-8 text-xs"
            >
              {loadingAction === "accept" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Accept Field Mission"
              )}
            </Button>
          )}

          {isInProgress && (
            <Button
              variant="primary"
              size="sm"
              disabled={loadingAction === "complete"}
              onClick={() => handleAction("complete")}
              className="h-8 text-xs bg-[#3B6D11] text-white hover:bg-[#498616]"
            >
              {loadingAction === "complete" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
                  Mark Mission Resolved
                </span>
              )}
            </Button>
          )}

          {isResolved && (
            <span className="font-ibm-mono text-xs text-[#3B6D11] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              RESOLVED
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
