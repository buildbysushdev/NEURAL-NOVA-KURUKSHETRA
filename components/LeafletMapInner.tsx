"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * LeafletMapInner.tsx (Client-Only Leaflet Map Component)
 * ==============================================================================
 * 
 * Leaflet strictly requires window and document, so this component is loaded
 * exclusively on the browser client via dynamic(..., { ssr: false }).
 * Correlated with the official Backend Contract (location_lat, location_lng, severity_score).
 */

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

export interface MapIncident {
  id: string;
  type: string;
  description: string;
  latitude?: number;
  longitude?: number;
  location_lat?: number;
  location_lng?: number;
  severity?: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | string;
  severity_score?: number; // 0 to 10
  status?: string;
  zone?: string;
  needed_resources?: string[];
  created_at?: string;
}

export default function LeafletMapInner({
  incidents,
  center = [13.0827, 80.2707] // Chennai Operations Center default
}: {
  incidents: MapIncident[];
  center?: [number, number];
}) {
  // Helper to extract latitude & longitude according to backend contract
  const getLat = (inc: MapIncident) => inc.location_lat ?? inc.latitude ?? 13.0827;
  const getLng = (inc: MapIncident) => inc.location_lng ?? inc.longitude ?? 80.2707;

  // Helper to derive severity level (CRITICAL, HIGH, MODERATE, LOW)
  const getSeverity = (inc: MapIncident): string => {
    if (typeof inc.severity_score === "number") {
      if (inc.severity_score >= 8) return "CRITICAL";
      if (inc.severity_score >= 6) return "HIGH";
      if (inc.severity_score >= 4) return "MODERATE";
      return "LOW";
    }
    return (inc.severity || "HIGH").toUpperCase();
  };

  // Create custom pulsing SVG marker icons based on severity
  const createPinIcon = (severity: string) => {
    const isCritical = severity === "CRITICAL" || severity === "HIGH";
    const color = isCritical ? "#EF4444" : severity === "MODERATE" ? "#F59E0B" : "#10B981";
    const ringColor = isCritical ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.3)";

    return L.divIcon({
      className: "custom-leaflet-pin",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: ${ringColor}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: ${color}; border: 2.5px solid #0F172A; box-shadow: 0 0 8px ${color};"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  };

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", minHeight: "360px", background: "#0F172A" }}
      className="z-0 rounded-lg"
    >
      {/* Crisp Dark Tactical TileLayer without watermarks */}
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />

      {/* Safety perimeter ring around current area */}
      <Circle
        center={center}
        radius={3500}
        pathOptions={{
          color: "#3B82F6",
          fillColor: "#3B82F6",
          fillOpacity: 0.07,
          dashArray: "4, 6"
        }}
      />

      {/* Incident Markers */}
      {incidents.map((incident) => {
        const lat = getLat(incident);
        const lng = getLng(incident);
        const sev = getSeverity(incident);

        return (
          <Marker
            key={incident.id}
            position={[lat, lng]}
            icon={createPinIcon(sev)}
          >
            <Popup className="custom-incident-popup">
              <div className="p-1 space-y-1 text-xs font-sans text-slate-900 min-w-[200px]">
                <div className="flex items-center justify-between gap-1 border-b pb-1">
                  <span className="font-bold text-slate-900">{incident.zone || incident.type}</span>
                  <span
                    className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded text-white ${
                      sev === "CRITICAL"
                        ? "bg-red-600"
                        : sev === "HIGH"
                        ? "bg-amber-600"
                        : "bg-emerald-600"
                    }`}
                  >
                    {incident.severity_score !== undefined
                      ? `SCORE: ${incident.severity_score}/10`
                      : sev}
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-tight pt-0.5">
                  {incident.description}
                </p>
                {incident.needed_resources && incident.needed_resources.length > 0 && (
                  <div className="text-[10px] text-blue-700 font-semibold pt-1">
                    Needed: {incident.needed_resources.join(", ")}
                  </div>
                )}
                <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                  GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
