"use client";

import React from "react";
import { AlertTriangle, Radio } from "lucide-react";
import { useDisasterRelief } from "@/context/DisasterReliefContext";

export default function UrgentTicker() {
  const { incidents } = useDisasterRelief();
  const criticalCount = incidents.filter(i => i.severity === "CRITICAL").length;

  return (
    <div className="w-full bg-red-950/70 border-b border-red-900/50 py-1.5 px-4 flex items-center justify-between text-xs text-red-200">
      <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
        <span className="font-mono font-bold text-red-400 shrink-0">DISPATCH ADVISORY:</span>
        <span className="truncate">
          Monsoon surge active in Sector 4 &bull; {criticalCount} critical incidents requiring immediate agentic resource routing &bull; Airspace restricted below 500ft for emergency drones.
        </span>
      </div>
      <div className="hidden md:flex items-center gap-2 shrink-0 font-mono text-[11px] text-red-300">
        <Radio className="h-3 w-3" />
        <span>Telemetry Stream: 100% Online</span>
      </div>
    </div>
  );
}
