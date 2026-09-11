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
} from "lucide-react";
import type { WeatherTelemetry } from "@/app/api/telemetry/weather/route";

interface WeatherTelemetryBarProps {
  fireCount?: number;
  quakeCount?: number;
}

export function WeatherTelemetryBar({ fireCount = 139, quakeCount = 2 }: WeatherTelemetryBarProps) {
  const [weather, setWeather] = useState<WeatherTelemetry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
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

      {/* Middle: Key Meteorological Sensors */}
      <div className="flex items-center gap-4 text-[11px] text-slate-300 font-mono flex-shrink-0">
        {/* Wind */}
        <div className="flex items-center gap-1.5" title="Wind Velocity">
          <Wind className="w-3.5 h-3.5 text-blue-400" />
          <span>{weather ? `${weather.windSpeed.toFixed(1)} km/h` : "42.5 km/h"}</span>
        </div>

        {/* Pressure */}
        <div className="flex items-center gap-1.5" title="Barometric Pressure">
          <Gauge className="w-3.5 h-3.5 text-purple-400" />
          <span>{weather ? `${weather.pressure.toFixed(0)} hPa` : "998 hPa"}</span>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-1.5" title="Relative Humidity">
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          <span>{weather ? `${weather.humidity}% RH` : "88% RH"}</span>
        </div>

        {/* Storm surge estimate */}
        <div className="flex items-center gap-1.5 text-cyan-300" title="Storm Surge Coastal Gauge">
          <Waves className="w-3.5 h-3.5" />
          <span>Surge: {weather ? `${weather.stormSurgeEstimateMeters.toFixed(1)}m` : "2.4m"}</span>
        </div>
      </div>

      {/* Right: Remote Satellite Feeds */}
      <div className="flex items-center gap-3 text-[11px] font-mono flex-shrink-0">
        <div className="flex items-center gap-1 text-red-400" title="NASA FIRMS Satellite Thermal Radiance">
          <Flame className="w-3.5 h-3.5 fill-red-400/20" />
          <span>{fireCount} VIIRS Fires</span>
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
  );
}
