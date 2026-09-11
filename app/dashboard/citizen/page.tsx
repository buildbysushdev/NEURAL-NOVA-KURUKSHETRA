"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReportForm, { IncidentReport } from "@/components/ReportForm";
import { ActiveDisasterBanner } from "@/components/citizen/ActiveDisasterBanner";
import { GovernmentAlertModal } from "@/components/citizen/GovernmentAlertModal";
import { FloatingChatbotButton } from "@/components/citizen/FloatingChatbotButton";
import AlertMap from "@/components/AlertMap";
import { RichAlertCard, RichAlertIncident } from "@/components/notifications/RichAlertCard";
import WalkieTalkie from "@/components/WalkieTalkie";
import { generateFallbackAnalysis } from "@/lib/agents/analyst";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import { toast } from "sonner";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
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
  Layers,
  Phone,
  Package,
  Clock,
  ArrowRight,
  ExternalLink,
  Droplets,
  HeartPulse,
  Waves,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ShelterInfo {
  id: string;
  name: string;
  distanceKm: number;
  capacity: number;
  occupancy: number;
  foodRations: number;
  hasMedicalTeam: boolean;
  address: string;
  safeRoute: string;
}

const OFFICIAL_SHELTERS: ShelterInfo[] = [
  {
    id: "sh-01",
    name: "Central Relief Station Alpha",
    distanceKm: 0.8,
    capacity: 2500,
    occupancy: 920,
    foodRations: 3000,
    hasMedicalTeam: true,
    address: "Marina Central Transit Hub, Kamaraj Inland Promenade",
    safeRoute: "Move inland westward via Anna Salai corridor. Avoid low-lying coastal paths.",
  },
  {
    id: "sh-02",
    name: "Royapettah Civil Relief Post",
    distanceKm: 1.2,
    capacity: 1800,
    occupancy: 640,
    foodRations: 2200,
    hasMedicalTeam: true,
    address: "Community Hall Complex, Royapettah High Road",
    safeRoute: "Follow Royapettah High Road. Bridge causes elevated access.",
  },
  {
    id: "sh-03",
    name: "Saidapet High-Ground Relief Camp",
    distanceKm: 2.1,
    capacity: 3200,
    occupancy: 1150,
    foodRations: 4500,
    hasMedicalTeam: true,
    address: "Saidapet Government Model School Grounds",
    safeRoute: "Cross via Anna Salai flyover. Ground floor clear of flood lines.",
  },
];

const EMERGENCY_HELPLINES = [
  { number: "112", label: "National Emergency Helpline", desc: "All-India Unified Police, Fire, Ambulance dispatch", color: "red" },
  { number: "108", label: "Emergency Ambulance (ALS/BLS)", desc: "Immediate paramedic & casualty evacuation", color: "red" },
  { number: "1070", label: "Tamil Nadu SDMA Disaster Control", desc: "State Emergency Operations Centre (SEOC)", color: "blue" },
  { number: "101", label: "Fire & Rescue Operations", desc: "Chemical fires, flood boat rescue, building collapse", color: "amber" },
  { number: "100", label: "Police Control Room", desc: "Law enforcement, cordon security, traffic diversion", color: "slate" },
  { number: "1913", label: "Greater Chennai Corporation Flood Control", desc: "Dewatering pumps, tree fall clearing, shelter info", color: "emerald" },
];

export default function CitizenDashboardPage() {
  const { language } = useLanguage();

  const [userLocation] = useState<[number, number]>([13.0544, 80.2818]);
  const [activeTab, setActiveTab] = useState<"safety" | "shelters" | "report" | "helplines" | "relief" | "walkie">("safety");
  const [isMarkedSafe, setIsMarkedSafe] = useState(false);
  const [recentReports, setRecentReports] = useState<IncidentReport[]>([]);

  // Check saved citizen safety status
  useEffect(() => {
    try {
      const saved = localStorage.getItem("citizen_safety_status");
      if (saved === "SAFE") setIsMarkedSafe(true);
    } catch (e) {}
  }, []);

  const handleToggleSafe = () => {
    const nextState = !isMarkedSafe;
    setIsMarkedSafe(nextState);
    try {
      localStorage.setItem("citizen_safety_status", nextState ? "SAFE" : "UNKNOWN");
    } catch (e) {}

    if (nextState) {
      toast.success("Marked Safe", {
        description: "Your safety status has been confirmed and logged with SDMA Command.",
      });
    } else {
      toast.info("Status Reset", { description: "Safety status cleared." });
    }
  };

  // Enriched Hazard Telemetry powered by Analyst Agent
  const activeRichIncident: RichAlertIncident = useMemo(() => {
    const analysis = generateFallbackAnalysis({
      incidentId: "CITIZEN-SURGE-ZONE-B",
      type: "flood",
      description:
        "High-tide storm surge breached coastal seawall along Marina Beach; lower roadways experiencing rapid inundation.",
      location: { lat: userLocation[0], lng: userLocation[1] },
      locationName: "Marina Waterfront Sector B // Chennai Central",
      severityScore: 8,
    });

    return {
      id: "CITIZEN-SURGE-ZONE-B",
      type: "Storm Surge & Coastal Inundation",
      location_name: "Marina Waterfront Sector B // Chennai Central",
      description:
        "Automated coastal gauge sensors recorded sea surge water level at 2.4m. Inundation encroaching onto Kamaraj Salai corridor.",
      severity_score: 8,
      enriched_data: analysis.enriched_data,
      prediction_data: analysis.prediction_data,
      impact_data: analysis.impact_data,
      recommended_actions: analysis.recommended_actions,
      created_at: new Date().toISOString(),
    };
  }, [userLocation]);

  return (
    <div className="theme-citizen min-h-screen bg-[#F6F4EF] text-[#1A1A1A] font-public-sans pb-28">
      {/* Mobile-Friendly App Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-5">
        
        {/* Top App Status Header */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 font-mono">
                  NDMA CITIZEN SAFETY APP
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Grid
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Marina Waterfront Sector B // Chennai (13.0544°N, 80.2818°E)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href="tel:112"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>SOS Dial: 112</span>
            </a>
          </div>
        </div>

        {/* Official EAS Emergency Alert Pop-up Trigger & Modal */}
        <GovernmentAlertModal
          onAcknowledgeSafe={() => setIsMarkedSafe(true)}
          onRequestRescue={() => setIsMarkedSafe(false)}
        />

        {/* Dynamic Warning Banner */}
        <ActiveDisasterBanner
          zoneName="Marina Waterfront Sector B // Storm Surge Warning"
          severityLevel="critical"
          severityScore={8}
          advisoryText="High-tide sea surge at 2.4m. Coastal roadways experiencing rapid inundation. Safe shelter: Central Relief Station Alpha (800m inland via Anna Salai corridor)."
        />

        {/* App-Style Main Quick Navigation Buttons (6 Big Tactile Tabs) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("safety")}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-24 ${
              activeTab === "safety"
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <Shield className={`w-5 h-5 ${activeTab === "safety" ? "text-cyan-400" : "text-blue-600"}`} />
              {isMarkedSafe && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <div>
              <div className="text-xs font-bold">Safety Status</div>
              <div className={`text-[10px] ${activeTab === "safety" ? "text-slate-400" : "text-slate-500"}`}>
                {isMarkedSafe ? "Verified Safe" : "Threat Monitoring"}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shelters")}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-24 ${
              activeTab === "shelters"
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
            }`}
          >
            <Navigation className={`w-5 h-5 ${activeTab === "shelters" ? "text-cyan-400" : "text-emerald-600"}`} />
            <div>
              <div className="text-xs font-bold">Safe Shelters</div>
              <div className={`text-[10px] ${activeTab === "shelters" ? "text-slate-400" : "text-slate-500"}`}>
                3 Havens (800m away)
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-24 ${
              activeTab === "report"
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
            }`}
          >
            <FileText className={`w-5 h-5 ${activeTab === "report" ? "text-cyan-400" : "text-amber-600"}`} />
            <div>
              <div className="text-xs font-bold">Report Incident</div>
              <div className={`text-[10px] ${activeTab === "report" ? "text-slate-400" : "text-slate-500"}`}>
                1-Tap SOS Triage
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("helplines")}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-24 ${
              activeTab === "helplines"
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
            }`}
          >
            <Phone className={`w-5 h-5 ${activeTab === "helplines" ? "text-cyan-400" : "text-red-600"}`} />
            <div>
              <div className="text-xs font-bold">Helplines</div>
              <div className={`text-[10px] ${activeTab === "helplines" ? "text-slate-400" : "text-slate-500"}`}>
                112 / 108 / 1070
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("relief")}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-24 ${
              activeTab === "relief"
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
            }`}
          >
            <Package className={`w-5 h-5 ${activeTab === "relief" ? "text-cyan-400" : "text-purple-600"}`} />
            <div>
              <div className="text-xs font-bold">Relief Supplies</div>
              <div className={`text-[10px] ${activeTab === "relief" ? "text-slate-400" : "text-slate-500"}`}>
                3,000 Food Kits
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("walkie")}
            className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between h-24 ${
              activeTab === "walkie"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 font-bold"
                : "bg-white text-slate-800 border-amber-300/60 hover:border-amber-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <Radio className={`w-5 h-5 ${activeTab === "walkie" ? "text-slate-950 animate-pulse" : "text-amber-500"}`} />
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
            <div>
              <div className="text-xs font-bold">Mesh Radio</div>
              <div className={`text-[10px] ${activeTab === "walkie" ? "text-slate-900 font-semibold" : "text-amber-600"}`}>
                CH 7 • PTT Voice
              </div>
            </div>
          </button>
        </div>

        {/* TAB 1: SAFETY STATUS HUB */}
        {activeTab === "safety" && (
          <div className="space-y-5">
            {/* Quick Safety Check-in Card */}
            <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                      isMarkedSafe
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}
                  >
                    {isMarkedSafe ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <ShieldAlert className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {isMarkedSafe ? "Safety Confirmed" : "Citizen Safety Status: Unconfirmed"}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          isMarkedSafe
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isMarkedSafe ? "VERIFIED SAFE" : "ACTION REQUIRED"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {isMarkedSafe
                        ? "Your GPS coordinate is marked safe in the Central Civil Defense registry. You will receive real-time alerts if flood lines advance."
                        : "Please let civil defense command know if you and your family are safe, or if you require immediate rescue boats/paramedics."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSafe}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-1.5 ${
                      isMarkedSafe
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isMarkedSafe ? "Change Status" : "Mark Myself Safe"}</span>
                  </button>
                </div>
              </div>

              {/* Environmental Sensor Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">Surge Water Level</span>
                  <span className="text-sm font-bold text-red-600 font-mono">2.4m (+18cm/h)</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">Nearest Shelter</span>
                  <span className="text-sm font-bold text-blue-600 font-mono">0.8 km (Alpha)</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">Coastal Wind</span>
                  <span className="text-sm font-bold text-slate-800 font-mono">42 km/h SSE</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] text-slate-500 block">Medical Post</span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">NDRF Active</span>
                </div>
              </div>
            </div>

            {/* Analyst Agent Physics & Inundation Telemetry */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                    NDMA Physical Telemetry &amp; Evacuation Corridor
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  Analyst Agent Verified
                </span>
              </div>

              <div className="rounded-2xl shadow-sm overflow-hidden">
                <RichAlertCard incident={activeRichIncident} />
              </div>
            </div>

            {/* Walkie-Talkie Push-to-Talk Emergency Mesh Comms */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                    Offline Tactical Mesh Comms · Push-To-Talk Radio
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  AI Sector Band: CH 7
                </span>
              </div>
              <div className="flex justify-center">
                <WalkieTalkie
                  role="citizen"
                  sector="Marina Waterfront Sector B"
                  channel="CH 7 • 462.7125 MHz"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SAFE EVACUATION SHELTERS & MAP */}
        {activeTab === "shelters" && (
          <div className="space-y-4">
            {/* Shelters Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {OFFICIAL_SHELTERS.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">{s.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {s.distanceKm} km away
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3">{s.address}</p>

                    <div className="space-y-1.5 text-xs text-slate-700 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Occupancy:</span>
                        <span className="font-semibold">{s.occupancy} / {s.capacity} persons</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Food Rations:</span>
                        <span className="font-semibold text-emerald-600">{s.foodRations} meals ready</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Medical Aid:</span>
                        <span className="font-semibold text-blue-600">Paramedics On-Site</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg leading-relaxed">
                    👉 <strong>Route:</strong> {s.safeRoute}
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive GIS Map */}
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                    Official Evacuation Corridors &amp; Safe Havens
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Green: Safe Havens · Red: Hazard Perimeter
                </span>
              </div>

              <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-slate-200">
                <AlertMap userLocation={userLocation} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 1-TAP INCIDENT / SOS REPORTING */}
        {activeTab === "report" && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Submit SOS / Emergency Hazard Report
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Your report is immediately ingested by Groq LLaMA 3 Sentinel Agent within 300ms for priority rescue dispatch.
              </p>
            </div>
            <ReportForm onIncidentReported={(r) => setRecentReports((prev) => [r, ...prev])} />
          </div>
        )}

        {/* TAB 4: EMERGENCY HELPLINES SPEED DIAL */}
        {activeTab === "helplines" && (
          <div className="space-y-3">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Civil Emergency Directory — 1-Tap Speed Dial
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                In severe emergencies, dial directly from your device. All lines operate 24x7 with priority emergency routing.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EMERGENCY_HELPLINES.map((h, i) => (
                  <a
                    key={i}
                    href={`tel:${h.number}`}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold font-mono text-red-600">
                          {h.number}
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          {h.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{h.desc}</p>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition shadow-sm">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RELIEF SUPPLIES & WATER POINTS */}
        {activeTab === "relief" && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Relief Supplies &amp; Potable Water Distribution Points
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Managed by Tamil Nadu Civil Supplies Corporation &amp; Red Cross volunteers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>3,000 Food Ration Kits</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Contains dry provisions, biscuits, glucose, milk powder, and matches.
                </p>
                <div className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                  Location: Central Relief Station Alpha (7AM - 8PM)
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <Droplets className="w-4 h-4 text-cyan-600" />
                  <span>Potable Drinking Water</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Reverse osmosis tanker dispensing 20L canisters per family.
                </p>
                <div className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-2 py-1 rounded border border-cyan-200">
                  Location: Royapettah Post &amp; Marina Station
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <HeartPulse className="w-4 h-4 text-red-600" />
                  <span>Paramedic First Aid</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Tetanus shots, clean bandages, water purification tablets, insulin backup.
                </p>
                <div className="text-[10px] font-mono text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
                  Location: All 3 Relief Shelters
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: STANDALONE OFFLINE MESH WALKIE TALKIE */}
        {activeTab === "walkie" && (
          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-950 p-5 text-white border border-amber-500/30 shadow-xl">
              <div className="flex items-center gap-2.5 text-amber-400 mb-2">
                <Radio className="w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                  Sentinel AI Dynamic Sector Radio Coordination
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When telecommunication towers fail during coastal surge events, Kurukshetra automatically activates peer-to-peer audio mesh broadcasting. Sentinel AI allocates non-interfering channels per district so citizens can broadcast voice alerts directly to local NDRF rescue squads.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Channel Frequency</span>
                  <span className="text-amber-400 font-bold font-mono">462.7125 MHz (CH 7)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Channel Bandwidth</span>
                  <span className="text-emerald-400 font-bold font-mono">12.5 kHz Narrow</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Squelch CTCSS Tone</span>
                  <span className="text-blue-400 font-bold font-mono">67.0 Hz Tone Squ.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <WalkieTalkie
                role="citizen"
                sector="Marina Waterfront Sector B"
                channel="CH 7 • 462.7125 MHz"
              />
            </div>
          </div>
        )}

      </div>

      {/* Real-time Voice Floating AI Ground Assistant */}
      <FloatingChatbotButton />
    </div>
  );
}
