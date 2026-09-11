"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: TacticalIndiaMap.tsx
 * ==============================================================================
 * 
 * Command-Console Live India Map for Authority Portal:
 * - Base Map: CartoDB Dark Matter (#12161C base with muted #3A3F47 borders)
 * - Layer 1: NASA FIRMS Satellite Fire Hotspots (Real VIIRS NRT Telemetry)
 * - Layer 2: USGS Earthquake Epicenters (Pulsing Amber/Red sized by magnitude)
 * - Layer 3: Citizen-Reported Zones (Color-coded by Severity with Supabase Realtime)
 * - Hover Tooltips + Interactive Popups + "View details" callback
 * - Small unobtrusive bottom-left legend & top-right "Last Updated" HUD
 * - 5-10 minute debounced polling with silent fault-tolerance
 * - Stage Demo Hook: "Simulate New Report" button inserting live emergency zone
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Popup,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Flame,
  Activity,
  AlertTriangle,
  RefreshCw,
  Eye,
  Radio,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Shield,
  Loader2,
} from "lucide-react";
import type { FireHotspot } from "@/app/api/telemetry/firms/route";
import type { EarthquakeEvent } from "@/app/api/telemetry/earthquakes/route";

export interface TacticalZone {
  id: string;
  name?: string;
  zone?: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  location_lat?: number;
  location_lng?: number;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | string;
  severity_score?: number;
  status?: string;
  needed_resources?: string[];
  created_at?: string;
}

interface TacticalIndiaMapProps {
  initialZones?: TacticalZone[];
  onSelectZone?: (zone: TacticalZone) => void;
  selectedZoneId?: string | null;
  className?: string;
}

export default function TacticalIndiaMap({
  initialZones = [],
  onSelectZone,
  selectedZoneId,
  className = "",
}: TacticalIndiaMapProps) {
  const [mounted, setMounted] = useState(false);
  const [zones, setZones] = useState<TacticalZone[]>(initialZones);
  const [fireHotspots, setFireHotspots] = useState<FireHotspot[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeEvent[]>([]);

  // Telemetry status state
  const [loadingFirms, setLoadingFirms] = useState(false);
  const [loadingUsgs, setLoadingUsgs] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Syncing...");

  // Layer Visibility Toggles
  const [showFires, setShowFires] = useState(true);
  const [showQuakes, setShowQuakes] = useState(true);
  const [showZones, setShowZones] = useState(true);

  // Throttle references to prevent hammering APIs
  const lastFetchFirmsTime = useRef<number>(0);
  const lastFetchUsgsTime = useRef<number>(0);

  // Sync initial zones prop if it changes
  useEffect(() => {
    if (initialZones && initialZones.length > 0) {
      setZones((prev) => {
        // Merge without losing realtime additions
        const existingIds = new Set(prev.map((z) => z.id));
        const newFromProps = initialZones.filter((z) => !existingIds.has(z.id));
        return [...prev, ...newFromProps];
      });
    }
  }, [initialZones]);

  // Client mounting check for Leaflet window/document safety
  useEffect(() => {
    setMounted(true);
    setLastUpdated(
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }) + " IST"
    );
  }, []);

  // ---------------------------------------------------------------------------
  // 1. Fetch NASA FIRMS Hotspots (Debounced & Fail-Silent)
  // ---------------------------------------------------------------------------
  const fetchFirmsHotspots = useCallback(async (force = false) => {
    const now = Date.now();
    // 5-minute debounce interval (300,000ms)
    if (!force && now - lastFetchFirmsTime.current < 4 * 60 * 1000) {
      return;
    }

    setLoadingFirms(true);
    try {
      const res = await fetch("/api/telemetry/firms", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFireHotspots(json.data);
        lastFetchFirmsTime.current = now;
      }
    } catch (err: any) {
      // Per requirements: fail silently on this layer only, log to console
      console.warn(
        "[TacticalMap] NASA FIRMS telemetry layer failed silently:",
        err.message || err
      );
    } finally {
      setLoadingFirms(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Fetch USGS Earthquakes (Debounced & Fail-Silent)
  // ---------------------------------------------------------------------------
  const fetchEarthquakes = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchUsgsTime.current < 4 * 60 * 1000) {
      return;
    }

    setLoadingUsgs(true);
    try {
      const res = await fetch("/api/telemetry/earthquakes", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEarthquakes(json.data);
        lastFetchUsgsTime.current = now;
      }
    } catch (err: any) {
      console.warn(
        "[TacticalMap] USGS earthquake layer failed silently:",
        err.message || err
      );
    } finally {
      setLoadingUsgs(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 3. Fetch Initial Citizen Zones from Database (zones or incidents table)
  // ---------------------------------------------------------------------------
  const fetchCitizenZones = useCallback(async () => {
    if (!isConfigured || !supabase) return;
    try {
      // Attempt to query 'zones' first; fallback to 'incidents'
      let queryRes = await supabase.from("zones").select("*").limit(50);
      if (queryRes.error) {
        queryRes = await supabase
          .from("incidents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
      }

      if (queryRes.data && queryRes.data.length > 0) {
        const mapped: TacticalZone[] = queryRes.data.map((d: any) => {
          const lat = Number(d.location_lat ?? d.latitude) || 13.0827;
          const lng = Number(d.location_lng ?? d.longitude) || 80.2707;
          const score =
            d.severity_score !== undefined ? Number(d.severity_score) : undefined;
          const sev =
            score !== undefined
              ? score >= 8
                ? "CRITICAL"
                : score >= 6
                ? "HIGH"
                : score >= 4
                ? "MODERATE"
                : "LOW"
              : (d.severity?.toUpperCase() as any) || "HIGH";

          return {
            id: d.id?.toString(),
            name: d.name || d.zone || d.type || "Citizen Emergency Zone",
            zone: d.zone || d.name,
            type: d.type || "Hazard Incident",
            description: d.description || "Active citizen reported emergency.",
            latitude: lat,
            longitude: lng,
            location_lat: lat,
            location_lng: lng,
            severity: sev,
            severity_score: score,
            status: d.status || "open",
            needed_resources: d.needed_resources || [],
            created_at: d.created_at || new Date().toISOString(),
          };
        });

        setZones((prev) => {
          const merged = [...mapped];
          // Preserve any locally simulated zones
          prev.forEach((pz) => {
            if (!merged.some((m) => m.id === pz.id)) {
              merged.push(pz);
            }
          });
          return merged;
        });
      }
    } catch (err: any) {
      console.warn("[TacticalMap] Database zones fetch error:", err.message || err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Polling Intervals & Realtime Subscriptions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchFirmsHotspots(true);
    fetchEarthquakes(true);
    fetchCitizenZones();

    // 5-minute poll interval for external live feeds
    const intervalId = setInterval(() => {
      fetchFirmsHotspots(false);
      fetchEarthquakes(false);
      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " IST"
      );
    }, 5 * 60 * 1000);

    // Supabase Realtime listener for incoming citizen reports
    const unsubscribe = subscribeToIncidents((payload) => {
      const newItem = payload.new;
      if (
        newItem &&
        (newItem.location_lat || newItem.latitude) &&
        (newItem.location_lng || newItem.longitude)
      ) {
        const lat = Number(newItem.location_lat ?? newItem.latitude);
        const lng = Number(newItem.location_lng ?? newItem.longitude);
        const score =
          newItem.severity_score !== undefined
            ? Number(newItem.severity_score)
            : undefined;
        const sev =
          score !== undefined
            ? score >= 8
              ? "CRITICAL"
              : score >= 6
              ? "HIGH"
              : score >= 4
              ? "MODERATE"
              : "LOW"
            : (newItem.severity?.toUpperCase() as any) || "HIGH";

        const newZone: TacticalZone = {
          id: newItem.id?.toString() || `zone-${Date.now()}`,
          name: newItem.name || newItem.type || "Live Realtime Report",
          zone: newItem.zone,
          type: newItem.type || "Emergency Report",
          description: newItem.description || "Fresh citizen incident detected.",
          latitude: lat,
          longitude: lng,
          location_lat: lat,
          location_lng: lng,
          severity: sev,
          severity_score: score,
          status: newItem.status || "open",
          needed_resources: newItem.needed_resources || [],
          created_at: newItem.created_at || new Date().toISOString(),
        };

        setZones((prev) => [newZone, ...prev.filter((z) => z.id !== newZone.id)]);
        toast.error(`REALTIME SOS // ${newZone.name}`, {
          description: `Severity: ${newZone.severity} (Score: ${newZone.severity_score || 8}/10). Added to Tactical Map.`,
        });
      }
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [fetchFirmsHotspots, fetchEarthquakes, fetchCitizenZones]);

  // ---------------------------------------------------------------------------
  // 4. Stage Demo Hook: "Simulate New Report"
  // ---------------------------------------------------------------------------
  const handleSimulateNewReport = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/demo/simulate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success && data.report) {
        const rep = data.report;
        const simulatedZone: TacticalZone = {
          id: rep.id,
          name: rep.zone || rep.type,
          zone: rep.zone,
          type: rep.type,
          description: rep.description,
          latitude: rep.latitude,
          longitude: rep.longitude,
          severity: rep.severity,
          severity_score: rep.severity_score,
          status: "open",
          needed_resources: rep.needed_resources || [],
          created_at: rep.created_at,
        };

        setZones((prev) => [simulatedZone, ...prev]);
        toast.success("Demo Report Dispatched to Live Map", {
          description: `${simulatedZone.name} injected into tactical grid with instant reallocation.`,
        });

        if (onSelectZone) {
          onSelectZone(simulatedZone);
        }
      } else {
        toast.error("Simulation failed", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Network error simulating report", {
        description: err.message,
      });
    } finally {
      setSimulating(false);
      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) + " IST"
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Custom Tactical Marker Icons
  // ---------------------------------------------------------------------------
  const createCitizenZoneIcon = useMemo(
    () => (severity: string, isSelected: boolean) => {
      const isCrit = severity === "CRITICAL";
      const isHigh = severity === "HIGH";
      const color = isCrit ? "#791F1F" : isHigh ? "#854F0B" : "#3B6D11";
      const glow = isCrit
        ? "0 0 10px rgba(121, 31, 31, 0.8)"
        : isHigh
        ? "0 0 8px rgba(133, 79, 11, 0.7)"
        : "0 0 6px rgba(59, 109, 17, 0.7)";

      const pulseRing = isCrit
        ? `<div style="position: absolute; inset: -5px; border-radius: 4px; border: 1.5px solid #791F1F; animation: tacticalPulse 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
        : "";

      const selectionHalo = isSelected
        ? `<div style="position: absolute; inset: -8px; border-radius: 6px; border: 2px dashed #F6F4EF; animation: spin 8s linear infinite;"></div>`
        : "";

      return L.divIcon({
        className: "custom-tactical-zone-pin",
        html: `
        <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${pulseRing}
          ${selectionHalo}
          <div style="width: 14px; height: 14px; background: ${color}; border: 1.5px solid #F6F4EF; transform: rotate(45deg); box-shadow: ${glow}; display: flex; align-items: center; justify-content: center;">
            <div style="width: 4px; height: 4px; background: #12161C; border-radius: 50%;"></div>
          </div>
        </div>
      `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -12],
      });
    },
    []
  );

  const createFireMarkerIcon = useMemo(
    () => (frp: number) => {
      const size = Math.min(18, Math.max(9, Math.round(frp * 1.5)));
      return L.divIcon({
        className: "firms-fire-pin",
        html: `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: 0; border-radius: 50%; background: #EA580C; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: ${Math.max(
            6,
            size - 4
          )}px; height: ${Math.max(
          6,
          size - 4
        )}px; border-radius: 50%; background: #FF5722; border: 1px solid #FFAB91; box-shadow: 0 0 6px #FF5722;"></div>
        </div>
      `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });
    },
    []
  );

  if (!mounted) {
    return (
      <div className={`h-[500px] w-full border border-[#222933] bg-[#12161C] rounded-sm p-6 flex flex-col justify-between ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-48 bg-[#181E26] animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-[#181E26] animate-pulse rounded" />
            <div className="h-5 w-16 bg-[#181E26] animate-pulse rounded" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Loader2 className="h-6 w-6 text-[#8A99AD] animate-spin" strokeWidth={1.75} />
          <p className="text-xs font-mono uppercase tracking-wider text-[#8A99AD]">
            Initializing India Geospatial Tactical Grid...
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-[#222933]">
          <div className="h-3 w-32 bg-[#181E26] animate-pulse rounded" />
          <div className="h-3 w-24 bg-[#181E26] animate-pulse rounded" />
        </div>
      </div>
    );
  }

  // India national view center coordinates
  const indiaCenter: [number, number] = [22.5937, 78.9629];

  return (
    <div className={`border border-[#222933] bg-[#181E26] rounded-sm flex flex-col overflow-hidden relative ${className}`}>
      {/* --------------------------------------------------------------------- */}
      {/* Top Map HUD Bar: Status, Layer Counters & Actions                      */}
      {/* --------------------------------------------------------------------- */}
      <div className="p-3 border-b border-[#222933] bg-[#141920] flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B6D11] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B6D11]"></span>
            </span>
            <span className="font-ibm-mono text-[11px] font-bold tracking-widest uppercase text-[#F6F4EF]">
              INDIA TACTICAL GIS // LIVE
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-ibm-mono text-[#8A99AD] border-l border-[#222933] pl-3">
            <Clock className="w-3 h-3" strokeWidth={1.75} />
            <span>SYNC: {lastUpdated}</span>
          </div>
        </div>

        {/* Layer Filters & Demo Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Layer Toggle: Citizen Zones */}
          <button
            type="button"
            onClick={() => setShowZones((p) => !p)}
            className={`px-2 py-1 text-[10px] font-ibm-mono rounded transition-colors flex items-center gap-1.5 border ${
              showZones
                ? "bg-[#181E26] border-[#791F1F] text-[#F6F4EF]"
                : "bg-transparent border-[#222933] text-[#8A99AD] opacity-60"
            }`}
            title="Toggle Citizen Emergency Zones"
          >
            <span className="w-2 h-2 rotate-45 bg-[#791F1F] inline-block" />
            <span>Zones ({zones.length})</span>
          </button>

          {/* Layer Toggle: NASA FIRMS */}
          <button
            type="button"
            onClick={() => setShowFires((p) => !p)}
            className={`px-2 py-1 text-[10px] font-ibm-mono rounded transition-colors flex items-center gap-1.5 border ${
              showFires
                ? "bg-[#181E26] border-[#EA580C] text-[#F6F4EF]"
                : "bg-transparent border-[#222933] text-[#8A99AD] opacity-60"
            }`}
            title="Toggle NASA FIRMS Fire Hotspots"
          >
            <Flame className="w-3 h-3 text-[#FF5722]" strokeWidth={2} />
            <span>
              Fires ({fireHotspots.length})
              {loadingFirms && <Loader2 className="w-2.5 h-2.5 animate-spin ml-0.5 inline" />}
            </span>
          </button>

          {/* Layer Toggle: USGS Earthquakes */}
          <button
            type="button"
            onClick={() => setShowQuakes((p) => !p)}
            className={`px-2 py-1 text-[10px] font-ibm-mono rounded transition-colors flex items-center gap-1.5 border ${
              showQuakes
                ? "bg-[#181E26] border-[#D97706] text-[#F6F4EF]"
                : "bg-transparent border-[#222933] text-[#8A99AD] opacity-60"
            }`}
            title="Toggle USGS Earthquakes"
          >
            <Activity className="w-3 h-3 text-[#D97706]" strokeWidth={2} />
            <span>
              Quakes ({earthquakes.length})
              {loadingUsgs && <Loader2 className="w-2.5 h-2.5 animate-spin ml-0.5 inline" />}
            </span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => {
              fetchFirmsHotspots(true);
              fetchEarthquakes(true);
              fetchCitizenZones();
              setLastUpdated(
                new Date().toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: true,
                }) + " IST"
              );
              toast.info("Geospatial Telemetry Re-synced");
            }}
            className="p-1 text-[#8A99AD] hover:text-[#F6F4EF] hover:bg-[#222933] rounded transition"
            title="Force refresh all telemetry layers"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingFirms || loadingUsgs ? "animate-spin text-[#F6F4EF]" : ""
              }`}
              strokeWidth={1.75}
            />
          </button>

          {/* STAGE DEMO HOOK: Simulate New Report */}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSimulateNewReport}
            disabled={simulating}
            className="h-7 px-2.5 text-[10px] font-ibm-mono uppercase tracking-wider font-bold bg-[#791F1F] hover:bg-[#942626] border border-[#A83232] text-white flex items-center gap-1 shadow-sm"
          >
            {simulating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" strokeWidth={2} />
                <span>Simulate New Report</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Main Map Container: Leaflet with CartoDB Dark Matter                   */}
      {/* --------------------------------------------------------------------- */}
      <div className="h-[490px] w-full relative bg-[#12161C]">
        <MapContainer
          center={indiaCenter}
          zoom={5}
          minZoom={4}
          maxZoom={14}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", background: "#12161C" }}
          className="z-0"
        >
          {/* Esri World Dark Gray Base: crisp, high-tech tactical map without watermarks */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />

          {/* ----------------------------------------------------------------- */}
          {/* LAYER 1: NASA FIRMS Satellite Fire Hotspots                       */}
          {/* ----------------------------------------------------------------- */}
          {showFires &&
            fireHotspots.map((hotspot) => (
              <Marker
                key={hotspot.id}
                position={[hotspot.latitude, hotspot.longitude]}
                icon={createFireMarkerIcon(hotspot.frp_mw)}
              >
                {/* Lightweight hover tooltip */}
                <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                  <div className="flex items-center gap-1 font-mono text-[10px]">
                    <Flame className="w-3 h-3 text-[#FF5722]" />
                    <span>
                      FIRMS Thermal Hotspot • {hotspot.acq_time} UTC • FRP:{" "}
                      {hotspot.frp_mw}MW
                    </span>
                  </div>
                </Tooltip>

                {/* Click popup */}
                <Popup>
                  <div className="p-2.5 space-y-2 text-xs font-ibm-sans min-w-[220px] max-w-[260px] bg-[#181E26] text-[#F6F4EF]">
                    <div className="flex items-center justify-between border-b border-[#222933] pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-[#FF5722]" strokeWidth={2} />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FFAB91]">
                          NASA FIRMS HOTSPOT
                        </span>
                      </div>
                      <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-[#2A1E1E] text-[#FF7043] border border-[#791F1F]">
                        {hotspot.confidence.toUpperCase()} CONF
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#8A99AD]">Radiative Power:</span>
                        <span className="font-mono font-bold text-[#F6F4EF]">
                          {hotspot.frp_mw} MW
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8A99AD]">Brightness Temp:</span>
                        <span className="font-mono text-[#F6F4EF]">
                          {hotspot.brightness_kelvin} K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8A99AD]">Sensor / Orbit:</span>
                        <span className="font-mono text-[#F6F4EF]">
                          {hotspot.satellite} ({hotspot.daynight})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8A99AD]">Acquisition:</span>
                        <span className="font-mono text-[#F6F4EF]">
                          {hotspot.acq_date} {hotspot.acq_time} UTC
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-[#222933] pt-1 text-[10px] text-[#8A99AD]">
                        <span>Coordinates:</span>
                        <span className="font-mono">
                          {hotspot.latitude.toFixed(4)}, {hotspot.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ----------------------------------------------------------------- */}
          {/* LAYER 2: USGS Earthquake Epicenters                               */}
          {/* ----------------------------------------------------------------- */}
          {showQuakes &&
            earthquakes.map((eq) => {
              const isMajor = eq.magnitude >= 4.5;
              const circleColor = isMajor ? "#EF4444" : "#F59E0B";
              const radius = Math.max(7, Math.min(22, (eq.magnitude - 2) * 5));

              return (
                <CircleMarker
                  key={eq.id}
                  center={[eq.latitude, eq.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: circleColor,
                    fillColor: circleColor,
                    fillOpacity: 0.35,
                    weight: isMajor ? 2.5 : 1.5,
                  }}
                >
                  {/* Lightweight hover tooltip */}
                  <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <Activity className="w-3 h-3 text-[#F59E0B]" />
                      <span>
                        USGS Earthquake M{eq.magnitude.toFixed(1)} • {eq.time_formatted}
                      </span>
                    </div>
                  </Tooltip>

                  {/* Click popup */}
                  <Popup>
                    <div className="p-2.5 space-y-2 text-xs font-ibm-sans min-w-[220px] max-w-[260px] bg-[#181E26] text-[#F6F4EF]">
                      <div className="flex items-center justify-between border-b border-[#222933] pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#F59E0B]" strokeWidth={2} />
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FCD34D]">
                            USGS SEISMIC EVENT
                          </span>
                        </div>
                        <span
                          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            isMajor
                              ? "bg-[#791F1F] border-[#A83232] text-white"
                              : "bg-[#854F0B] border-[#B26B10] text-white"
                          }`}
                        >
                          M {eq.magnitude.toFixed(1)}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <p className="font-semibold text-[#F6F4EF] leading-snug">
                          {eq.place}
                        </p>
                        <div className="flex justify-between text-[#8A99AD] pt-1">
                          <span>Focal Depth:</span>
                          <span className="font-mono text-[#F6F4EF]">
                            {eq.depth_km} km
                          </span>
                        </div>
                        <div className="flex justify-between text-[#8A99AD]">
                          <span>Detection Time:</span>
                          <span className="font-mono text-[#F6F4EF]">
                            {eq.time_formatted}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-[#222933] pt-1 text-[10px] text-[#8A99AD]">
                          <span>Epicenter:</span>
                          <span className="font-mono">
                            {eq.latitude.toFixed(4)}, {eq.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      {eq.url && (
                        <div className="pt-1.5 border-t border-[#222933]">
                          <a
                            href={eq.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-[#38BDF8] hover:underline font-mono"
                          >
                            <span>USGS Detail Page</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* ----------------------------------------------------------------- */}
          {/* LAYER 3: Citizen-Reported Emergency Zones                         */}
          {/* ----------------------------------------------------------------- */}
          {showZones &&
            zones.map((zone) => {
              const lat = zone.location_lat ?? zone.latitude ?? 13.0827;
              const lng = zone.location_lng ?? zone.longitude ?? 80.2707;
              const sev = (zone.severity || "HIGH").toUpperCase();
              const isSelected = selectedZoneId === zone.id;

              return (
                <Marker
                  key={zone.id}
                  position={[lat, lng]}
                  icon={createCitizenZoneIcon(sev, isSelected)}
                >
                  {/* Lightweight hover tooltip */}
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div className="font-mono text-[10px]">
                      <span className="font-bold text-[#F6F4EF]">
                        {zone.name || zone.type}
                      </span>{" "}
                      •{" "}
                      <span
                        className={
                          sev === "CRITICAL"
                            ? "text-[#F87171]"
                            : sev === "HIGH"
                            ? "text-[#FBBF24]"
                            : "text-[#4ADE80]"
                        }
                      >
                        {sev}
                        {zone.severity_score !== undefined ? ` (${zone.severity_score}/10)` : ""}
                      </span>
                    </div>
                  </Tooltip>

                  {/* Click popup with "View details" button */}
                  <Popup>
                    <div className="p-2.5 space-y-2 text-xs font-ibm-sans min-w-[240px] max-w-[290px] bg-[#181E26] text-[#F6F4EF]">
                      <div className="flex items-center justify-between border-b border-[#222933] pb-1.5">
                        <span className="font-bold text-[#F6F4EF] truncate pr-2">
                          {zone.name || zone.zone || zone.type}
                        </span>
                        <span
                          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            sev === "CRITICAL"
                              ? "bg-[#791F1F] border-[#A83232] text-white"
                              : sev === "HIGH"
                              ? "bg-[#854F0B] border-[#B26B10] text-white"
                              : "bg-[#3B6D11] border-[#559E18] text-white"
                          }`}
                        >
                          {zone.severity_score !== undefined
                            ? `SCORE ${zone.severity_score}/10`
                            : sev}
                        </span>
                      </div>

                      <p className="text-[#8A99AD] text-[11px] leading-relaxed line-clamp-3">
                        {zone.description}
                      </p>

                      {zone.needed_resources && zone.needed_resources.length > 0 && (
                        <div className="space-y-1 border-t border-[#222933] pt-1.5">
                          <span className="text-[10px] font-mono text-[#8A99AD] uppercase block">
                            Requested Resources:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {zone.needed_resources.slice(0, 4).map((r, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#222933] text-[#F6F4EF]"
                              >
                                {r.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-[#222933] pt-2 mt-1 text-[10px]">
                        <span className="font-mono text-[#8A99AD]">
                          GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                        </span>

                        {/* VIEW DETAILS LINK */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectZone) {
                              onSelectZone(zone);
                            }
                          }}
                          className="font-ibm-mono font-bold text-[#38BDF8] hover:text-white flex items-center gap-1 hover:underline transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* ------------------------------------------------------------------- */}
        {/* Bottom-Left Unobtrusive Command Legend                              */}
        {/* ------------------------------------------------------------------- */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-[#12161C]/90 backdrop-blur-md border border-[#222933] rounded-sm p-2.5 text-[10px] font-ibm-mono text-[#8A99AD] shadow-xl space-y-1.5 max-w-[210px]">
          <div className="font-bold uppercase tracking-wider text-[#F6F4EF] pb-1 border-b border-[#222933] flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#8A99AD]" />
            <span>Telemetry Legend</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5722] border border-[#FFAB91] inline-block shadow-sm" />
              <span className="text-[#F6F4EF]">NASA FIRMS Fire Hotspots</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#D97706] bg-[#D97706]/40 inline-block" />
              <span className="text-[#F6F4EF]">USGS Seismic Tremors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rotate-45 bg-[#791F1F] border border-white inline-block" />
              <span className="text-[#F6F4EF]">Critical Zone (&ge;8/10)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rotate-45 bg-[#854F0B] border border-white inline-block" />
              <span className="text-[#F6F4EF]">High / Watch Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rotate-45 bg-[#3B6D11] border border-white inline-block" />
              <span className="text-[#F6F4EF]">Safe / Managed Haven</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
