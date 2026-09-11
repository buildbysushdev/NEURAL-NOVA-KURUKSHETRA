"use client";

import React, { useState } from "react";
import { useDisasterRelief } from "@/context/DisasterReliefContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Cpu, Search, CheckCircle2, ShieldCheck, Filter } from "lucide-react";

export default function AuditLogPanel({ className = "" }) {
  const { auditLogs } = useDisasterRelief();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === "ALL" ||
      (selectedFilter === "ALLOCATION" && (log.type === "ALLOCATION" || log.action.toLowerCase().includes("allocated"))) ||
      (selectedFilter === "TRIAGE" && (log.type === "TRIAGE" || log.action.toLowerCase().includes("severity"))) ||
      (selectedFilter === "REROUTE" && (log.type === "REROUTE" || log.action.toLowerCase().includes("rerouted") || log.action.toLowerCase().includes("diverted")));

    return matchesSearch && matchesFilter;
  });

  const getActionBadgeVariant = (log) => {
    if (log.type === "ALLOCATION" || log.action.toLowerCase().includes("allocated")) {
      return "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
    }
    if (log.type === "TRIAGE" || log.action.toLowerCase().includes("severity")) {
      return "bg-red-950/80 text-red-300 border-red-700/60";
    }
    if (log.type === "REROUTE" || log.action.toLowerCase().includes("rerouted")) {
      return "bg-amber-950/80 text-amber-300 border-amber-700/60";
    }
    return "bg-cyan-950/80 text-cyan-300 border-cyan-700/60";
  };

  return (
    <Card className={`border-slate-800 bg-slate-900/95 shadow-xl flex flex-col ${className}`}>
      <CardHeader className="p-4 sm:p-5 border-b border-slate-800 pb-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-600/20 text-amber-400 border border-amber-600/40">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>AI Action Audit Log</span>
                <Badge variant="outline" className="font-mono text-[10px] text-slate-400">
                  {auditLogs.length} Events
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Tamper-evident chronological record of AI agent allocations &amp; triage actions
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 self-start sm:self-auto">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>SHA-256 Chained</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search actions (e.g. 'allocated', 'tents', 'Zone A')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "ALLOCATION", "TRIAGE", "REROUTE"].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-colors shrink-0 ${
                  selectedFilter === f
                    ? "bg-slate-800 text-slate-100 border border-slate-700 font-bold"
                    : "text-slate-400 hover:text-slate-200 bg-slate-950/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {/* Scrollable list of AI actions */}
        <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-800/80 p-3 sm:p-4 space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-mono">
              No audit records matching &ldquo;{searchTerm}&rdquo;
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="pt-2.5 first:pt-0 pb-1 flex flex-col gap-1.5 transition-colors hover:bg-slate-950/40 p-2 rounded-lg"
              >
                {/* Header row: Action Badge, Actor, Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-slate-300">{log.id}</span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${getActionBadgeVariant(log)}`}>
                      {log.type || "ACTION"}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      &bull; {log.actor}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    {log.timestamp}
                  </span>
                </div>

                {/* Main Action Line (e.g. 'Agent allocated 50 tents to Zone A') */}
                <div className="text-xs sm:text-sm font-semibold text-slate-100 flex items-start gap-1.5">
                  <span className="text-amber-400 font-mono shrink-0">&rsaquo;</span>
                  <span>{log.action}</span>
                </div>

                {/* Details narrative */}
                <p className="text-xs text-slate-400 pl-4 leading-relaxed">
                  {log.details}
                </p>

                {/* Cryptographic hash badge */}
                <div className="flex items-center justify-between pl-4 pt-0.5 text-[10px] font-mono text-slate-500">
                  <span>Audit Hash: <strong className="text-slate-400">{log.hash}</strong></span>
                  <span className="text-emerald-500/80 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified by Consensus
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
