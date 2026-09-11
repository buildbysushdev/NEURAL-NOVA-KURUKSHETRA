"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: AlertMap.tsx (Live Leaflet Alerts Map with Severity Pins)
 * ==============================================================================
 * 
 * Responsibilities:
 * 1. Loads React Leaflet dynamically on the client side with { ssr: false }
 * 2. Fetches active incidents from Supabase 'incidents' table
 * 3. Shows Red Pins / pulsating markers for High and Critical severity incidents
 * 4. Interactive Popups displaying hazard type, severity, description, and coordinates
 */

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, AlertTriangle, Layers, Loader2, ShieldCheck, LifeBuoy } from "lucide-react";
import type { MapIncident } from "./LeafletMapInner";

// Dynamically import LeafletMapInner strictly on the client side to avoid SSR errors
const DynamicLeafletMap = dynamic(() => import("./LeafletMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center bg-slate-950 rounded-lg text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
      <span className="text-xs font-mono">Rendering Geospatial Tile Engine...</span>
    </div>
  )
});

// Default fallback incidents for visual feedback and offline testing aligned with Chennai Backend Contract (Zones A-E)
const FALLBACK_INCIDENTS: MapIncident[] = [
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d901",
    type: "structural_collapse",
    description: "Port warehouse roof collapsed after torrential rainfall; multiple workers trapped. [Zone A - North Harbor]",
    location_lat: 13.1025,
    location_lng: 80.2985,
    latitude: 13.1025,
    longitude: 80.2985,
    severity: "CRITICAL",
    severity_score: 9,
    status: "open",
    needed_resources: ["medical", "tent", "boats"]
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d902",
    type: "flood",
    description: "Storm surge breached coastal seawall along Marina Beach. [Zone B - Marina Waterfront]",
    location_lat: 13.0544,
    location_lng: 80.2818,
    latitude: 13.0544,
    longitude: 80.2818,
    severity: "CRITICAL",
    severity_score: 8,
    status: "open",
    needed_resources: ["boats", "water"]
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d903",
    type: "fire",
    description: "Electrical substation explosion following floodwater infiltration near hospital. [Zone C - Central Metro Corridor]",
    location_lat: 13.0827,
    location_lng: 80.2707,
    latitude: 13.0827,
    longitude: 80.2707,
    severity: "CRITICAL",
    severity_score: 9,
    status: "open",
    needed_resources: ["medical", "water"]
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d904",
    type: "chemical_spill",
    description: "Industrial chlorine storage tank valve ruptured. [Zone D - Industrial South Sector]",
    location_lat: 12.9815,
    location_lng: 80.2180,
    latitude: 12.9815,
    longitude: 80.2180,
    severity: "HIGH",
    severity_score: 7,
    status: "open",
    needed_resources: ["medical", "tent"]
  },
  {
    id: "SHELTER-01",
    type: "Designated Safe Relief Shelter",
    description: "Chennai Central Station Emergency Relief Shelter. Food, potable water & medical post active.",
    location_lat: 13.0833,
    location_lng: 80.2750,
    latitude: 13.0833,
    longitude: 80.2750,
    severity: "LOW",
    severity_score: 1,
    status: "Safe Haven",
    needed_resources: []
  }
];

export type { MapIncident };

export default function AlertMap({
  userLocation,
  externalIncidents
}: {
  userLocation?: [number, number];
  externalIncidents?: MapIncident[];
}) {
  const [incidents, setIncidents] = useState<MapIncident[]>(FALLBACK_INCIDENTS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchIncidents() {
      if (isConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from("incidents")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

          if (!error && data && data.length > 0) {
            const mapped: MapIncident[] = data.map((item: any) => {
              const lat = Number(item.location_lat ?? item.latitude) || 13.0827;
              const lng = Number(item.location_lng ?? item.longitude) || 80.2707;
              const score = item.severity_score !== undefined ? Number(item.severity_score) : undefined;
              const sev = score !== undefined
                ? score >= 8 ? "CRITICAL" : score >= 6 ? "HIGH" : score >= 4 ? "MODERATE" : "LOW"
                : item.severity || "HIGH";

              return {
                id: item.id || `INC-${Math.random()}`,
                type: item.type || "General Alert",
                description: item.description || "Field incident",
                location_lat: lat,
                location_lng: lng,
                latitude: lat,
                longitude: lng,
                severity: sev,
                severity_score: score,
                status: item.status || "open",
                needed_resources: item.needed_resources || []
              };
            });
            setIncidents(mapped);
          }
        } catch (err) {
          console.warn("Could not fetch remote incidents from Supabase:", err);
        }
      }
      setLoading(false);
    }

    fetchIncidents();
  }, []);

  const allIncidents = externalIncidents && externalIncidents.length > 0
    ? [...externalIncidents, ...incidents]
    : incidents;

  const mapCenter: [number, number] = userLocation || [12.9716, 77.5946];

  const highSeverityCount = allIncidents.filter(
    (i) => i.severity === "CRITICAL" || i.severity === "HIGH"
  ).length;

  return (
    <Card className="border-slate-800 bg-slate-900/95 shadow-xl flex flex-col h-full">
      <CardHeader className="p-4 border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <Map className="h-4 w-4 text-blue-400" />
            Live Sector Alerts Map
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Real-time geospatial hazard map with Red Pins for critical severity
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="font-mono text-[10px] hidden sm:flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
            {highSeverityCount} High Threat Pins
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-3 flex-1 min-h-[380px] relative">
        <div className="w-full h-full min-h-[360px] rounded-lg overflow-hidden border border-slate-800 relative">
          <DynamicLeafletMap incidents={allIncidents} center={mapCenter} />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-2 left-2 z-[400] bg-slate-950/90 border border-slate-800 px-2.5 py-1.5 rounded-md text-[10px] font-mono text-slate-300 shadow-md flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Critical/High
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Safe Haven
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
