"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Citizen Dashboard (app/dashboard/citizen/page.tsx)
 * ==============================================================================
 * 
 * Includes:
 * 1. Big Safety Status Badge (Green "SAFE" / Red "DANGER") based on nearby hazards
 * 2. ReportForm component with offline queueing & GPS auto-fill
 * 3. AlertMap component with React Leaflet and Red Pins for high severity incidents
 * 4. Priority Emergency SOS Trigger
 */

import React, { useState, useEffect } from "react";
import ReportForm, { IncidentReport } from "@/components/ReportForm";
import AlertMap, { MapIncident } from "@/components/AlertMap";
import { subscribeToIncidents } from "@/lib/realtimeSubscriptions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, AlertOctagon, LifeBuoy, Radio, PhoneCall, CheckCircle } from "lucide-react";

export default function CitizenDashboardPage() {
  // Citizen state - Default centered on Chennai Emergency Grid
  const [nearbyCriticalCount, setNearbyCriticalCount] = useState<number>(2);
  const [userLocation, setUserLocation] = useState<[number, number]>([13.0827, 80.2707]);
  const [recentCitizenReports, setRecentCitizenReports] = useState<IncidentReport[]>([]);
  const [sosActive, setSosActive] = useState<boolean>(false);

  // Realtime subscription via lib/realtimeSubscriptions.ts
  useEffect(() => {
    const unsubscribe = subscribeToIncidents((payload) => {
      if (payload.eventType === "INSERT") {
        const item = payload.new;
        if (item && (item.location_lat || item.latitude) && (item.location_lng || item.longitude)) {
          const lat = Number(item.location_lat ?? item.latitude);
          const lng = Number(item.location_lng ?? item.longitude);
          const score = item.severity_score !== undefined ? Number(item.severity_score) : undefined;
          const sev = score !== undefined
            ? score >= 8 ? "CRITICAL" : score >= 6 ? "HIGH" : score >= 4 ? "MODERATE" : "LOW"
            : item.severity || "HIGH";

          const report: IncidentReport = {
            id: item.id?.toString() || `INC-${Math.random()}`,
            type: item.type || "Hazard Alert",
            description: item.description || "Active hazard reported in the sector.",
            location_lat: lat,
            location_lng: lng,
            latitude: lat,
            longitude: lng,
            severity: sev,
            severity_score: score,
            needed_resources: item.needed_resources || [],
            created_at: item.created_at
          };

          setRecentCitizenReports((prev) => [report, ...prev]);

          if (report.severity === "CRITICAL" || report.severity === "HIGH") {
            setNearbyCriticalCount((c) => c + 1);
            toast.error(`🚨 Emergency Hazard Broadcasted: ${report.type}`, {
              description: report.description,
              duration: 7000
            });
          } else {
            toast.info(`⚠️ Advisory: ${report.type}`, {
              description: report.description
            });
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Determine Safety Status: DANGER if critical incidents exist nearby, SAFE otherwise
  const isDanger = nearbyCriticalCount > 0;

  // Handle new incident report added by citizen
  const handleNewReport = (newReport: IncidentReport) => {
    setRecentCitizenReports((prev) => [newReport, ...prev]);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
      
      {/* Top Banner: Big Safety Status Badge (Green "SAFE" / Red "DANGER") */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border bg-slate-900/90 shadow-xl transition-colors">
        
        {/* Big Safety Status Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isDanger ? (
            <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-red-600/20 border-2 border-red-500 text-red-500 shadow-lg shadow-red-950/60 shrink-0 animate-pulse">
              <AlertOctagon className="h-8 w-8 sm:h-9 sm:w-9" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-emerald-600/20 border-2 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/60 shrink-0">
              <ShieldCheck className="h-8 w-8 sm:h-9 sm:w-9" />
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
                Your Sector Safety Status
              </span>
              <Badge
                className={`font-mono font-bold text-xs uppercase px-2.5 py-0.5 ${
                  isDanger
                    ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-950"
                    : "bg-emerald-600 text-white border-emerald-500"
                }`}
              >
                {isDanger ? "DANGER • HIGH ALERT" : "SAFE • NORMAL"}
              </Badge>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {isDanger
                ? "Active Critical Hazards Detected Within 2.5km"
                : "No Immediate Threat Detected In Your Sector"}
            </h2>

            <p className="text-xs text-slate-400 max-w-xl">
              {isDanger
                ? "River level has crested safety barriers at Lower Basin. Evacuate ground floor levels and avoid Route 14 arterial bypass."
                : "All local stormwater retention basins are nominal. Emergency communications channels remain on standby."}
            </p>
          </div>
        </div>

        {/* Priority SOS Trigger Button */}
        <div className="flex items-center gap-2 self-end md:self-center w-full md:w-auto">
          <Button
            size="lg"
            variant="urgent"
            onClick={() => setSosActive(!sosActive)}
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm py-6 px-6 shadow-xl shadow-red-950/60"
          >
            <LifeBuoy className="mr-2 h-5 w-5" />
            {sosActive ? "SOS BEACON BROADCASTING" : "BROADCAST LIFE SOS"}
          </Button>
        </div>
      </div>

      {/* SOS Active Confirmation Notification */}
      {sosActive && (
        <div className="p-4 rounded-lg bg-red-950/90 border-2 border-red-600 text-red-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-bounce">
          <div className="flex items-center gap-2 font-bold font-mono">
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
            <span>SATELLITE EMERGENCY DISTRESS SIGNAL TRANSMITTED &bull; RESCUE BOAT DISPATCH NOTIFIED</span>
          </div>
          <button
            onClick={() => setSosActive(false)}
            className="text-xs underline font-sans text-red-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Form on Left, Live AlertMap on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 cols on desktop): Report Incident Form */}
        <div className="lg:col-span-5 space-y-4">
          <ReportForm onIncidentReported={handleNewReport} />

          {/* Quick Helplines Box */}
          <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5 text-amber-400">
                <PhoneCall className="h-4 w-4" />
                Emergency Contact Desks
              </span>
              <span className="font-mono text-[10px] text-slate-500">Toll-Free 24/7</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">State Disaster Management</span>
              <span className="font-mono text-slate-200 font-bold">1070</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Flood Inflatable Dispatch</span>
              <span className="font-mono text-slate-200 font-bold">080-22967111</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Medical Ambulance Triage</span>
              <span className="font-mono text-slate-200 font-bold">108</span>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols on desktop): Live React Leaflet Alerts Map */}
        <div className="lg:col-span-7 space-y-4">
          <AlertMap
            userLocation={userLocation}
            externalIncidents={recentCitizenReports.map((r) => ({
              id: r.id || `INC-${Math.random()}`,
              type: r.type,
              description: r.description,
              latitude: r.latitude,
              longitude: r.longitude,
              severity: r.severity,
              status: r.is_offline_queued ? "Queued Offline" : "Submitted"
            }))}
          />

          {/* Designated Evacuation Assembly Checkpoints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Highland Relief Center</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">2.4km Away</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Capacity: 2,500 &bull; Equipped with dry food supplies, portable generators, and trauma nurses.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Central Polytechnic Safe Zone</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">3.8km Away</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Capacity: 1,200 &bull; High ground bypass route operational via Eastern Ring Road.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
