"use client";

import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from "react-leaflet";
import L from "leaflet";

export interface RoadSegment {
  id: string;
  name: string;
  status: "submerged" | "clear" | "debris" | "caution";
  depthMeters: number;
  flowVelocity: string;
  elevationMeters: number;
  passableBy: string;
  coordinates: [number, number][];
}

const ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: "rd-1",
    name: "Kamaraj Salai (Marina Promenade)",
    status: "submerged",
    depthMeters: 1.4,
    flowVelocity: "2.4 m/s (Swift)",
    elevationMeters: 1.8,
    passableBy: "Zodiac Inflatable Boat Only (No Wheeled Vehicles)",
    coordinates: [
      [13.048, 80.282],
      [13.0544, 80.2818],
      [13.062, 80.283],
      [13.071, 80.285],
    ],
  },
  {
    id: "rd-2",
    name: "Anna Salai (Mount Road Corridor)",
    status: "clear",
    depthMeters: 0.0,
    flowVelocity: "0.0 m/s (Dry)",
    elevationMeters: 14.2,
    passableBy: "All Emergency Vehicles (NDRF Trucks, Ambulances)",
    coordinates: [
      [13.045, 80.250],
      [13.055, 80.258],
      [13.065, 80.265],
      [13.078, 80.272],
    ],
  },
  {
    id: "rd-3",
    name: "Santhome High Road Causeway",
    status: "debris",
    depthMeters: 0.6,
    flowVelocity: "1.1 m/s",
    elevationMeters: 3.5,
    passableBy: "High-Clearance Military 4x4 / Tracked Vehicles",
    coordinates: [
      [13.032, 80.278],
      [13.038, 80.279],
      [13.045, 80.281],
    ],
  },
  {
    id: "rd-4",
    name: "Poonamallee High Road (Green Corridor)",
    status: "clear",
    depthMeters: 0.0,
    flowVelocity: "0.0 m/s",
    elevationMeters: 11.5,
    passableBy: "All Emergency & Evacuation Convoys",
    coordinates: [
      [13.075, 80.240],
      [13.080, 80.255],
      [13.083, 80.275],
    ],
  },
];

const createCustomMarker = (color: string, label: string) => {
  return L.divIcon({
    className: "custom-road-marker",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        background: ${color};
        color: white;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 12px ${color};
        font-family: monospace;
        font-size: 11px;
        font-weight: bold;
      ">
        ${label}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

export default function TerrainRoadAnalysisInnerMap({
  targetLat = 13.0544,
  targetLng = 80.2818,
  tileProvider = "osm",
  onSelectRoad,
}: {
  targetLat?: number;
  targetLng?: number;
  tileProvider?: "osm" | "esri_topo" | "esri_dark";
  onSelectRoad?: (road: RoadSegment) => void;
}) {
  const [activeRoad, setActiveRoad] = useState<RoadSegment | null>(ROAD_SEGMENTS[0]);

  // Tile layer URL selector
  const getTileUrl = () => {
    switch (tileProvider) {
      case "osm":
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      case "esri_topo":
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
      case "esri_dark":
      default:
        return "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
    }
  };

  const getRoadColor = (status: RoadSegment["status"]) => {
    switch (status) {
      case "submerged":
        return "#EF4444"; // Red
      case "clear":
        return "#10B981"; // Emerald
      case "debris":
        return "#F59E0B"; // Amber
      default:
        return "#3B82F6";
    }
  };

  return (
    <div className="relative w-full h-[380px] rounded-xl overflow-hidden border border-white/[0.08]">
      <MapContainer
        center={[targetLat, targetLng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#0B1120" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; Esri'
          url={getTileUrl()}
          maxZoom={18}
        />

        {/* Hazard Incident Epicenter */}
        <Marker
          position={[targetLat, targetLng]}
          icon={createCustomMarker("#DC2626", "🎯")}
        >
          <Popup className="custom-incident-popup">
            <div className="p-1 text-xs font-sans text-slate-900">
              <strong className="text-red-700">ACTIVE DISPATCH TARGET</strong>
              <p className="text-[11px] text-slate-700 mt-0.5">
                Coords: {targetLat.toFixed(4)}° N, {targetLng.toFixed(4)}° E
              </p>
              <div className="mt-1 px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-mono font-bold">
                Elevation: 1.8m ASL (Coastal Inundation Risk)
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Flash Flood Inundation Perimeter */}
        <Circle
          center={[targetLat, targetLng]}
          radius={1200}
          pathOptions={{
            color: "#EF4444",
            fillColor: "#EF4444",
            fillOpacity: 0.18,
            weight: 2,
            dashArray: "4, 6",
          }}
        />

        {/* Road Segments */}
        {ROAD_SEGMENTS.map((road) => {
          const color = getRoadColor(road.status);
          const isSelected = activeRoad?.id === road.id;

          return (
            <React.Fragment key={road.id}>
              <Polyline
                positions={road.coordinates}
                pathOptions={{
                  color,
                  weight: isSelected ? 8 : 5,
                  opacity: isSelected ? 1.0 : 0.75,
                }}
                eventHandlers={{
                  click: () => {
                    setActiveRoad(road);
                    if (onSelectRoad) onSelectRoad(road);
                  },
                }}
              />
              <Marker
                position={road.coordinates[Math.floor(road.coordinates.length / 2)]}
                icon={createCustomMarker(
                  color,
                  road.status === "submerged" ? "🌊" : road.status === "clear" ? "✓" : "⚠️"
                )}
                eventHandlers={{
                  click: () => {
                    setActiveRoad(road);
                    if (onSelectRoad) onSelectRoad(road);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 text-xs text-slate-900">
                    <div className="font-bold text-slate-900">{road.name}</div>
                    <div className="text-[11px] font-mono mt-1">
                      Status: <span className="font-bold uppercase" style={{ color }}>{road.status}</span>
                    </div>
                    <div className="text-[11px] text-slate-700">Depth: {road.depthMeters}m | Current: {road.flowVelocity}</div>
                    <div className="text-[10px] text-slate-600 mt-1">{road.passableBy}</div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Road Legend Overlay */}
      <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-white/[0.1] text-[11px] font-mono space-y-1.5 shadow-xl pointer-events-none">
        <div className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-wider">
          Road Navigability
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 bg-red-500 rounded-full" />
          <span className="text-red-300">Submerged (&gt;1.0m)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 bg-amber-500 rounded-full" />
          <span className="text-amber-300">Debris / Caution</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 bg-emerald-500 rounded-full" />
          <span className="text-emerald-300">Clear Evac Corridor</span>
        </div>
      </div>
    </div>
  );
}
