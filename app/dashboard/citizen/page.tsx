"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Citizen Emergency Portal (/dashboard/citizen/page.tsx)
 * ==============================================================================
 * 
 * Strict Institutional Design System:
 * - Base: Warm off-white #F6F4EF, Text: Charcoal #1A1A1A
 * - Typography: Public Sans for body text, IBM Plex Mono for metrics/coordinates
 * - Severity Colors: ONLY as left-border strips & small status dots (no full background fills)
 * - Persistent Active Disaster Warning Banner (dismissible, re-arms on severity increase)
 * - Hero: Large Safety Status Indicator Card
 * - Incident Reporting Form with GPS acquisition and photo evidence upload
 * - Interactive Citizen Sentinel Chatbot (smart autoscroll, 3-dot typing indicator, hover timestamps)
 * - Simplified Relief & Safe Zones Map
 */

import React, { useState, useEffect } from "react";
import ReportForm, { IncidentReport } from "@/components/ReportForm";
import { CitizenChatbot } from "@/components/citizen/CitizenChatbot";
import { ActiveDisasterBanner } from "@/components/citizen/ActiveDisasterBanner";
import AlertMap from "@/components/AlertMap";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ShieldCheck,
  AlertOctagon,
  LifeBuoy,
  MapPin,
  Send,
  Radio,
  PhoneCall,
  CheckCircle2,
  Navigation,
  Clock,
  Compass,
  Home
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CitizenDashboardPage() {
  const { language, t } = useLanguage();

  const [nearbyCriticalCount, setNearbyCriticalCount] = useState<number>(1);
  const [activeZoneScore, setActiveZoneScore] = useState<number>(8);
  const [userLocation, setUserLocation] = useState<[number, number]>([13.0827, 80.2707]);
  const [recentReports, setRecentReports] = useState<IncidentReport[]>([]);
  const [activeTab, setActiveTab] = useState<"report" | "chat" | "map">("report");

  // Realtime subscription for incoming safety broadcasts
  useEffect(() => {
    const unsubscribe = subscribeToIncidents((payload) => {
      if (payload.eventType === "INSERT") {
        const item = payload.new;
        if (item && (item.location_lat || item.latitude)) {
          const lat = Number(item.location_lat ?? item.latitude);
          const lng = Number(item.location_lng ?? item.longitude);
          const score = item.severity_score !== undefined ? Number(item.severity_score) : 7;

          const report: IncidentReport = {
            id: item.id?.toString() || `inc-${Date.now()}`,
            type: item.type || "Hazard Notification",
            description: item.description || "Active emergency coordinate.",
            location_lat: lat,
            location_lng: lng,
            latitude: lat,
            longitude: lng,
            severity: score >= 8 ? "CRITICAL" : score >= 6 ? "HIGH" : "MODERATE",
            severity_score: score,
            needed_resources: item.needed_resources || [],
            created_at: item.created_at || new Date().toISOString(),
          };

          setRecentReports((prev) => [report, ...prev]);

          if (score >= 8) {
            setNearbyCriticalCount((c) => c + 1);
            setActiveZoneScore(score);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isHazardActive = nearbyCriticalCount > 0;

  return (
    <div className="theme-citizen min-h-screen bg-[#F6F4EF] text-[#1A1A1A] font-public-sans pb-16">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* PERSISTENT ACTIVE DISASTER WARNING BANNER */}
        {isHazardActive && (
          <ActiveDisasterBanner
            zoneName="Marina Waterfront Sector B // Storm Surge Warning"
            severityLevel="critical"
            severityScore={activeZoneScore}
            advisoryText="High-tide inundation breaching lower roadways. Designated Safe Zone: Central Multi-Story Shelter Alpha (800m inland)."
          />
        )}

        {/* HERO SECTION: Large Safety Status Indicator Card */}
        <div
          className={`border border-[#DED9CE] bg-[#FFFFFF] p-5 sm:p-6 rounded-sm border-l-4 ${
            isHazardActive ? "border-l-[#791F1F]" : "border-l-[#3B6D11]"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-sm flex items-center justify-center flex-shrink-0 ${
                  isHazardActive
                    ? "bg-[#F6F4EF] text-[#791F1F] border border-[#DED9CE]"
                    : "bg-[#F6F4EF] text-[#3B6D11] border border-[#DED9CE]"
                }`}
              >
                {isHazardActive ? (
                  <AlertOctagon className="w-7 h-7" strokeWidth={1.75} />
                ) : (
                  <ShieldCheck className="w-7 h-7" strokeWidth={1.75} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={isHazardActive ? "dot-critical" : "dot-safe"} />
                  <span className="font-ibm-mono text-xs uppercase tracking-widest text-[#6B655B]">
                    CITIZEN TELEMETRY SECTOR: CHENNAI CENTRAL
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A1A]">
                  {isHazardActive
                    ? "Active Alert: Elevate Precautionary Readiness"
                    : "Your Sector is Classified Stable"}
                </h2>
                <p className="text-xs text-[#6B655B] mt-1 leading-relaxed">
                  {isHazardActive
                    ? "Automated Sentinel sensors have registered rising surge activity within 1.5 km of your location."
                    : "All emergency barriers active. Potable water distribution and medical aid hubs operational."}
                </p>
              </div>
            </div>

            {/* Quick Action Verbs */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Button
                variant="destructive"
                onClick={() => {
                  toast.success("Emergency SOS Signal Transmitted", {
                    description: "High-priority distress beacon routed to Rescue Squad Alpha.",
                  });
                }}
                className="h-9 px-4 text-xs font-bold"
              >
                <Radio className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} />
                Broadcast Emergency SOS
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#DED9CE]">
            <div>
              <span className="font-ibm-mono text-[10px] uppercase text-[#6B655B] block">
                Nearest Safe Depot
              </span>
              <span className="font-ibm-mono text-xs font-bold text-[#1A1A1A]">
                Marina Central (0.8 km)
              </span>
            </div>
            <div>
              <span className="font-ibm-mono text-[10px] uppercase text-[#6B655B] block">
                Local Threat Level
              </span>
              <span className="font-ibm-mono text-xs font-bold text-[#791F1F]">
                SEV 8 // CRITICAL
              </span>
            </div>
            <div>
              <span className="font-ibm-mono text-[10px] uppercase text-[#6B655B] block">
                Rescue Dispatch Status
              </span>
              <span className="font-ibm-mono text-xs font-bold text-[#3B6D11]">
                SQUAD #4 EN ROUTE
              </span>
            </div>
            <div>
              <span className="font-ibm-mono text-[10px] uppercase text-[#6B655B] block">
                Relief Kits Stocked
              </span>
              <span className="font-ibm-mono text-xs font-bold text-[#1A1A1A]">
                3,000 Rations Ready
              </span>
            </div>
          </div>
        </div>

        {/* TAB CONTROLS */}
        <div className="flex items-center gap-1 border-b border-[#DED9CE] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "report"
                ? "bg-[#1A1A1A] text-[#F6F4EF]"
                : "text-[#6B655B] hover:text-[#1A1A1A] hover:bg-[#EBE7DF]"
            }`}
          >
            File Incident Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "chat"
                ? "bg-[#1A1A1A] text-[#F6F4EF]"
                : "text-[#6B655B] hover:text-[#1A1A1A] hover:bg-[#EBE7DF]"
            }`}
          >
            Sentinel Assistant Chatbot
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === "map"
                ? "bg-[#1A1A1A] text-[#F6F4EF]"
                : "text-[#6B655B] hover:text-[#1A1A1A] hover:bg-[#EBE7DF]"
            }`}
          >
            Safe Evacuation Zones
          </button>
        </div>

        {/* TAB 1: Incident Reporting Form */}
        {activeTab === "report" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <ReportForm onIncidentReported={(r) => setRecentReports((prev) => [r, ...prev])} />
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="border border-[#DED9CE] bg-[#FFFFFF] p-4 rounded-sm border-l-4 border-l-[#3B6D11]">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-[#3B6D11]" strokeWidth={1.75} />
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[#1A1A1A]">
                    DESIGNATED SHELTER PROTOCOLS
                  </h4>
                </div>
                <p className="text-xs text-[#4A4A4A] leading-relaxed">
                  During flood surges, proceed immediately along high-ground corridors. Emergency personnel are stationed at Marina High School and Royapettah Community Center.
                </p>
                <div className="mt-3 pt-2 border-t border-[#DED9CE] text-[11px] font-mono text-[#6B655B] flex justify-between">
                  <span>Helpline: 1070 (SDMA)</span>
                  <span className="text-[#3B6D11] font-bold">24/7 ACTIVE</span>
                </div>
              </div>

              {/* Citizen Chat Mini Preview */}
              <div className="border border-[#DED9CE] bg-[#FFFFFF] p-4 rounded-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[#1A1A1A] mb-2">
                  NEED IMMEDIATE GUIDANCE?
                </h4>
                <p className="text-xs text-[#6B655B] mb-3">
                  Ask our autonomous multi-lingual assistant for real-time supply allocations or status updates.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setActiveTab("chat")}
                  className="w-full text-xs text-[#1A1A1A] border-[#DED9CE] hover:bg-[#F6F4EF]"
                >
                  Open Sentinel Chatbot
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Citizen Sentinel Chatbot */}
        {activeTab === "chat" && (
          <div className="max-w-2xl mx-auto">
            <CitizenChatbot />
          </div>
        )}

        {/* TAB 3: Simplified Safe Zones Map */}
        {activeTab === "map" && (
          <div className="border border-[#DED9CE] bg-[#FFFFFF] p-4 rounded-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DED9CE]">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#1A1A1A]" strokeWidth={1.75} />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#1A1A1A]">
                  SIMPLIFIED LOCAL SAFE ZONES &amp; RELIEF HUBS
                </h3>
              </div>
              <span className="font-ibm-mono text-[10px] text-[#3B6D11] font-bold">
                SAFE ZONES GREEN // DANGER ZONES RED
              </span>
            </div>

            <div className="h-[460px] w-full rounded-sm overflow-hidden border border-[#DED9CE]">
              <AlertMap userLocation={userLocation} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
