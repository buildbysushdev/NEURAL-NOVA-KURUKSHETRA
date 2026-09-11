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

  // If severity increases, banner reappears automatically
  useEffect(() => {
    if (severityScore > lastSeenScore) {
      setDismissed(false);
      setLastSeenScore(severityScore);
    }
  }, [severityScore, lastSeenScore]);

  if (dismissed) return null;

  const borderClass =
    severityLevel === "critical"
      ? "border-l-[#791F1F]"
      : severityLevel === "watch"
      ? "border-l-[#854F0B]"
      : "border-l-[#3B6D11]";

  const dotClass =
    severityLevel === "critical"
      ? "bg-[#791F1F]"
      : severityLevel === "watch"
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
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[#1A1A1A]">
                ACTIVE HAZARD IN YOUR VICINITY: {zoneName}
              </h4>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-sm bg-[#F6F4EF] border border-[#DED9CE] font-bold">
                SEV {severityScore}/10
              </span>
            </div>
            <p className="text-xs text-[#4A4A4A] leading-relaxed">
              {advisoryText}
            </p>
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
