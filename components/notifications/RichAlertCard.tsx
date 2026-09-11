"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: RichAlertCard.tsx (Actionable Physical Telemetry & Prediction Card)
 * ==============================================================================
 * 
 * Displays deep NDMA parameters from the Analyst Agent:
 * - Physical parameters: Kelvin brightness, spread rate, AQI, water depth, aftershock risk
 * - AI Prediction: Escalation probability, time to critical, historical incident pattern correlation
 * - Impact: Population at risk, vulnerable demographics, economic damage estimate
 * - Recommended Actions: Targeted citizen actions, authority directives, and safe evacuation corridors
 */

import React from "react";
import {
  Flame,
  Droplets,
  Mountain,
  Wind,
  Building2,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  MapPin,
  Shield,
  ArrowRight,
  Activity,
  ThermometerSun,
  Waves,
  Gauge,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export interface RichAlertIncident {
  id: string;
  type: string;
  location_name?: string;
  description: string;
  severity_score: number;
  enriched_data?: any;
  prediction_data?: {
    probability_of_escalation: number;
    time_to_critical_minutes: number;
    worst_case_scenario: string;
    historical_match: string;
    confidence_score: number;
  };
  impact_data?: {
    estimated_affected_people: number;
    vulnerable_groups: string[];
    infrastructure_at_risk: string[];
    economic_impact_estimate: string;
  };
  recommended_actions?: {
    for_citizens: string[];
    for_authorities: string[];
    evacuation_direction?: string;
    avoid_areas?: string[];
  };
  created_at?: string;
}

interface RichAlertCardProps {
  incident: RichAlertIncident;
  onNavigate?: () => void;
}

export function RichAlertCard({ incident, onNavigate }: RichAlertCardProps) {
  const isCritical = incident.severity_score >= 8;
  const isWarning = incident.severity_score >= 6 && incident.severity_score < 8;

  const severityStyle = isCritical
    ? {
        border: "border-red-500/40",
        bg: "bg-red-950/20",
        badge: "bg-red-500/20 text-red-300 border border-red-500/30",
        accent: "text-red-400",
        glow: "shadow-[0_0_30px_rgba(239,68,68,0.12)]",
      }
    : isWarning
    ? {
        border: "border-amber-500/40",
        bg: "bg-amber-950/20",
        badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
        accent: "text-amber-400",
        glow: "shadow-[0_0_30px_rgba(245,158,11,0.12)]",
      }
    : {
        border: "border-blue-500/40",
        bg: "bg-blue-950/20",
        badge: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
        accent: "text-blue-400",
        glow: "shadow-[0_0_30px_rgba(59,130,246,0.10)]",
      };

  const TypeIcon = getDisasterIcon(incident.type);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border ${severityStyle.border} ${severityStyle.bg}
        backdrop-blur-xl ${severityStyle.glow} p-5 space-y-4 text-slate-100 transition-all duration-300
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl ${severityStyle.bg} border ${severityStyle.border} flex items-center justify-center flex-shrink-0`}
          >
            <TypeIcon className={`w-5 h-5 ${severityStyle.accent}`} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${severityStyle.badge}`}
              >
                {isCritical ? "CRITICAL" : isWarning ? "WARNING" : "WATCH"} · SEV {incident.severity_score}/10
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Analyst Agent Enriched
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 capitalize leading-tight">
              {incident.type.replace(/_/g, " ")} — {incident.location_name || "Assigned Sector"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{incident.description}</p>
          </div>
        </div>
      </div>

      {/* 1. PHYSICAL PARAMETERS (Disaster-Specific) */}
      <div className="rounded-xl bg-black/30 border border-white/[0.06] p-4">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Physical Telemetry &amp; Physics Analysis
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {renderPhysicalParams(incident.type, incident.enriched_data)}
        </div>
      </div>

      {/* 2. PREDICTION & HISTORICAL CORRELATION */}
      {incident.prediction_data && (
        <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-violet-300 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
              AI Prediction Engine
            </p>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
              {incident.prediction_data.confidence_score}% Confidence
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <MetricBlock
              label="Escalation Probability"
              value={`${incident.prediction_data.probability_of_escalation}%`}
              icon={AlertTriangle}
              color={incident.prediction_data.probability_of_escalation > 60 ? "red" : "amber"}
            />
            <MetricBlock
              label="Time to Critical"
              value={`${incident.prediction_data.time_to_critical_minutes} min`}
              icon={Clock}
              color="blue"
            />
          </div>

          <div className="space-y-2 pt-3 border-t border-white/[0.05] text-xs">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Worst-Case Escalation</p>
              <p className="text-slate-300 mt-0.5">{incident.prediction_data.worst_case_scenario}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Historical NDMA Correlate</p>
              <p className="text-violet-300 italic mt-0.5">{incident.prediction_data.historical_match}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. IMPACT ASSESSMENT */}
      {incident.impact_data && (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-mono">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Demographic &amp; Economic Impact
          </p>

          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-2xl sm:text-3xl font-bold text-slate-100 font-mono tabular-nums">
              {incident.impact_data.estimated_affected_people?.toLocaleString() || "—"}
            </p>
            <p className="text-xs text-slate-400">citizens in vulnerable impact zone</p>
          </div>

          {incident.impact_data.vulnerable_groups?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {incident.impact_data.vulnerable_groups.map((g: string) => (
                <span
                  key={g}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-300 border border-orange-500/20 capitalize"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {incident.impact_data.economic_impact_estimate && (
            <p className="text-xs text-slate-400 mt-2">
              Est. Economic Impact:{" "}
              <span className="font-mono text-slate-200 font-semibold">
                {incident.impact_data.economic_impact_estimate}
              </span>
            </p>
          )}
        </div>
      )}

      {/* 4. ACTIONABLE EVACUATION & DIRECTIVES */}
      {incident.recommended_actions && (
        <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 space-y-3">
          <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <Shield className="w-3.5 h-3.5" />
            Actionable Response Directives
          </p>

          {incident.recommended_actions.evacuation_direction && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <p className="text-xs font-semibold">
                Safe Evacuation Corridor: {incident.recommended_actions.evacuation_direction}
              </p>
            </div>
          )}

          {incident.recommended_actions.for_citizens?.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mb-1.5">For Citizens</p>
              <ul className="space-y-1 text-xs text-slate-300">
                {incident.recommended_actions.for_citizens.map((action: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {incident.recommended_actions.avoid_areas?.length > 0 && (
            <div className="pt-2 border-t border-white/[0.04]">
              <p className="text-[10px] text-red-400 font-mono uppercase tracking-wider mb-1.5">
                ⚠ Prohibited / Danger Sectors
              </p>
              <div className="flex flex-wrap gap-1.5">
                {incident.recommended_actions.avoid_areas.map((area: string, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/15 text-red-300 border border-red-500/30"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// HELPER: Disaster-Specific Physical Parameters
// ═══════════════════════════════════════════════════

function renderPhysicalParams(type: string, data: any) {
  if (!data) return <p className="text-xs text-slate-500 col-span-2">Telemetry enrichment pending...</p>;

  switch (type.toLowerCase()) {
    case "fire":
      return (
        <>
          <ParamBlock
            label="Intensity"
            value={data.intensity_label || "High"}
            sub={`${data.estimated_temperature_celsius || 650}°C`}
            icon={ThermometerSun}
            color="red"
          />
          <ParamBlock
            label="Spread Rate"
            value={`${data.spread_rate_m_per_hr || 120} m/hr`}
            sub={`Wind ${data.wind_direction || "NE"} ${data.wind_speed_kmh || 15}km/h`}
            icon={Wind}
            color="orange"
          />
          <ParamBlock
            label="Smoke Radius"
            value={`${data.smoke_radius_km || 2.5} km`}
            sub={data.fire_type || "chemical"}
            icon={Wind}
            color="slate"
          />
          <ParamBlock
            label="Air Quality"
            value={`AQI ${data.aqi_predicted || 320}`}
            sub={data.aqi_category || "Hazardous"}
            icon={Gauge}
            color={data.aqi_predicted > 300 ? "red" : "amber"}
          />
        </>
      );

    case "flood":
      return (
        <>
          <ParamBlock
            label="Water Depth"
            value={`${data.water_depth_meters || 2.2}m`}
            sub={data.depth_label || "Chest Level"}
            icon={Waves}
            color="blue"
          />
          <ParamBlock
            label="Submerged Area"
            value={`${data.submerged_area_sq_km || 3.5} km²`}
            sub={`${data.buildings_affected || 350} buildings`}
            icon={MapPin}
            color="blue"
          />
          <ParamBlock
            label="Rise Rate"
            value={`${data.rise_rate_cm_per_hr || 12} cm/hr`}
            sub={data.rise_rate_cm_per_hr > 0 ? "Rising" : "Receding"}
            icon={TrendingUp}
            color={data.rise_rate_cm_per_hr > 10 ? "red" : "amber"}
          />
          <ParamBlock
            label="Water Velocity"
            value={`${data.current_speed_ms || 1.4} m/s`}
            sub={data.flood_type || "urban"}
            icon={Activity}
            color="cyan"
          />
        </>
      );

    case "earthquake":
      return (
        <>
          <ParamBlock
            label="Magnitude"
            value={`M${data.magnitude || 5.8}`}
            sub={data.magnitude_label || "Strong"}
            icon={Mountain}
            color="red"
          />
          <ParamBlock
            label="Depth"
            value={`${data.depth_km || 15} km`}
            sub={`${data.epicenter_distance_km || 12}km away`}
            icon={MapPin}
            color="amber"
          />
          <ParamBlock
            label="Shaking (MMI)"
            value={`MMI ${data.shaking_intensity_mmi || 6}`}
            sub="Modified Mercalli"
            icon={Activity}
            color="orange"
          />
          <ParamBlock
            label="Aftershock 24h"
            value={`${data.aftershock_probability_24h || 70}%`}
            sub="Risk probability"
            icon={AlertTriangle}
            color="red"
          />
        </>
      );

    case "cyclone":
      return (
        <>
          <ParamBlock
            label="Wind Speed"
            value={`${data.wind_speed_kmh || 140} km/h`}
            sub={data.category || "Severe Cyclone"}
            icon={Wind}
            color="red"
          />
          <ParamBlock
            label="Landfall In"
            value={`${data.landfall_eta_hours || 4}h`}
            sub={`Heading ${data.movement_direction || "WNW"}`}
            icon={Clock}
            color="amber"
          />
          <ParamBlock
            label="Storm Surge"
            value={`${data.storm_surge_meters || 3.0}m`}
            sub="Coastal inundation"
            icon={Waves}
            color="blue"
          />
          <ParamBlock
            label="Expected Rain"
            value={`${data.rainfall_mm_expected || 250}mm`}
            sub="24h precipitation"
            icon={Droplets}
            color="cyan"
          />
        </>
      );

    case "structural_collapse":
      return (
        <>
          <ParamBlock
            label="Est. Trapped"
            value={`~${data.estimated_trapped || 12}`}
            sub={data.structural_type || "Masonry"}
            icon={Users}
            color="red"
          />
          <ParamBlock
            label="Collapsed Floors"
            value={`${data.floors_collapsed || 3}`}
            sub={data.collapse_type || "Void Pockets"}
            icon={Building2}
            color="amber"
          />
          <ParamBlock
            label="Survival Window"
            value={`${data.survival_window_hours || 36}h`}
            sub={data.rescue_difficulty || "extreme"}
            icon={Clock}
            color="orange"
          />
          <ParamBlock
            label="Secondary Risk"
            value={data.secondary_risk || "Gas leak"}
            sub={`${data.debris_volume_cubic_m || 750}m³`}
            icon={AlertTriangle}
            color="red"
          />
        </>
      );

    default:
      return (
        <ParamBlock
          label="Hazard Assessment"
          value={data.intensity_label || "High Priority"}
          sub={data.affected_scope || "Civilian Sector"}
          icon={Activity}
          color="blue"
        />
      );
  }
}

function ParamBlock({ label, value, sub, icon: Icon, color }: any) {
  const colors: any = {
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    slate: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  };

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
      <div
        className={`w-8 h-8 rounded-lg ${colors[color]} border flex items-center justify-center flex-shrink-0`}
      >
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono truncate">{label}</p>
        <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">{value || "—"}</p>
        {sub && <p className="text-[10px] text-slate-400 truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MetricBlock({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    red: "text-red-400",
    amber: "text-amber-400",
    blue: "text-blue-400",
  };

  return (
    <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${colors[color]}`} />
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">{label}</p>
      </div>
      <p className={`text-xl font-bold font-mono tabular-nums ${colors[color]}`}>{value}</p>
    </div>
  );
}

function getDisasterIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("fire")) return Flame;
  if (t.includes("flood") || t.includes("surge") || t.includes("water")) return Droplets;
  if (t.includes("earthquake") || t.includes("seismic")) return Mountain;
  if (t.includes("cyclone") || t.includes("storm") || t.includes("wind")) return Wind;
  if (t.includes("collapse") || t.includes("structural")) return Building2;
  return AlertTriangle;
}

export default RichAlertCard;
