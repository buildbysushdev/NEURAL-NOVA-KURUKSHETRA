"use client";

import React, { useState } from "react";
import {
  Send,
  Radio,
  Wifi,
  WifiOff,
  Cpu,
  ShieldAlert,
  Flame,
  Users,
  Building2,
  HardDrive,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Info
} from "lucide-react";
import { EmergencyPacket, NetworkHealth } from "@/lib/resq/types";
import { parseEmergencyTextDeterministic } from "@/lib/resq/local-ai-engine";

interface CitizenEmergencyViewProps {
  network: NetworkHealth;
  latestPacket?: EmergencyPacket;
  lastRoute?: {
    transport: string;
    status_text: string;
    path_diagram: string[];
    delivered: boolean;
    packet_id: string;
  } | null;
  onSubmitSos: (text: string) => void;
  loading: boolean;
}

export function CitizenEmergencyView({
  network,
  latestPacket,
  lastRoute,
  onSubmitSos,
  loading,
}: CitizenEmergencyViewProps) {
  const [inputText, setInputText] = useState(
    "I am trapped on the third floor of Building B17. There is heavy smoke and two people are injured. We cannot safely exit."
  );

  const [extractedPreview, setExtractedPreview] = useState(() =>
    parseEmergencyTextDeterministic(inputText, !network.internet)
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);
    setExtractedPreview(parseEmergencyTextDeterministic(val, !network.internet));
  };

  const handlePresetClick = (presetText: string) => {
    setInputText(presetText);
    setExtractedPreview(parseEmergencyTextDeterministic(presetText, !network.internet));
  };

  const isOnline = network.cellular && network.internet;

  return (
    <div className="space-y-6">
      {/* 1. Citizen Status & Emergency Question */}
      <div className="rounded-3xl border border-red-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/30 font-bold text-xl animate-pulse">
              🚨
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">
                RESQNET CITIZEN EMERGENCY INTERFACE
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Are you safe?
              </h2>
            </div>
          </div>

          {/* AI Mode Badge */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 ${
              isOnline
                ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20"
            }`}>
              <Cpu className="h-3.5 w-3.5" />
              <span>
                {isOnline
                  ? "ONLINE AI: CLOUD GATEWAY ACTIVE"
                  : "ONLINE AI: UNAVAILABLE | LOCAL EMERGENCY AI: ACTIVE"}
              </span>
            </div>
          </div>
        </div>

        {/* Input box */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-slate-300 block">
            Describe your emergency or speak naturally (Hindi / Hinglish / English supported):
          </label>
          <textarea
            value={inputText}
            onChange={handleTextChange}
            rows={3}
            className="w-full rounded-2xl border border-white/15 bg-slate-900/90 p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-sans"
            placeholder="Type emergency location, trapped count, and injuries..."
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Demo Presets:</span>
              <button
                type="button"
                onClick={() =>
                  handlePresetClick(
                    "I am trapped on the third floor of Building B17. There is heavy smoke and two people are injured. We cannot safely exit."
                  )
                }
                className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 text-[11px] text-slate-300"
              >
                Building B17 Fire (Floor 3, 2 Injured)
              </button>
              <button
                type="button"
                onClick={() =>
                  handlePresetClick(
                    "Flood water has risen rapidly in Zone C. 8 civilians require evacuation, including 2 children."
                  )
                }
                className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 text-[11px] text-slate-300"
              >
                Zone C Flood (8 Civilians, 2 Kids)
              </button>
            </div>

            {/* Submit SOS Button */}
            <button
              onClick={() => onSubmitSos(inputText)}
              disabled={loading || !inputText.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition disabled:opacity-50"
            >
              <Send className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>SEND SOS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Structured AI Extraction Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold tracking-tight">
                AI Incident Extraction Card
              </h3>
            </div>
            <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-400 border border-red-500/30">
              SEVERITY: {extractedPreview.priority.replace("P0_", "")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Incident Type</span>
              <span className="font-bold text-amber-400">{extractedPreview.incident_type.replace("_", " ")}</span>
            </div>

            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Location &amp; Floor</span>
              <span className="font-bold text-slate-200">
                {extractedPreview.location.name} {extractedPreview.location.floor ? `(Floor ${extractedPreview.location.floor})` : ""}
              </span>
            </div>

            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">People Trapped</span>
              <span className="font-bold text-slate-200">{extractedPreview.people} civilians</span>
            </div>

            <div className="rounded-xl bg-white/5 p-3 border border-white/5">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Injured Count</span>
              <span className="font-bold text-red-400">{extractedPreview.injured} casualties</span>
            </div>
          </div>

          {extractedPreview.hazards.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Identified Hazards</span>
              <div className="flex flex-wrap gap-1.5">
                {extractedPreview.hazards.map((h) => (
                  <span key={h} className="rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium">
                    ⚠️ {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Resources Required</span>
            <div className="flex flex-wrap gap-1.5">
              {extractedPreview.resources_required.map((r) => (
                <span key={r} className="rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 text-[11px] font-medium">
                  🚒 {r}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] font-mono text-slate-400">
            <span>Compression: 10 MB audio ➔ {extractedPreview.size_bytes} Bytes</span>
            <span className="text-emerald-400">LoRa MTU Safe (&lt; 256 B)</span>
          </div>
        </div>

        {/* 3. Communication Status & Dynamic Packet Path */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 text-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold tracking-tight">
                Live Communication Path &amp; Status
              </h3>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold border ${
              lastRoute?.delivered
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse"
            }`}>
              {lastRoute?.status || (isOnline ? "DELIVERED" : "STORED_LOCALLY")}
            </span>
          </div>

          {/* Delivery Status Message */}
          <div className={`rounded-xl p-3.5 border text-xs leading-relaxed ${
            lastRoute?.delivered
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : "bg-amber-500/10 border-amber-500/30 text-amber-200"
          }`}>
            <p className="font-semibold">{lastRoute?.status_text || "Network status active."}</p>
            {!isOnline && !network.p2p_mesh && !network.lora_gateway && (
              <p className="text-[11px] mt-1 text-amber-300/80 font-mono">
                Store-and-forward active: Packet ID {lastRoute?.packet_id || "SOS-001"} buffered safely in non-volatile storage.
              </p>
            )}
          </div>

          {/* Dynamic Hop Path Visualization */}
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">
              COMMUNICATION ROUTE HOPS:
            </span>
            <div className="space-y-2">
              {(lastRoute?.path_diagram || ["CITIZEN", "CELLULAR", "INTERNET", "RESCUE COMMAND"]).map(
                (hop, idx, arr) => (
                  <div key={hop} className="flex items-center gap-2 text-xs">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] font-bold text-slate-300">
                      {idx + 1}
                    </span>
                    <span className={`font-mono font-semibold px-2 py-1 rounded border ${
                      idx === arr.length - 1
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                        : "bg-white/5 border-white/10 text-slate-200"
                    }`}>
                      {hop}
                    </span>
                    {idx < arr.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* External Hardware Disclosure */}
          <div className="rounded-xl bg-white/5 p-3 border border-white/10 flex items-start gap-2 text-[11px] text-slate-400">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-200">Architecture Integrity:</strong> Standard smartphones use Cellular &amp; BLE/Wi-Fi mesh. LoRa and Satellite hops are serviced via external vehicle or field gateway nodes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
