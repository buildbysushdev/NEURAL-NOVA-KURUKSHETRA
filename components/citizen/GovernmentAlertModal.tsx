"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  PhoneCall,
  X,
  Radio,
  Share2,
  LifeBuoy,
  BellRing,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export interface EmergencyBroadcastData {
  id: string;
  title: string;
  hazardType: string;
  zone: string;
  severity: string;
  severityScore: number;
  situationReport: string;
  evacuationCorridor: string;
  issuedAt: string;
}

const DEFAULT_BROADCAST: EmergencyBroadcastData = {
  id: "eas-broad-01",
  title: "Cyclone Fengal: Severe Storm Surge & Coastal Breach",
  hazardType: "CYCLONE / SURGE",
  zone: "Marina Beach Waterfront Sector B // Chennai",
  severity: "CRITICAL",
  severityScore: 9,
  situationReport:
    "National Disaster Management Authority (NDMA) automated coastal gauge sensors recorded sea surge water level at 2.4m. Inundation encroaching onto Kamaraj Salai corridor. Immediate evacuation mandated for residents within 1.5km of coastline.",
  evacuationCorridor:
    "Move west inland via Anna Salai corridor toward Central Relief Station Alpha (800m). Avoid low-lying coastal paths.",
  issuedAt: "Just now // High Priority Cell Broadcast",
};

interface GovernmentAlertModalProps {
  onAcknowledgeSafe?: () => void;
  onRequestRescue?: () => void;
}

export function GovernmentAlertModal({
  onAcknowledgeSafe,
  onRequestRescue,
}: GovernmentAlertModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [broadcast, setBroadcast] = useState<EmergencyBroadcastData>(DEFAULT_BROADCAST);
  const [citizenStatus, setCitizenStatus] = useState<"unacknowledged" | "safe" | "sos">("unacknowledged");

  useEffect(() => {
    // Listen to authority broadcast dispatch from localStorage
    const syncAlert = () => {
      try {
        const stored = localStorage.getItem("latest_public_emergency_alert");
        if (stored) {
          const parsed = JSON.parse(stored);
          setBroadcast({
            id: parsed.id || `eas-${Date.now()}`,
            title: parsed.title || DEFAULT_BROADCAST.title,
            hazardType: parsed.hazardType || "DISASTER ALERT",
            zone: parsed.zone || DEFAULT_BROADCAST.zone,
            severity: parsed.severity || "CRITICAL",
            severityScore: parsed.severityScore || 9,
            situationReport: parsed.situationReport || DEFAULT_BROADCAST.situationReport,
            evacuationCorridor: parsed.evacuationCorridor || DEFAULT_BROADCAST.evacuationCorridor,
            issuedAt: "Active Emergency Alert",
          });

          // Check if already acknowledged for this alert
          const ackStatus = localStorage.getItem(`ack_${parsed.id}`);
          if (!ackStatus) {
            setIsOpen(true);
            setCitizenStatus("unacknowledged");
          }
        }
      } catch (e) {}
    };

    syncAlert();
    window.addEventListener("storage", syncAlert);
    const interval = setInterval(syncAlert, 3000);
    return () => {
      window.removeEventListener("storage", syncAlert);
      clearInterval(interval);
    };
  }, []);

  const handleConfirmSafe = () => {
    setCitizenStatus("safe");
    try {
      localStorage.setItem(`ack_${broadcast.id}`, "safe");
      localStorage.setItem("citizen_safety_status", "SAFE");
    } catch (e) {}

    toast.success("Safety Status Confirmed", {
      description: "NDRF Command center notified: You are marked SAFE.",
    });

    if (onAcknowledgeSafe) onAcknowledgeSafe();
    setTimeout(() => setIsOpen(false), 800);
  };

  const handleRequestSOS = () => {
    setCitizenStatus("sos");
    try {
      localStorage.setItem(`ack_${broadcast.id}`, "sos");
      localStorage.setItem("citizen_safety_status", "CRITICAL_SOS");
    } catch (e) {}

    toast.error("🚨 CRITICAL SOS TRANSMITTED", {
      description: "Rescue Squad Delta dispatched to your GPS coordinate (13.0544, 80.2818). Stay on high ground!",
    });

    if (onRequestRescue) onRequestRescue();
  };

  // Demo simulation trigger
  const triggerSimulationModal = () => {
    setIsOpen(true);
    setCitizenStatus("unacknowledged");
  };

  return (
    <>
      {/* Simulation Trigger Chip for Judge Demonstration */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-3 mb-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-800 block">
              Emergency Cell Broadcast Simulation
            </span>
            <span className="text-[10px] text-slate-500">
              {citizenStatus === "safe"
                ? "✓ You are marked SAFE by SDMA Command"
                : citizenStatus === "sos"
                ? "🚨 SOS Beacon Active — Rescue En Route"
                : "Standby for official state disaster warnings"}
            </span>
          </div>
        </div>

        <button
          type="button"
          data-demo="eas-trigger"
          onClick={triggerSimulationModal}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm flex items-center gap-1.5"
        >
          <BellRing className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulate EAS Alert</span>
        </button>
      </div>

      {/* Official Government Broadcast Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-red-600 animate-in zoom-in-95 duration-200">
            {/* EAS Top Siren Banner */}
            <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-white animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                    GOVERNMENT EMERGENCY CELL BROADCAST
                  </h3>
                  <p className="text-[10px] text-red-100">
                    Disaster Management Authority &amp; NDRF Protocol
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              {/* Alert Title & Location */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-mono text-[10px] font-bold">
                    CRITICAL SEV {broadcast.severityScore}/10
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {broadcast.issuedAt}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {broadcast.title}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>{broadcast.zone}</span>
                </div>
              </div>

              {/* Situation Report */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed font-sans">
                {broadcast.situationReport}
              </div>

              {/* Evacuation Corridor Directive */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Official Safe Evacuation Corridor</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {broadcast.evacuationCorridor}
                </p>
              </div>

              {/* Status Indicator if responded */}
              {citizenStatus === "safe" && (
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Your safety status has been confirmed and logged by NDRF command.</span>
                </div>
              )}

              {citizenStatus === "sos" && (
                <div className="p-3 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs flex items-center gap-2 font-medium">
                  <LifeBuoy className="w-4 h-4 text-red-600 animate-spin" />
                  <span>Emergency rescue squad alerted! Stay on highest available floor.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  data-demo="i-am-safe-btn"
                  onClick={handleConfirmSafe}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Am Safe — Confirm Safety Status</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleRequestSOS}
                    className="py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5"
                  >
                    <LifeBuoy className="w-4 h-4" />
                    <span>Need Immediate Rescue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      toast.info("Navigating to Shelter", {
                        description: "Head west on Anna Salai toward Central Relief Station Alpha.",
                      });
                    }}
                    className="py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Find Safe Haven</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
