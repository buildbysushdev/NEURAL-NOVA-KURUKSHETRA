"use client";

import React from "react";
import {
  Wifi,
  WifiOff,
  Radio,
  RadioTower,
  Globe,
  HardDrive,
  Activity,
  ArrowRight,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertOctagon
} from "lucide-react";
import { NetworkHealth, TransportState } from "@/lib/resq/types";

interface CommNetworkMonitorProps {
  network: NetworkHealth;
  transports: TransportState[];
}

export function CommNetworkMonitor({ network, transports }: CommNetworkMonitorProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 text-slate-100 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold tracking-tight">
              Adaptive Communication Network Monitor
            </h3>
            <p className="text-[11px] text-slate-400">
              Live multi-transport topology and packet routing diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">ACTIVE TRANSPORT:</span>
          <span className="rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 font-bold">
            {network.active_transport}
          </span>
        </div>
      </div>

      {/* 5-Node Transport Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {transports.map((t) => (
          <div
            key={t.type}
            className={`rounded-xl border p-3.5 space-y-2.5 transition ${
              t.is_available
                ? "border-emerald-500/30 bg-emerald-950/20 shadow-sm shadow-emerald-500/10"
                : "border-white/10 bg-slate-950/60 opacity-70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase">{t.type}</span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  t.is_available
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {t.status_text}
              </span>
            </div>

            <div className="text-xs font-bold text-slate-200">{t.label}</div>

            <div className="text-[10px] font-mono text-slate-400 space-y-1 pt-1 border-t border-white/5">
              <div>Bandwidth: {t.bandwidth}</div>
              <div>Range: {t.typical_range}</div>
            </div>

            {t.is_external_hardware && (
              <div className="text-[9px] font-mono text-amber-400/90 pt-1">
                ⚠️ External hardware node required
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active Route Packet Flow Diagram */}
      <div className="rounded-xl border border-cyan-500/30 bg-black/40 p-4 space-y-3">
        <span className="text-[10px] font-mono uppercase text-slate-400 block">
          DYNAMIC ACTIVE TRANSMISSION FLOW:
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 font-mono font-semibold">
            📱 Citizen Device
          </div>
          <ArrowRight className="h-4 w-4 text-cyan-400 shrink-0" />
          <div className="rounded-lg bg-white/10 border border-white/15 px-3 py-1.5 font-mono font-semibold">
            📦 Local Emergency Packet (84 B)
          </div>
          <ArrowRight className="h-4 w-4 text-cyan-400 shrink-0" />
          <div className={`rounded-lg px-3 py-1.5 font-mono font-bold border ${
            network.cellular
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : network.p2p_mesh
              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
              : network.lora_gateway
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-purple-500/20 text-purple-300 border-purple-500/40"
          }`}>
            {network.cellular
              ? "Cellular / Telecom Tower"
              : network.p2p_mesh
              ? "Peer-to-Peer Mesh Relay"
              : network.lora_gateway
              ? "External LoRa Gateway #04 (868 MHz)"
              : "Store & Forward Local Storage"}
          </div>
          <ArrowRight className="h-4 w-4 text-cyan-400 shrink-0" />
          <div className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 font-mono font-bold">
            🚁 Rescue Command Console
          </div>
        </div>
      </div>

      {/* Engineering Disclosure Footer */}
      <div className="rounded-xl bg-white/5 p-3 text-[11px] text-slate-400 border border-white/10 flex items-start gap-2">
        <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">Hardware Reality Check:</strong> Standard mobile devices do not have internal LoRa silicon or direct satellite antennas. RESQNET treats LoRa and Satellite as external hardware adapters bridged via local Bluetooth/Wi-Fi or vehicle base nodes.
        </p>
      </div>
    </div>
  );
}
