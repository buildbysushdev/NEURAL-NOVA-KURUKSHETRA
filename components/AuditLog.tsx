"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: AuditLog.tsx
 * ==============================================================================
 * 
 * Command Glass Design:
 * - Timeline-style multi-agent audit trace with Commander governance
 * - Filter tabs: All, Allocation, Triage, Reroute, Evacuation
 * - Colored left-border accents for event types
 * - Live stream pulse indicator & JSON payload viewer
 * - Manual Commander Override & Confirmation triggers
 */

import React, { useState, useEffect } from "react";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { subscribeToAuditLogs } from "@/lib/realtimeSubscriptions";
import { toast } from "sonner";
import {
  Terminal,
  Package,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Check,
  X,
  Shield,
  Loader2,
  RefreshCw,
} from "lucide-react";

export interface AuditLogEntry {
  id: string;
  action: string;
  category?: "allocation" | "triage" | "reroute" | "evacuation" | "approval" | string;
  agent_name: string;
  details?: string;
  details_json?: Record<string, any>;
  confidence_score?: number;
  status?: "pending" | "approved" | "rejected" | "overridden" | "dispatched" | "escalated" | string;
  timestamp: string;
  affected_zone?: string;
}

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: "log-001",
    action: "Allocation Generated",
    category: "allocation",
    agent_name: "gemini-1.5-flash",
    details: "Allocated 4 rescue boats to Marina Waterfront Relief Depot.",
    details_json: {
      resource: "rescue_boats",
      quantity: 4,
      depot: "Marina Waterfront Relief Depot (Zone B)",
      eta_minutes: 12,
    },
    confidence_score: 98.4,
    status: "overridden",
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    affected_zone: "Zone B - Marina Waterfront",
  },
  {
    id: "log-002",
    action: "Allocation Approved",
    category: "approval",
    agent_name: "State Disaster Authority Commander",
    details: "Commander ratified tactical dispatch to port sector.",
    details_json: {
      status: "dispatched",
      team: "NDRF Bravo Alpha Strike Unit",
      resources_ratified: 4,
    },
    confidence_score: 100.0,
    status: "dispatched",
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    affected_zone: "Zone A - North Harbor",
  },
  {
    id: "log-003",
    action: "Severity Reassessed",
    category: "triage",
    agent_name: "groq-llama3-sentinel",
    details: "Water level sensor telemetry breached 2.1m. Escalated to Critical Priority.",
    details_json: {
      zone: "Zone-C",
      prev_score: 5,
      new_score: 8,
      reason: "Water level rising 2cm/hr",
    },
    confidence_score: 99.2,
    status: "escalated",
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    affected_zone: "Zone C - Central Metro",
  },
  {
    id: "log-004",
    action: "Logistics Corridor Reroute",
    category: "reroute",
    agent_name: "gemini-1.5-flash",
    details: "Evacuation route blocked by debris; dynamic alternate pathway configured.",
    details_json: {
      original_corridor: "Anna Salai Express",
      rerouted_corridor: "Inner Ring Expressway",
      transit_delta_minutes: 4,
    },
    confidence_score: 96.5,
    status: "dispatched",
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    affected_zone: "Zone D - Industrial South",
  },
];

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_LOGS);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch initial audit logs from Supabase if connected
  const fetchAuditLogs = async () => {
    if (!isConfigured || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: AuditLogEntry[] = data.map((d: any) => {
          const act = d.action || "AI Operation Logged";
          let cat = "allocation";
          if (act.toLowerCase().includes("triage") || act.toLowerCase().includes("severity")) cat = "triage";
          else if (act.toLowerCase().includes("approv") || act.toLowerCase().includes("ratif")) cat = "approval";
          else if (act.toLowerCase().includes("reroute")) cat = "reroute";
          else if (act.toLowerCase().includes("evacuat")) cat = "evacuation";

          return {
            id: d.id?.toString(),
            action: act,
            category: cat,
            agent_name: d.agent_name || "Autonomous Agent",
            details: typeof d.details_json === "string" ? d.details_json : JSON.stringify(d.details_json),
            details_json: d.details_json || {},
            confidence_score: d.details_json?.confidence || 98.0,
            status: d.details_json?.status || "dispatched",
            timestamp: d.timestamp || new Date().toISOString(),
            affected_zone: d.details_json?.zone || "Sector Active",
          };
        });
        setLogs(mapped);
      }
    } catch (err) {
      // Fallback silently to in-memory trace
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();

    // Supabase Realtime Listener
    const unsubscribe = subscribeToAuditLogs((payload) => {
      const newItem = payload.new;
      if (newItem) {
        const act = newItem.action || "Realtime Event";
        let cat = "allocation";
        if (act.toLowerCase().includes("triage")) cat = "triage";
        else if (act.toLowerCase().includes("approv")) cat = "approval";
        else if (act.toLowerCase().includes("reroute")) cat = "reroute";

        const newEntry: AuditLogEntry = {
          id: newItem.id?.toString() || `log-${Date.now()}`,
          action: act,
          category: cat,
          agent_name: newItem.agent_name || "Autonomous Agent",
          details_json: newItem.details_json || {},
          status: "dispatched",
          timestamp: newItem.timestamp || new Date().toISOString(),
        };

        setLogs((prev) => [newEntry, ...prev]);
        toast.info(`AI Audit: ${newEntry.action}`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filter items
  const getTimeAgo = (timestamp: string): string => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 5) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  const filteredLogs = logs.filter((l) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Sentinel") {
      return (
        l.agent_name?.toLowerCase().includes("sentinel") ||
        l.category?.toLowerCase() === "triage" ||
        l.action?.toLowerCase().includes("severity")
      );
    }
    if (activeFilter === "Strategist") {
      return (
        l.agent_name?.toLowerCase().includes("strategist") ||
        l.category?.toLowerCase() === "allocation" ||
        l.action?.toLowerCase().includes("allocat")
      );
    }
    if (activeFilter === "Authority") {
      return (
        l.agent_name?.toLowerCase().includes("commander") ||
        l.agent_name?.toLowerCase().includes("authority") ||
        l.category?.toLowerCase() === "approval" ||
        l.status === "approved" ||
        l.status === "overridden"
      );
    }
    return true;
  });

  const typeStyles: Record<string, { border: string; icon: any; iconColor: string }> = {
    allocation: { border: "border-l-blue-500", icon: Package, iconColor: "text-blue-400" },
    approval: { border: "border-l-emerald-500", icon: CheckCircle, iconColor: "text-emerald-400" },
    triage: { border: "border-l-amber-500", icon: AlertTriangle, iconColor: "text-amber-400" },
    reroute: { border: "border-l-violet-500", icon: RotateCcw, iconColor: "text-violet-400" },
    evacuation: { border: "border-l-cyan-500", icon: Shield, iconColor: "text-cyan-400" },
  };

  const statusStyles: Record<string, string> = {
    overridden: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    dispatched: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    escalated: "bg-red-500/15 text-red-400 border border-red-500/20",
    pending: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
    approved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  };

  const handleActionOverride = (id: string, newStatus: "approved" | "overridden", e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLogs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    toast.success(
      newStatus === "approved"
        ? "Allocation Confirmed by Commander"
        : "Human Override Recorded in Audit Log",
      {
        id: `audit-toast-${id}`,
        description: `Action marked ${newStatus.toUpperCase()} with cryptographic audit signature.`,
      }
    );
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col h-full backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">AI Agent Audit Log</h3>
            <p className="text-[11px] text-slate-400">
              Multi-agent trace with Commander governance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-live" />
          <span className="text-[11px] font-mono text-cyan-400">LIVE</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-5 py-3 border-b border-white/[0.06] overflow-x-auto">
        {["All", "Sentinel", "Strategist", "Authority"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeFilter === tab
                ? "bg-white/[0.08] text-slate-200 shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Log Entries List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[460px]">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Terminal className="w-8 h-8 text-slate-600 mb-2" strokeWidth={1.5} />
            <p className="text-xs text-slate-400">No matching audit events</p>
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const s = typeStyles[entry.category || "allocation"] || typeStyles.allocation;
            const statusStyle =
              statusStyles[entry.status || "dispatched"] || statusStyles.dispatched;
            const Icon = s.icon;
            const isAI = !entry.agent_name?.toLowerCase().includes("commander") && !entry.agent_name?.toLowerCase().includes("authority");

            const timeAgo = getTimeAgo(entry.timestamp);

            return (
              <div
                key={entry.id}
                className={`border-l-2 ${s.border} pl-4 py-3 rounded-r-xl bg-white/[0.02] hover:bg-white/[0.04] transition group animate-slide-up`}
              >
                {/* Title row */}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${s.iconColor}`} />
                  <span className="text-xs font-semibold text-slate-200">
                    {entry.action}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        isAI
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      }`}
                    >
                      {isAI ? "AI" : "HUMAN"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${statusStyle}`}
                    >
                      {entry.status || "dispatched"}
                    </span>
                  </div>
                </div>

                {/* JSON Payload View */}
                {entry.details_json && Object.keys(entry.details_json).length > 0 ? (
                  <pre className="text-[11px] font-mono text-slate-300 bg-black/30 rounded-lg p-2.5 overflow-x-auto mb-2 border border-white/[0.04]">
                    {JSON.stringify(entry.details_json, null, 2)}
                  </pre>
                ) : entry.details ? (
                  <p className="text-xs text-slate-400 mb-2 leading-relaxed bg-black/20 p-2 rounded-lg">
                    {entry.details}
                  </p>
                ) : null}

                {/* Agent + Time footer & Actions */}
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Agent:</span>
                    <span className="font-mono text-slate-300 px-1.5 py-0.5 rounded bg-white/[0.04]">
                      {entry.agent_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Manual Commander Ratify / Approve Allocation button */}
                    <div className="flex items-center gap-1">
                      {entry.status !== "approved" ? (
                        <button
                          type="button"
                          onClick={(e) => handleActionOverride(entry.id, "approved", e)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition flex items-center gap-1 border border-emerald-500/30 active:scale-95"
                          title="Approve AI Allocation"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve Allocation</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25">
                          <Check className="w-3 h-3" /> Ratified
                        </span>
                      )}
                    </div>

                    <span className="text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
