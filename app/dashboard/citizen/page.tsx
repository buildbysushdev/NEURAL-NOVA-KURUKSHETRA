"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Citizen Emergency Portal (/dashboard/citizen/page.tsx)
 * ==============================================================================
 * 
 * Warm, Trustworthy & Human-Centered Design System:
 * - Base: Warm off-white #F6F4EF, Soft Cards #FFFFFF with gentle slate borders
 * - Reassuring Header & Context-Aware Greeting
 * - Dynamic Active Threat Warning Banner with live severity pulse
 * - Hero Area Safety Card: Area sector, Threat rating, Nearest safe haven, Wind speed, and SOS Beacon
 * - Actionable Physical Telemetry: RichAlertCard powered by Analyst Agent (water depth, rise rate, evacuation corridor)
 * - Action Switcher: File Incident Report, Ask Assistant Chatbot, Safe Evacuation Zones Map
 */

import React, { useState, useEffect, useMemo } from "react";
import ReportForm, { IncidentReport } from "@/components/ReportForm";
import { CitizenChatbot } from "@/components/citizen/CitizenChatbot";
import { ActiveDisasterBanner } from "@/components/citizen/ActiveDisasterBanner";
import AlertMap from "@/components/AlertMap";
import { RichAlertCard, RichAlertIncident } from "@/components/notifications/RichAlertCard";
import { generateFallbackAnalysis } from "@/lib/agents/analyst";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  MessageCircle,
  MapPin,
  Radio,
  Wind,
  PhoneCall,
  CheckCircle2,
  Compass,
  FileText,
  Navigation,
  LifeBuoy,
  Activity,
  Layers
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function StatBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "emerald" | "blue" | "red" | "amber" | "slate";
}) {
  const textColors = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    red: "text-red-700",
    amber: "text-amber-700",
    slate: "text-slate-800",
  };

  return (
    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 text-center">
      <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
        {label}
      </span>
      <span className={`text-sm font-bold font-mono ${textColors[color]}`}>
        {value}
      </span>
    </div>
  );
}

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

  // Active Enriched Hazard Analysis for Citizen Area
  const activeRichIncident: RichAlertIncident = useMemo(() => {
    const analysis = generateFallbackAnalysis({
      incidentId: "CITIZEN-SURGE-ZONE-B",
      type: "flood",
      description: "High-tide storm surge breached coastal seawall along Marina Beach; lower roadways experiencing rapid inundation.",
      location: { lat: userLocation[0], lng: userLocation[1] },
      locationName: "Marina Waterfront Sector B // Chennai Central",
      severityScore: activeZoneScore,
    });

    return {
      id: "CITIZEN-SURGE-ZONE-B",
      type: "Storm Surge & Coastal Inundation",
      location_name: "Marina Waterfront Sector B // Chennai Central",
      description: "Automated coastal gauge sensors recorded sea surge water level at 2.4m. Inundation encroaching onto Kamaraj Salai corridor.",
      severity_score: activeZoneScore,
      enriched_data: analysis.enriched_data,
      prediction_data: analysis.prediction_data,
      impact_data: analysis.impact_data,
      recommended_actions: analysis.recommended_actions,
      created_at: new Date().toISOString(),
    };
  }, [userLocation, activeZoneScore]);

  return (
    <div className="theme-citizen min-h-screen bg-[#F6F4EF] text-[#1A1A1A] font-public-sans pb-16">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Warm Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              {language === "hi" ? "नमस्ते // सुरक्षित रहें" : "Good evening • Disaster Response Network"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {language === "hi" ? "सुरक्षित रहें, सूचित रहें" : "Stay safe, stay informed"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              <span>National Helpline: 112</span>
            </a>
          </div>
        </div>

        {/* Dynamic Threat Warning Banner */}
        {isHazardActive && (
          <ActiveDisasterBanner
            zoneName="Marina Waterfront Sector B // Storm Surge Warning"
            severityLevel="critical"
            severityScore={activeZoneScore}
            advisoryText="High-tide inundation breaching lower roadways. Designated Safe Shelter: Central Relief Station Alpha (800m inland). Evacuation teams stationed."
          />
        )}

        {/* Hero Area Safety Status Card */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  isHazardActive
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                }`}
              >
                {isHazardActive ? (
                  <AlertOctagon className="w-6 h-6" strokeWidth={2} />
                ) : (
                  <ShieldCheck className="w-6 h-6" strokeWidth={2} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isHazardActive ? "bg-red-500 animate-pulse-live" : "bg-emerald-500"
                    }`}
                  />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Your Assigned Area
                  </p>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Marina Waterfront Sector B // Chennai Central
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
                  {isHazardActive
                    ? "Sentinel AI monitoring stations have recorded rising water levels along low-lying coastal paths. Emergency squads are active in your quadrant."
                    : "All emergency seawalls and drainways are clear. Potable water stations and community shelters are on standby."}
                </p>
              </div>
            </div>

            {/* Emergency SOS Button */}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  toast.success("Emergency SOS Beacon Dispatched", {
                    description: "High-priority distress telemetry routed to NDRF Rescue Squad Alpha.",
                  });
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <AlertTriangle className="w-4 h-4" strokeWidth={2} />
                <span>Broadcast Emergency SOS</span>
              </button>
            </div>
          </div>

          {/* Environmental & Safety Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
            <StatBlock
              label="Local Threat Level"
              value={isHazardActive ? "SEV 8 // CRITICAL" : "SEV 2 // STABLE"}
              color={isHazardActive ? "red" : "emerald"}
            />
            <StatBlock
              label="Nearest Safe Haven"
              value="0.8 km (Marina Central)"
              color="blue"
            />
            <StatBlock
              label="Coastal Wind Velocity"
              value="42 km/h (Gusts 55)"
              color="slate"
            />
            <StatBlock
              label="Relief Food & Water"
              value="3,000 Rations Ready"
              color="emerald"
            />
          </div>
        </div>

        {/* 🆕 ACTIONABLE PHYSICAL TELEMETRY & EVACUATION DIRECTIVES (Analyst Agent) */}
        {isHazardActive && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-live" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                  NDMA Physical Telemetry &amp; Safe Evacuation Corridor
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                Analyst Agent Verified
              </span>
            </div>

            {/* Rich Physical Alert Card */}
            <div className="rounded-2xl shadow-sm overflow-hidden">
              <RichAlertCard incident={activeRichIncident} />
            </div>
          </div>
        )}

        {/* Navigation Tabs for Citizen Actions */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "report"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>File Incident Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "chat"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Ask AI Ground Assistant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "map"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Evacuation &amp; Safe Shelters</span>
          </button>
        </div>

        {/* Tab 1: Incident Reporting Form & Guidance */}
        {activeTab === "report" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <ReportForm onIncidentReported={(r) => setRecentReports((prev) => [r, ...prev])} />
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Designated Shelter Corridors
                    </h4>
                    <p className="text-[11px] text-slate-500">Official Civil Protection Route</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  In flood-impacted sectors, follow marked inland high-ground roadways. Evacuation buses and medical aid officers are stationed at Marina Central Station and Royapettah Relief Post.
                </p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">SDMA Direct Radio:</span>
                  <span className="text-emerald-600 font-bold">1070 // ACTIVE</span>
                </div>
              </div>

              {/* Quick AI Assistant Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Need Shelter or Supply Guidance?
                    </h4>
                    <p className="text-[11px] text-slate-500">Available in English and हिन्दी</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Chat with our grounded AI relief assistant for real-time depot stocks, safe evacuation pathways, or medical station locations.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Open Citizen Sentinel Chat</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sentinel Assistant Chatbot */}
        {activeTab === "chat" && (
          <div className="max-w-2xl mx-auto">
            <CitizenChatbot />
          </div>
        )}

        {/* Tab 3: Safe Evacuation Zones Map */}
        {activeTab === "map" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Local Safe Havens &amp; Active Hazard Corridors
                  </h3>
                  <p className="text-xs text-slate-500">Live GIS telemetry with safe shelters and incident perimeters</p>
                </div>
              </div>
              <span className="hidden sm:inline text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Safe Zones: Green • Incidents: Red
              </span>
            </div>

            <div className="h-[460px] w-full rounded-xl overflow-hidden border border-slate-200">
              <AlertMap userLocation={userLocation} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
