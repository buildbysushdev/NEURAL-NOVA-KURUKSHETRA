"use client";

import React, { useState, useEffect } from "react";
import {
  CloudRain,
  Wind,
  Gauge,
  Droplets,
  Flame,
  Activity,
  AlertTriangle,
  RefreshCw,
  Waves,
  Navigation,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Info,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import type { WeatherTelemetry } from "@/app/api/telemetry/weather/route";
import {
  DEMO_FIRE_POINTS,
  getWindCardinal,
  getSpreadVector,
  calculateDynamicSpreadMetrics,
  type DemoFirePoint,
} from "@/lib/telemetry/demoFireData";

interface WeatherTelemetryBarProps {
  fireCount?: number;
  quakeCount?: number;
  onFocusFirePoint?: (lat: number, lng: number) => void;
}

export function WeatherTelemetryBar({
  fireCount = 139,
  quakeCount = 2,
  onFocusFirePoint,
}: WeatherTelemetryBarProps) {
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFireModal, setShowFireModal] = useState<boolean>(false);
  const [selectedFire, setSelectedFire] = useState<DemoFirePoint | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/telemetry/weather");
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (e) {
      console.warn("Weather telemetry fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 60000); // 1-minute live poll
    return () => clearInterval(interval);
  }, []);

  const windSpeed = weather ? weather.windSpeed : 42.5;
  const windDirection = weather ? weather.windDirection : 165;
  const humidity = weather ? weather.humidity : 88;

  const windCardinal = getWindCardinal(windDirection);
  const spreadVector = getSpreadVector(windDirection);
  const overallMetrics = calculateDynamicSpreadMetrics(windSpeed, humidity, 82);

  return (
    <div className="space-y-2">
      {/* Primary Telemetry Strip */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0c111d]/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto text-xs shadow-inner">
        {/* Left: Weather Status Summary */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">
              {weather ? `${weather.temperature.toFixed(1)}°C` : "29.2°C"}
            </span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              {weather ? weather.condition : "Tropical Overcast"}
            </span>
          </div>

          <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />

          {/* Cyclone Warning Level Tag */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 font-mono text-[10px] font-bold tracking-wider">
              CYCLONE STAGE 2: {weather ? weather.cycloneRiskLevel : "ALERT"}
            </span>
          </div>
        </div>

        {/* Middle: Wind Speed & Direction + Fire Spread Trigger */}
        <div className="flex items-center gap-3 text-[11px] font-mono flex-shrink-0">
          {/* Enhanced Wind Speed & Direction with live compass arrow */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 shadow-sm"
            title={`Wind Origin: ${windCardinal} (${windDirection}°) at ${windSpeed.toFixed(1)} km/h • Spreading flame downwind toward ${spreadVector.cardinal} (${spreadVector.bearing}°)`}
          >
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-white">{windSpeed.toFixed(1)} km/h</span>
            <div className="flex items-center gap-1 pl-1.5 border-l border-blue-500/30 text-[10px]">
              <Navigation
                className="w-3 h-3 text-cyan-400 inline-block transition-transform duration-500"
                style={{ transform: `rotate(${windDirection}deg)` }}
              />
              <span className="font-bold text-cyan-300">{windCardinal} ({windDirection}°)</span>
            </div>
          </div>

          {/* DEMO FIRE SPREAD & ROOT CAUSE HUD BUTTON */}
          <button
            type="button"
            onClick={() => setShowFireModal((p) => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition shadow-sm group ${
              showFireModal
                ? "bg-red-500/25 border-red-500/60 text-white ring-1 ring-red-400/40"
                : "bg-red-500/15 border-red-500/35 text-red-300 hover:bg-red-500/25 hover:border-red-500/50"
            }`}
            title="Inspect 4 Demo Fire Points, Wind Propagation Possibility & AI Root Causes"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse group-hover:scale-110 transition-transform" />
            <span className="font-bold text-white">🔥 4 Demo Fires</span>
            <span className="px-1.5 py-0.2 rounded bg-red-500/30 text-red-200 text-[10px] font-bold">
              {overallMetrics.probability}% {overallMetrics.riskLevel} SPREAD
            </span>
            <ChevronDown
              className={`w-3 h-3 text-red-400 transition-transform duration-200 ${
                showFireModal ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Pressure */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-300" title="Barometric Pressure">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span>{weather ? `${weather.pressure.toFixed(0)} hPa` : "998 hPa"}</span>
          </div>

          {/* Humidity */}
          <div className="hidden lg:flex items-center gap-1.5 text-slate-300" title="Relative Humidity">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>{weather ? `${weather.humidity}% RH` : "88% RH"}</span>
          </div>

          {/* Storm surge estimate */}
          <div className="hidden xl:flex items-center gap-1.5 text-cyan-300" title="Storm Surge Coastal Gauge">
            <Waves className="w-3.5 h-3.5" />
            <span>Surge: {weather ? `${weather.stormSurgeEstimateMeters.toFixed(1)}m` : "2.4m"}</span>
          </div>
        </div>

        {/* Right: Remote Feeds & Refresh */}
        <div className="flex items-center gap-3 text-[11px] font-mono flex-shrink-0">
          <div className="flex items-center gap-1 text-red-400" title="NASA FIRMS Satellite Thermal Radiance">
            <Flame className="w-3.5 h-3.5 fill-red-400/20" />
            <span>{fireCount} VIIRS</span>
          </div>

          <div className="flex items-center gap-1 text-amber-400" title="USGS Global Earthquake Sensors">
            <Activity className="w-3.5 h-3.5" />
            <span>{quakeCount} Quakes</span>
          </div>

          <button
            onClick={fetchWeather}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
            title="Refresh Meteorological Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expandable Fire Points, Spread Possibility & Root Cause Panel */}
      {showFireModal && (
        <div className="rounded-xl border border-red-500/30 bg-[#0E1524]/95 backdrop-blur-xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Header of Drawer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-300 border border-red-500/40">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Live Fire Points, Wind Propagation Vectors & AI Root Causes
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-mono font-bold">
                    4 ACTIVE HOTSPOTS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Dynamic fire spread model calculated from live wind vector and atmospheric conditions
                </p>
              </div>
            </div>

            {/* Dynamic Plume Dispersion Summary Pill */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-slate-300 flex items-center gap-2">
                <Navigation
                  className="w-3.5 h-3.5 text-cyan-400"
                  style={{ transform: `rotate(${windDirection}deg)` }}
                />
                <span>Wind Origin: <strong className="text-white">{windCardinal} ({windDirection}°)</strong></span>
                <span className="text-slate-500">→</span>
                <span>Spread Heading: <strong className="text-red-400">{spreadVector.cardinal} ({spreadVector.bearing}°)</strong></span>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-bold">
                {overallMetrics.probability}% {overallMetrics.riskLevel} SPREAD RISK
              </div>

              <button
                onClick={() => setShowFireModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
                title="Close Fire Telemetry Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid of the 4 Demo Fire Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
            {DEMO_FIRE_POINTS.map((fire) => {
              const metrics = calculateDynamicSpreadMetrics(
                windSpeed,
                humidity,
                fire.spreadProbability
              );

              return (
                <div
                  key={fire.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] p-3.5 transition space-y-2.5"
                >
                  {/* Fire Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span className="text-xs font-bold text-slate-100">{fire.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {fire.zone} • {fire.coordinatesFormatted}
                      </span>
                    </div>

                    {/* Spread Risk Badge */}
                    <div
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                        metrics.riskLevel === "CRITICAL"
                          ? "bg-red-500/20 border-red-500/40 text-red-300"
                          : metrics.riskLevel === "HIGH"
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-yellow-500/20 border-yellow-500/40 text-yellow-300"
                      }`}
                    >
                      {metrics.probability}% {metrics.riskLevel} SPREAD
                    </div>
                  </div>

                  {/* Wind Vector & Spread Possibility */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono rounded-lg bg-black/30 p-2 border border-white/[0.04]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Flame Spread Vector</span>
                      <span className="text-cyan-300 font-bold flex items-center gap-1 mt-0.5">
                        <Navigation
                          className="w-3 h-3 text-cyan-400"
                          style={{ transform: `rotate(${spreadVector.bearing}deg)` }}
                        />
                        {spreadVector.cardinal} ({spreadVector.bearing}°) @ {metrics.advanceSpeedKmh} km/h
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Radiative Power (FRP)</span>
                      <span className="text-amber-300 font-bold mt-0.5 block">
                        {fire.frp_mw} MW • {fire.brightness_kelvin} K
                      </span>
                    </div>
                  </div>

                  {/* Root Cause Diagnosis */}
                  <div className="text-[11px] space-y-1">
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" />
                      <span>AI Root Cause Diagnosis:</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed bg-amber-500/[0.06] border border-amber-500/20 rounded-lg p-2 font-sans">
                      {fire.cause}
                    </p>
                  </div>

                  {/* Hazard Plume & Recommended Action */}
                  <div className="text-[10px] text-slate-400 space-y-1 border-t border-white/[0.06] pt-2 font-mono">
                    <div>
                      <span className="text-slate-500">Toxic Plume: </span>
                      <span className="text-slate-300">{fire.hazardPlume}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Required Suppressant: </span>
                      <span className="text-emerald-300">{fire.recommendedSuppressant}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

