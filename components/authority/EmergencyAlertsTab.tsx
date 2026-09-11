"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Radio,
  Send,
  Flame,
  Waves,
  Zap,
  Activity,
  ShieldAlert,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  BellRing,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

export interface DisasterIncidentAlert {
  id: string;
  hazardType: "CYCLONE" | "FLOOD" | "FIRE" | "EARTHQUAKE" | "GRID_FAILURE";
  title: string;
  zone: string;
  coordinates: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE";
  severityScore: number;
  status: "ACTIVE EMERGENCY" | "RAPID SPREAD" | "UNDER CONTAINMENT" | "PREDICTED LANDFALL";
  onsetETA: string;
  populationAtRisk: number;
  areaRadiusKm: number;
  situationReport: string;
  evacuationCorridor: string;
  allocatedSquads: string;
  dispatchedToPublic: boolean;
}

const MASTER_DISASTERS: DisasterIncidentAlert[] = [
  {
    id: "dis-01",
    hazardType: "CYCLONE",
    title: "Severe Cyclonic Storm 'Fengal' — Coastal Surge & Inundation",
    zone: "Marina Waterfront & Santhome Sector B // Chennai",
    coordinates: "13.0544° N, 80.2818° E",
    severity: "CRITICAL",
    severityScore: 9,
    status: "PREDICTED LANDFALL",
    onsetETA: "Landfall in ~2.5 hrs (Peak Gusts: 115 km/h)",
    populationAtRisk: 14200,
    areaRadiusKm: 3.8,
    situationReport:
      "Automated sea gauge telemetry detected storm surge water level at 2.4m above mean high tide. Coastal breach encroaching onto Kamaraj Salai. High risk of residential inundation in low-lying fishing colonies.",
    evacuationCorridor: "Evacuate Westward via Anna Salai corridor toward Central Relief Station Alpha.",
    allocatedSquads: "NDRF Squad 4 (4 Inflatable Zodiacs) + SDRF Marine Unit 2",
    dispatchedToPublic: true,
  },
  {
    id: "dis-02",
    hazardType: "FIRE",
    title: "Class-B Industrial Chemical & Substation Fire",
    zone: "SIDCO Industrial Complex // Guindy Sector C",
    coordinates: "13.0067° N, 80.2024° E",
    severity: "CRITICAL",
    severityScore: 9,
    status: "ACTIVE EMERGENCY",
    onsetETA: "Active Fire (FRP: 410 MW Radiance)",
    populationAtRisk: 8600,
    areaRadiusKm: 1.8,
    situationReport:
      "NASA VIIRS Satellite detected high-intensity thermal flare at solvent storage facility. Thick toxic smoke plume dispersing North-East toward residential blocks. High risk of transformer secondary explosions.",
    evacuationCorridor: "Immediately evacuate upwind along GST Road. Avoid Guindy industrial underpasses.",
    allocatedSquads: "TNFRS Fire Tenders (6 units) + Foam Tender 1 + Hazmat Unit",
    dispatchedToPublic: false,
  },
  {
    id: "dis-03",
    hazardType: "FLOOD",
    title: "Chembarambakkam Reservoir Sluice Outflow Overflow",
    zone: "Adyar River Basin // Saidapet & Jafferkhanpet Sector D",
    coordinates: "13.0213° N, 80.2231° E",
    severity: "HIGH",
    severityScore: 8,
    status: "RAPID SPREAD",
    onsetETA: "Surge Crest in ~45 min (8,500 cusecs)",
    populationAtRisk: 22000,
    areaRadiusKm: 4.5,
    situationReport:
      "Controlled discharge increased from Chembarambakkam catchment basin following 180mm extreme precipitation. Adyar riverbank water levels at danger mark (+1.8m). Causeway causeways submerged.",
    evacuationCorridor: "Relocate to Royapettah Community Center and Saidapet Higher Ground Camp.",
    allocatedSquads: "Coast Guard Air Support + SDRF Boat Squad Alpha",
    dispatchedToPublic: false,
  },
  {
    id: "dis-04",
    hazardType: "EARTHQUAKE",
    title: "Offshore Bay of Bengal Intraplate Seismic Tremor",
    zone: "Offshore Chennai Continental Shelf (Depth: 12 km)",
    coordinates: "12.8950° N, 80.4500° E",
    severity: "MODERATE",
    severityScore: 6,
    status: "UNDER CONTAINMENT",
    onsetETA: "Tremor recorded 18 min ago (M 4.2 Mw)",
    populationAtRisk: 55000,
    areaRadiusKm: 25.0,
    situationReport:
      "USGS Seismic Network registered M 4.2 earthquake 38km offshore. Secondary Tsunami Threat Evaluation returned NEGATIVE. Minor structural hairline cracks reported in old harbor masonry.",
    evacuationCorridor: "Stay clear of dilapidated port warehouses; coastal structural inspection underway.",
    allocatedSquads: "Public Works Department Structural Engineers + Port Safety Squad",
    dispatchedToPublic: true,
  },
  {
    id: "dis-05",
    hazardType: "GRID_FAILURE",
    title: "TNEB High-Voltage Grid Infiltration & Power Isolation",
    zone: "Triplicane & Royapettah Electrical Substations",
    coordinates: "13.0583° N, 80.2642° E",
    severity: "HIGH",
    severityScore: 7,
    status: "ACTIVE EMERGENCY",
    onsetETA: "Grid Trip Ongoing (45,000 meters dark)",
    populationAtRisk: 45000,
    areaRadiusKm: 2.2,
    situationReport:
      "Groundwater ingress into high-voltage underground cable ducts caused automated circuit breakers to trip across 3 sub-stations. Government General Hospital shifted to diesel generator emergency reserve.",
    evacuationCorridor: "Do NOT touch water near street transformer boxes. Follow solar street lighting.",
    allocatedSquads: "TNEB Quick Restoration Squad (14 linesmen) + Heavy Dewatering Pumps",
    dispatchedToPublic: false,
  },
];

export function EmergencyAlertsTab() {
  const [alerts, setAlerts] = useState<DisasterIncidentAlert[]>(MASTER_DISASTERS);
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  const handleBroadcast = (alert: DisasterIncidentAlert) => {
    setBroadcastingId(alert.id);

    // Save into localStorage so Citizen & Rescue portals instantly receive it
    try {
      const activeBroadcasts = JSON.parse(localStorage.getItem("active_broadcast_alerts") || "[]");
      const updated = [alert, ...activeBroadcasts.filter((a: any) => a.id !== alert.id)];
      localStorage.setItem("active_broadcast_alerts", JSON.stringify(updated));
      localStorage.setItem("latest_public_emergency_alert", JSON.stringify(alert));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.warn("Broadcast storage sync:", e);
    }

    setTimeout(() => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, dispatchedToPublic: true } : a))
      );
      setBroadcastingId(null);
      toast.success("🚨 Emergency Broadcast Dispatched!", {
        description: `Alert transmitted via CAP v1.2 Protocol (SMS + Web + Citizen Portal) to ${alert.populationAtRisk.toLocaleString()} citizens in ${alert.zone}.`,
      });
    }, 1000);
  };

  const getHazardIcon = (type: DisasterIncidentAlert["hazardType"]) => {
    switch (type) {
      case "CYCLONE":
        return <Waves className="w-5 h-5 text-cyan-400" />;
      case "FIRE":
        return <Flame className="w-5 h-5 text-red-400" />;
      case "FLOOD":
        return <Waves className="w-5 h-5 text-blue-400" />;
      case "EARTHQUAKE":
        return <Activity className="w-5 h-5 text-amber-400" />;
      case "GRID_FAILURE":
        return <Zap className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getSeverityBadge = (sev: DisasterIncidentAlert["severity"]) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-500/15 border-red-500/40 text-red-300";
      case "HIGH":
        return "bg-amber-500/15 border-amber-500/40 text-amber-300";
      case "MODERATE":
        return "bg-blue-500/15 border-blue-500/40 text-blue-300";
    }
  };

  return (
    <div className="flex flex-col h-[680px] rounded-2xl border border-white/[0.08] bg-[#0d131f]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Emergency Alerts &amp; Situation Broadcast</h3>
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-400 font-bold">
                {alerts.length} Multi-Hazard Threats
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live National CAP v1.2 Protocol Alert Manager
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            alerts.forEach((a) => handleBroadcast(a));
          }}
          className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>Broadcast All</span>
        </button>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-2xl border p-4 transition-all duration-200 ${
              alert.severity === "CRITICAL"
                ? "bg-red-950/15 border-red-500/25 hover:border-red-500/40"
                : alert.severity === "HIGH"
                ? "bg-amber-950/15 border-amber-500/25 hover:border-amber-500/40"
                : "bg-slate-900/60 border-white/[0.08] hover:border-white/[0.15]"
            }`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex-shrink-0">
                  {getHazardIcon(alert.hazardType)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold tracking-wider ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity} — SEV {alert.severityScore}/10
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-slate-300">
                      {alert.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white leading-snug">{alert.title}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                    <MapPin className="w-3 h-3 text-red-400" />
                    {alert.zone}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                {alert.dispatchedToPublic ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dispatched to Public</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleBroadcast(alert)}
                    disabled={broadcastingId === alert.id}
                    className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition disabled:opacity-50"
                  >
                    {broadcastingId === alert.id ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Broadcasting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>Broadcast to Citizen &amp; Rescue</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Situation description */}
            <p className="text-xs text-slate-300 leading-relaxed bg-black/25 p-3 rounded-xl border border-white/[0.04] mb-3">
              {alert.situationReport}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-[11px]">
              <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-slate-400 text-[10px]">Estimated At Risk</div>
                <div className="font-semibold text-white font-mono mt-0.5">
                  {alert.populationAtRisk.toLocaleString()} citizens
                </div>
              </div>
              <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-slate-400 text-[10px]">Impact Radius</div>
                <div className="font-semibold text-white font-mono mt-0.5">
                  {alert.areaRadiusKm} km radius
                </div>
              </div>
              <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-slate-400 text-[10px]">Timeline / ETA</div>
                <div className="font-semibold text-cyan-400 font-mono mt-0.5 text-[10px]">
                  {alert.onsetETA}
                </div>
              </div>
              <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.04]">
                <div className="text-slate-400 text-[10px]">Deployment</div>
                <div className="font-semibold text-amber-400 font-mono mt-0.5 text-[10px] truncate" title={alert.allocatedSquads}>
                  {alert.allocatedSquads.split("+")[0]}
                </div>
              </div>
            </div>

            {/* Evacuation Route Advice */}
            <div className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-emerald-300">
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
              <span>
                <strong>Evacuation Corridor:</strong> {alert.evacuationCorridor}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
