"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: AuditLog.tsx (AI Agent Audit Log & Manual Authority Override)
 * ==============================================================================
 * 
 * Features:
 * 1. Scrolling log panel fetching from 'audit_logs' table in Supabase.
 * 2. Supabase Realtime: Subscribes to 'INSERT' events on audit_logs so when
 *    Backend AI agents execute, entries appear dynamically.
 * 3. Shows entries: "AI Agent allocated 50 Tents to Zone A", confidence score, etc.
 * 4. Manual Override: Authority commanders can click "Approve" or "Reject"
 *    to override or confirm AI agent resource allocations.
 */

import React, { useState, useEffect } from "react";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { subscribeToAuditLogs } from "@/lib/realtimeSubscriptions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  RefreshCw,
  Cpu
} from "lucide-react";

export interface AuditLogEntry {
  id: string;
  action: string;
  category?: "ALLOCATION" | "TRIAGE" | "REROUTE" | "EVACUATION" | string;
  agent_name: "Sentinel Agent" | "Strategist Agent" | "Authority" | string;
  details?: string;
  details_json?: Record<string, any>;
  confidence_score?: number;
  status?: "pending_review" | "approved" | "rejected" | "overridden" | string;
  timestamp: string;
  affected_zone?: string;
  target_id?: string;
}

// Initial realistic AI audit log records correlating with the backend contract
const DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    action: "Strategist Agent allocated Resource res-01 to Incident inc-01",
    category: "ALLOCATION",
    agent_name: "Strategist Agent",
    details: "Allocated 500 units of drinking water to Zone A - North Harbor.",
    details_json: {
      event: "RESOURCE_ALLOCATION",
      resource_type: "water",
      quantity: 500,
      zone: "Zone A - North Harbor"
    },
    confidence_score: 98.4,
    status: "pending_review",
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    affected_zone: "Zone A - North Harbor"
  },
  {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e",
    action: "Sentinel Agent classified Marina Surge as Priority 8 Critical",
    category: "TRIAGE",
    agent_name: "Sentinel Agent",
    details: "Water level sensor telemetry breached 2.1m. Rerouted Alpha Rescue Team with specialized aquatic gear.",
    details_json: {
      event: "SEVERITY_ASSESSMENT",
      severity_score: 8,
      needed_resources: ["boats", "water"]
    },
    confidence_score: 99.2,
    status: "approved",
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    affected_zone: "Zone B - Marina Waterfront"
  },
  {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6f",
    action: "Authority approved 120 Trauma Packs dispatch to Central Metro Corridor",
    category: "ALLOCATION",
    agent_name: "Authority",
    details: "Commander ratified emergency burn trauma packs for hospital perimeter.",
    details_json: {
      event: "MANUAL_APPROVAL",
      officer: "State Disaster Management Authority",
      status: "approved"
    },
    confidence_score: 100.0,
    status: "approved",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    affected_zone: "Zone C - Central Metro"
  }
];

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(false);

  // Fetch initial audit logs from /api/audit-log
  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const res = await fetch("/api/audit-log");
        if (res.ok) {
          const data = await res.json();
          if (data.logs && data.logs.length > 0) {
            setLogs(data.logs);
            setLoading(false);
            return;
          }
        }
        setLogs(DEMO_AUDIT_LOGS);
      } catch (err) {
        console.warn("Using demo audit logs fallback:", err);
        setLogs(DEMO_AUDIT_LOGS);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  // Supabase Realtime Subscription via lib/realtimeSubscriptions.ts
  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs((payload) => {
      const newRow = payload.new;
      const entry: AuditLogEntry = {
        id: newRow.id?.toString() || `aud-${Date.now()}`,
        action: newRow.action || "AI Agent allocated resources",
        category: newRow.category || "ALLOCATION",
        agent_name: newRow.agent_name || "Backend AI Agent",
        details: newRow.details || newRow.reasoning || "Automated optimization.",
        confidence_score: newRow.confidence_score || 95.5,
        status: newRow.status || "pending_review",
        timestamp: newRow.created_at || new Date().toISOString(),
        affected_zone: newRow.affected_zone || "Active Zone"
      };

      setLogs((prev) => [entry, ...prev]);
      toast.info(`🤖 AI Decision: ${entry.action}`, {
        description: entry.details,
        duration: 5000
      });
    });

    setRealtimeConnected(isConfigured);
    return () => {
      unsubscribe();
    };
  }, []);

  // Manual Authority Override: Approve
  const handleApprove = async (logId: string) => {
    try {
      const res = await fetch("/api/audit-log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: logId, status: "approved" })
      });

      setLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, status: "approved" } : l))
      );
      toast.success("AI Allocation Approved", {
        description: `Authority Commander verified mission #${logId.slice(-6)}.`
      });
    } catch (err) {
      console.error("Approve error:", err);
      toast.error("Failed to approve allocation");
    }
  };

  // Manual Authority Override: Reject
  const handleReject = async (logId: string) => {
    try {
      const res = await fetch("/api/audit-log", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: logId, status: "rejected" })
      });

      setLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, status: "rejected" } : l))
      );
      toast.error("AI Allocation Overridden / Rejected", {
        description: `Action cancelled by Authority Commander.`
      });
    } catch (err) {
      console.error("Reject error:", err);
      toast.error("Failed to reject allocation");
    }
  };

  // Filtered entries
  const filtered = logs.filter((item) => {
    if (filterCategory === "ALL") return true;
    return item.category === filterCategory;
  });

  return (
    <Card className="border border-[#222933] bg-[#181E26] text-[#F6F4EF] rounded-sm flex flex-col h-full font-ibm-sans shadow-none">
      <CardHeader className="p-4 border-b border-[#222933]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#8A99AD]" strokeWidth={1.75} />
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider font-mono text-[#F6F4EF]">
                AI AGENT AUDIT LOG TERMINAL
              </CardTitle>
              <CardDescription className="text-xs text-[#8A99AD]">
                Autonomous multi-agent trace with Commander governance.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase bg-[#12161C] border border-[#222933] text-[#3B6D11]">
              <span className="dot-safe" />
              LIVE STREAM
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-[#222933] overflow-x-auto">
          {["ALL", "ALLOCATION", "TRIAGE", "REROUTE", "EVACUATION"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors ${
                filterCategory === cat
                  ? "bg-[#F6F4EF] text-[#12161C] font-bold"
                  : "bg-[#12161C] text-[#8A99AD] hover:text-[#F6F4EF] border border-[#222933]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </CardHeader>

      {/* Scrolling Audit List */}
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[520px] divide-y divide-[#222933]">
        {loading ? (
          <div className="divide-y divide-[#222933]">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-2 bg-[#181E26]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-sm bg-[#222933]" />
                    <Skeleton className="h-4 w-52 bg-[#222933]" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-sm bg-[#222933]" />
                </div>
                <Skeleton className="h-3 w-full bg-[#222933]/60" />
                <div className="flex items-center gap-3 pt-1">
                  <Skeleton className="h-3 w-28 bg-[#222933]" />
                  <Skeleton className="h-3 w-20 bg-[#222933]" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-12 text-[#8A99AD] text-xs font-mono">
            No autonomous audit logs recorded for category {filterCategory}.
          </div>
        ) : (
          filtered.map((log) => {
            const isPending = log.status === "pending_review";
            const isApproved = log.status === "approved";
            const stripClass = isPending
              ? "border-l-4 border-l-[#854F0B]"
              : isApproved
              ? "border-l-4 border-l-[#3B6D11]"
              : "border-l-4 border-l-[#791F1F]";

            return (
              <div
                key={log.id}
                className={`p-4 transition-colors hover:bg-[#12161C]/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 bg-[#181E26] ${stripClass}`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#F6F4EF] flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-[#8A99AD]" strokeWidth={1.75} />
                      {log.action}
                    </span>

                    <span className="font-ibm-mono text-[10px] uppercase px-1.5 py-0.5 rounded-sm bg-[#12161C] text-[#8A99AD] border border-[#222933]">
                      {log.category}
                    </span>

                    {log.confidence_score && (
                      <span className="font-ibm-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-[#12161C] text-[#3B6D11] border border-[#222933]">
                        {log.confidence_score.toFixed(1)}% CONFIDENCE
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#8A99AD] leading-relaxed">
                    {log.details || (log.details_json ? JSON.stringify(log.details_json) : "Autonomous agent operation logged.")}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] font-ibm-mono text-[#8A99AD] pt-1">
                    <span>AGENT: <strong className="text-[#F6F4EF]">{log.agent_name}</strong></span>
                    {log.affected_zone && (
                      <>
                        <span>•</span>
                        <span>ZONE: <strong className="text-[#F6F4EF]">{log.affected_zone}</strong></span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" strokeWidth={1.75} />
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} UTC
                    </span>
                  </div>
                </div>

                {/* Status and Manual Authority Override Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0">
                  {isPending ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(log.id)}
                        className="h-7 text-[10px] px-2"
                        title="Reject AI Allocation"
                      >
                        Reject Allocation
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(log.id)}
                        className="h-7 text-[10px] px-2.5"
                        title="Approve AI Allocation"
                      >
                        Approve Allocation
                      </Button>
                    </div>
                  ) : isApproved ? (
                    <div className="inline-flex items-center gap-1 font-ibm-mono text-[10px] text-[#3B6D11] bg-[#12161C] border border-[#222933] px-2 py-0.5 rounded-sm">
                      <CheckCircle2 className="w-3 h-3" strokeWidth={1.75} />
                      <span>APPROVED</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 font-ibm-mono text-[10px] text-[#791F1F] bg-[#12161C] border border-[#222933] px-2 py-0.5 rounded-sm">
                      <XCircle className="w-3 h-3" strokeWidth={1.75} />
                      <span>OVERRIDDEN</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
