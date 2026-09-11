"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * TerrainRoadAnalysisPanel.tsx (OpenStreetMap Terrain & Road Navigability)
 * ==============================================================================
 * 
 * Features:
 * 1. OpenStreetMap & Topographic contour map inspection.
 * 2. Visual road classification: Submerged (Red), Debris (Amber), Passable (Green).
 * 3. Elevation & soil saturation telemetry for ground rescue operations.
 * 4. Passable vehicle matrix (Zodiac boat, 4x4 troop carrier, foot responders).
 */

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Navigation,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Ship,
  Truck,
  Droplets,
  Mountain,
  Compass,
  Waves
} from "lucide-react";
import type { RoadSegment } from "./TerrainRoadAnalysisInnerMap";

const DynamicTerrainMap = dynamic(
  () => import("./TerrainRoadAnalysisInnerMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] w-full rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-6 w-48 mx-auto bg-white/[0.06]" />
          <p className="text-xs font-mono text-slate-400">Loading OpenStreetMap Terrain Engine...</p>
        </div>
      </div>
    ),
  }
);

export function TerrainRoadAnalysisPanel({
  latitude = 13.0544,
  longitude = 80.2818,
  zoneName = "Marina Waterfront Basin",
}: {
  latitude?: number;
  longitude?: number;
  zoneName?: string;
}) {
  const [tileProvider, setTileProvider] = useState<"osm" | "esri_topo" | "esri_dark">("osm");
  const [selectedRoad, setSelectedRoad] = useState<RoadSegment | null>({
    id: "rd-1",
    name: "Kamaraj Salai (Marina Promenade)",
    status: "submerged",
    depthMeters: 1.4,
    flowVelocity: "2.4 m/s (Swift)",
    elevationMeters: 1.8,
    passableBy: "Zodiac Inflatable Boat Only (No Wheeled Vehicles)",
    coordinates: [],
  });

  return (
    <div className="space-y-4 font-ibm-sans">
      
      {/* Top Controls & Tile Switcher */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/80 p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Terrain &amp; Road Inundation Reconnaissance
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold">
                OPENSTREETMAP ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sector: {zoneName} ({latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E)
            </p>
          </div>
        </div>

        {/* Tile Provider Layer Toggle */}
        <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTileProvider("osm")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              tileProvider === "osm"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            OSM Standard
          </button>
          <button
            type="button"
            onClick={() => setTileProvider("esri_topo")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              tileProvider === "esri_topo"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Topo Elevation
          </button>
          <button
            type="button"
            onClick={() => setTileProvider("esri_dark")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              tileProvider === "esri_dark"
                ? "bg-slate-700/40 text-slate-200 border border-slate-600/50 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tactical Dark
          </button>
        </div>
      </div>

      {/* Main Map Component */}
      <DynamicTerrainMap
        targetLat={latitude}
        targetLng={longitude}
        tileProvider={tileProvider}
        onSelectRoad={(road) => setSelectedRoad(road)}
      />

      {/* Detailed Terrain & Selected Road Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Card 1: Selected Road Status */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
              Road Recon Detail
            </span>
            {selectedRoad?.status === "submerged" ? (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-mono font-bold">
                SUBMERGED
              </span>
            ) : selectedRoad?.status === "clear" ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                CLEAR
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                DEBRIS HAZARD
              </span>
            )}
          </div>

          <h4 className="text-sm font-semibold text-slate-100">{selectedRoad?.name}</h4>
          
          <div className="mt-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Standing Water Depth:</span>
              <span className="text-red-400 font-bold">{selectedRoad?.depthMeters} meters</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Current Flow Velocity:</span>
              <span className="text-amber-300 font-bold">{selectedRoad?.flowVelocity}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Road Elevation ASL:</span>
              <span className="text-slate-200 font-bold">{selectedRoad?.elevationMeters}m Above Sea Level</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-slate-300">
            <strong>Passable By:</strong> {selectedRoad?.passableBy}
          </div>
        </div>

        {/* Card 2: Terrain Elevation Profile */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Mountain className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
              Elevation &amp; Soil Profile
            </span>
          </div>

          <div className="space-y-3 mt-3">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Incident Basin Elevation</span>
                <span className="text-amber-400 font-bold">1.8m ASL (Lowland)</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "18%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Soil Saturation Index</span>
                <span className="text-red-400 font-bold">94% (Severe Risk)</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: "94%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Nearest High-Ground Ridge</span>
                <span className="text-emerald-400 font-bold">Anna Salai (14.2m)</span>
              </div>
              <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "75%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Vehicle & Craft Deployment Advisory */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Ship className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
              Deployment Matrix
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
              <span className="text-cyan-300 font-mono font-medium">Inflatable Zodiac Boats</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                OPTIMAL (Prop-Guard)
              </span>
            </div>

            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <span className="text-emerald-300 font-mono font-medium">Heavy Ashok Leyland 4x4</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                OK (Water &lt; 0.8m)
              </span>
            </div>

            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
              <span className="text-red-300 font-mono font-medium">108 Standard Ambulances</span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold">
                PROHIBITED (Hydro-Lock)
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
