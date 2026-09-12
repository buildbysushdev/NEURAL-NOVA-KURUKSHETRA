"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, X, ShieldAlert, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActiveDisasterBannerProps {
  zoneName?: string;
  severityLevel?: "critical" | "watch" | "safe";
  severityScore?: number;
  advisoryText?: string;
}

export function ActiveDisasterBanner({
  zoneName = "Adyar Sector 4 Flood Inundation",
  severityLevel = "critical",
  severityScore = 9,
  advisoryText = "Water levels rising rapidly along river basin. Evacuate ground levels to Designated Relief Centers.",
}: ActiveDisasterBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [lastSeenScore, setLastSeenScore] = useState(severityScore);
  const [liveAlert, setLiveAlert] = useState<any>(null);

  useEffect(() => {
    const syncAlert = () => {
      try {
        const item = localStorage.getItem("latest_public_emergency_alert");
        if (item) {
          const parsed = JSON.parse(item);
          setLiveAlert(parsed);
          setDismissed(false);
        }
      } catch (e) {}
    };

    const handleCustom = (e: any) => {
      if (e.detail) {
        setLiveAlert(e.detail);
        setDismissed(false);
      }
    };

    syncAlert();
    window.addEventListener("storage", syncAlert);
    window.addEventListener("emergency_alert_broadcast", handleCustom);
    const timer = setInterval(syncAlert, 2000);
    return () => {
      window.removeEventListener("storage", syncAlert);
      window.removeEventListener("emergency_alert_broadcast", handleCustom);
      clearInterval(timer);
    };
  }, []);

  // If severity increases, banner reappears automatically
  useEffect(() => {
    if (severityScore > lastSeenScore) {
      setDismissed(false);
      setLastSeenScore(severityScore);
    }
  }, [severityScore, lastSeenScore]);

  if (dismissed) return null;

  const currentTitle = liveAlert?.title || zoneName;
  const currentAdvisory = liveAlert?.situationReport || advisoryText;
  const currentEvacuation = liveAlert?.evacuationCorridor;
  const currentLevel = liveAlert?.severity === "CRITICAL" ? "critical" : severityLevel;

  const borderClass =
    currentLevel === "critical"
      ? "border-l-[#791F1F]"
      : currentLevel === "watch"
      ? "border-l-[#854F0B]"
      : "border-l-[#3B6D11]";

  const dotClass =
    currentLevel === "critical"
      ? "bg-[#791F1F]"
      : currentLevel === "watch"
      ? "bg-[#854F0B]"
      : "bg-[#3B6D11]";

  return (
    <div
      role="alert"
      className={`w-full border border-[#DED9CE] border-l-4 ${borderClass} bg-[#FFFFFF] p-3 sm:p-4 rounded-sm mb-6 transition-all text-[#1A1A1A]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-6 h-6 rounded-sm bg-[#F6F4EF] flex items-center justify-center flex-shrink-0 text-[#791F1F]">
            <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[#1A1A1A]">
                ACTIVE HAZARD IN YOUR VICINITY: {currentTitle}
              </h4>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-sm bg-[#F6F4EF] border border-[#DED9CE] font-bold">
                SEV {liveAlert?.severityScore || severityScore}/10
              </span>
              {liveAlert && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-semibold">
                  LIVE BROADCAST DISPATCH
                </span>
              )}
            </div>
            <p className="text-xs text-[#4A4A4A] leading-relaxed mb-1">
              {currentAdvisory}
            </p>
            {currentEvacuation && (
              <div className="text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded mt-1 border border-emerald-200 font-medium">
                👉 <strong>Evacuation Corridor:</strong> {currentEvacuation}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-sm text-[#6B655B] hover:text-[#1A1A1A] hover:bg-[#F6F4EF] transition-colors"
            title="Dismiss notification"
            aria-label="Dismiss warning"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
