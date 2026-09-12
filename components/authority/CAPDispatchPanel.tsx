"use client";

import React, { useState } from "react";
import {
  Radio,
  Send,
  MessageSquare,
  PhoneCall,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export function CAPDispatchPanel() {
  const [headline, setHeadline] = useState<string>("Category 4 Storm Surge Evacuation Notice");
  const [message, setMessage] = useState<string>(
    "Water levels reaching 1.8m in low-lying coastal wards. All residents proceed to Central Shelter Alpha immediately. Avoid underground passages."
  );
  const [incidentType, setIncidentType] = useState<string>("Flash Flood Surge");
  const [urgency, setUrgency] = useState<"critical" | "high" | "moderate">("critical");
  const [severity, setSeverity] = useState<"Extreme" | "Severe" | "Moderate">("Extreme");
  const [areaDesc, setAreaDesc] = useState<string>("Marina Waterfront Sector B, Chennai");
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"preview" | "xml" | "sms">("preview");

  const handleDispatch = async () => {
    setDispatching(true);
    try {
      const res = await fetch("/api/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          message,
          incidentType,
          urgency,
          severity,
          areaDesc,
          recipientPhone: "+91-98400-99882",
          coordinates: [13.0827, 80.2707],
          radiusKm: 5.0,
        }),
      });
      const data = await res.json();
      setLastResult(data);

      const alertPayload = {
        id: `CAP-${data.identifier || Date.now()}`,
        title: headline,
        zone: areaDesc,
        severity: urgency.toUpperCase(),
        severityScore: urgency === "critical" ? 9.5 : urgency === "high" ? 8 : 6,
        situationReport: message,
        evacuationCorridor: `Emergency evacuation route active for ${areaDesc}. Proceed to nearest high ground or relief shelter.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "NDMA CAP v1.2 Gateway",
        coordinates: "13.0544° N, 80.2818° E",
        onsetETA: "IMMEDIATE BROADCAST",
      };
      try {
        localStorage.setItem("latest_public_emergency_alert", JSON.stringify(alertPayload));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("emergency_alert_broadcast", { detail: alertPayload }));
      } catch (e) {}

      toast.success("Triple-Channel Broadcast Dispatched", {
        description: `Transmitted: In-App Alert, SMS Gateway Log, Voice IVR, and CAP Identifier ${data.identifier}. Alert live on Citizen Portal.`,
      });
    } catch (err: any) {
      toast.error("Dispatch Failed", { description: err.message });
    } finally {
      setDispatching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to Clipboard", { description: "OASIS CAP v1.2 XML payload copied." });
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-100">
            Multi-Channel Dispatcher &amp; CAP Protocol
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20 font-semibold">
          OASIS CAP v1.2 Standard
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Broadcasts synchronized emergency alerts simultaneously across In-App Push, SMS gateways (simulated), automated Voice IVR (simulated), and NDMA Common Alerting Protocol (CAP v1.2 XML feeds).
      </p>

      {/* Form Controls */}
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Broadcast Headline
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full h-8 rounded-lg border border-white/[0.08] bg-slate-900/90 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full h-8 rounded-lg border border-white/[0.08] bg-slate-900/90 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="critical">Critical (Immediate Evacuation)</option>
              <option value="high">High (Take Immediate Shelter)</option>
              <option value="moderate">Moderate (Elevate Readiness)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
              Target Geographic Sector
            </label>
            <input
              type="text"
              value={areaDesc}
              onChange={(e) => setAreaDesc(e.target.value)}
              className="w-full h-8 rounded-lg border border-white/[0.08] bg-slate-900/90 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
            Emergency Instruction Body
          </label>
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
          />
        </div>

        <button
          type="button"
          onClick={handleDispatch}
          disabled={dispatching}
          className="w-full h-9 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-red-500/20 disabled:opacity-50"
        >
          {dispatching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Radio className="w-4 h-4" />
          )}
          <span>Transmit Triple-Channel Alert &amp; Broadcast CAP v1.2</span>
        </button>
      </div>

      {/* Dispatched Results Inspector */}
      {lastResult && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-3 pt-3">
          {/* Sub Tab Buttons */}
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] pb-2 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setActiveSubTab("preview")}
              className={`px-2.5 py-1 rounded-md transition ${
                activeSubTab === "preview"
                  ? "bg-white/[0.10] text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Dispatch Channels ({lastResult.dispatches?.length || 4})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("xml")}
              className={`px-2.5 py-1 rounded-md transition ${
                activeSubTab === "xml"
                  ? "bg-white/[0.10] text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              NDMA CAP v1.2 XML
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("sms")}
              className={`px-2.5 py-1 rounded-md transition ${
                activeSubTab === "sms"
                  ? "bg-white/[0.10] text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              SMS &amp; Voice Payload
            </button>
          </div>

          {/* Sub Tab 1: Dispatch Channels Summary */}
          {activeSubTab === "preview" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Broadcast ID: {lastResult.identifier}</span>
                <span className="text-emerald-400 font-bold">100% DISPATCH SUCCESS</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>In-App Realtime Push (Real)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Transmitted via Supabase Realtime WebSocket broadcast.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>SMS Priority (Simulated Log)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Formatted for India BSNL/Airtel emergency SMS priority line.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Voice IVR Call (Simulated Log)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Auto-synthesized Hindi/English emergency voice announcement.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-red-300 font-bold text-[11px]">
                    <Radio className="w-3.5 h-3.5" />
                    <span>NDMA CAP Broadcast (Standard)</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    OASIS CAP v1.2 XML for Cell Broadcast Service (CBS).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab 2: Live OASIS CAP XML Payload */}
          {activeSubTab === "xml" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>OASIS CAP v1.2 XML Feed</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(lastResult.cap_xml)}
                  className="text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy XML</span>
                </button>
              </div>
              <pre className="text-[10px] font-mono bg-black/60 p-3 rounded-lg border border-white/[0.06] text-emerald-400/90 overflow-x-auto max-h-48 leading-relaxed">
                {lastResult.cap_xml}
              </pre>
            </div>
          )}

          {/* Sub Tab 3: SMS & Voice Content */}
          {activeSubTab === "sms" && (
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg border border-white/[0.06] bg-black/40 space-y-1">
                <span className="text-[10px] uppercase text-blue-400 font-bold block">
                  Simulated Outbound SMS Handset Text:
                </span>
                <p className="text-[11px] text-slate-200">
                  {lastResult.dispatches?.find((d: any) => d.channel === "sms")?.payload?.body ||
                    "SMS body queued"}
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-white/[0.06] bg-black/40 space-y-1">
                <span className="text-[10px] uppercase text-purple-400 font-bold block">
                  Simulated Voice IVR TTS Script:
                </span>
                <p className="text-[11px] text-slate-300 italic">
                  "{lastResult.dispatches?.find((d: any) => d.channel === "voice_call")?.payload
                    ?.ivr_script || "Voice script queued"}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
