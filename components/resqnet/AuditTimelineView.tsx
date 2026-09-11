"use client";

import React from "react";
import { Clock, ShieldCheck, FileText, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { AuditEvent } from "@/lib/resq/types";

interface AuditTimelineViewProps {
  events: AuditEvent[];
}

export function AuditTimelineView({ events }: AuditTimelineViewProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 text-slate-100 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold">
            Tamper-Evident System Audit Timeline (Ledger)
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <ShieldCheck className="h-3 w-3" />
          <span>CRYPTOGRAPHIC HASH LOGS</span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="flex items-start gap-3 rounded-xl bg-white/5 p-3 text-xs border border-white/5 hover:border-white/15 transition font-mono"
          >
            <span className="shrink-0 font-bold text-amber-400 bg-black/40 px-2 py-0.5 rounded border border-white/10">
              {evt.time_display}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-200">
                  {evt.event_type.replace(/_/g, " ")}
                </span>
                <span className="text-[9px] bg-white/10 text-slate-400 px-1.5 py-0.2 rounded">
                  {evt.actor}
                </span>
                {evt.packet_id && (
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded">
                    {evt.packet_id}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px] leading-snug">{evt.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
