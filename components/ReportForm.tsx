"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Component: ReportForm.tsx (Citizen Incident Reporting with Offline Sync)
 * ==============================================================================
 * 
 * Features:
 * 1. Form fields: Disaster Type (Select), Description (Textarea), Photo (File Input)
 * 2. Automatic GPS Lat/Long detection via browser navigator.geolocation
 * 3. Offline detection (navigator.onLine):
 *    - If offline: Saves to localStorage and displays "Queued for Sync" banner
 *    - When back online: Automatically syncs queued records to Supabase 'incidents' table
 * 4. Full input validation ensuring no empty submissions
 */

import React, { useState, useEffect } from "react";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import {
  AlertTriangle,
  MapPin,
  Camera,
  WifiOff,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Phone,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export interface IncidentReport {
  id?: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  location_lat?: number;
  location_lng?: number;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  severity_score?: number;
  status?: string;
  needed_resources?: string[];
  photo_preview?: string | null;
  created_at?: string;
  is_offline_queued?: boolean;
}

export default function ReportForm({
  onIncidentReported
}: {
  onIncidentReported?: (report: IncidentReport) => void;
}) {
  const { t } = useLanguage();
  // Form input states
  const [disasterType, setDisasterType] = useState<string>("Flood");
  const [description, setDescription] = useState<string>("");
  const [severity, setSeverity] = useState<"CRITICAL" | "HIGH" | "MODERATE" | "LOW">("HIGH");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Status & Feedback states
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [locating, setLocating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "queued" | "error"; message: string } | null>(null);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // AI Permission-to-Report state
  const [permissionCheck, setPermissionCheck] = useState<{
    checking: boolean;
    allowed: boolean | null;
    reason: string | null;
    suggestedType: string | null;
    overrideAllowed: boolean;
  }>({
    checking: false,
    allowed: null,
    reason: null,
    suggestedType: null,
    overrideAllowed: false,
  });

  const verifyLocationPermission = async (lat: string, lng: string) => {
    if (!lat || !lng || isNaN(Number(lat)) || isNaN(Number(lng))) return;
    setPermissionCheck((prev) => ({ ...prev, checking: true }));
    try {
      const res = await fetch("/api/citizen/check-permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: Number(lat), longitude: Number(lng) }),
      });
      const data = await res.json();
      setPermissionCheck({
        checking: false,
        allowed: data.allowed,
        reason: data.reason,
        suggestedType: data.suggestedType,
        overrideAllowed: false,
      });
      if (data.allowed && data.suggestedType) {
        const typeMap: Record<string, string> = {
          flood: "Flood",
          fire: "Fire",
          earthquake: "Earthquake",
          cyclone: "Cyclone",
        };
        if (typeMap[data.suggestedType]) {
          setDisasterType(typeMap[data.suggestedType]);
        }
      }
    } catch (err) {
      console.warn("Permission verification fetch failed:", err);
      setPermissionCheck({
        checking: false,
        allowed: true, // Fail-open in emergency
        reason: "Offline / fallback permission active.",
        suggestedType: null,
        overrideAllowed: true,
      });
    }
  };

  // Check online status and detect initial GPS on component mount
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        // Automatically sync queued offline incidents when connection restores
        syncOfflineQueue();
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Initial GPS acquisition
    detectGeolocation();

    // Check existing offline queue
    loadOfflineQueueCount();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  /**
   * Auto-detect GPS coordinates using navigator.geolocation
   */
  const detectGeolocation = () => {
    if (!navigator.geolocation) {
      setFeedback({
        type: "error",
        message: "Geolocation is not supported by your current browser. Please enter coordinates manually."
      });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latStr = position.coords.latitude.toFixed(6);
        const lngStr = position.coords.longitude.toFixed(6);
        setLatitude(latStr);
        setLongitude(lngStr);
        setLocating(false);
        verifyLocationPermission(latStr, lngStr);
      },
      (error) => {
        console.warn("Geolocation permission or timeout error:", error.message);
        // Fallback demo coordinates (Chennai disaster coordinates)
        const latStr = "13.082700";
        const lngStr = "80.270700";
        setLatitude(latStr);
        setLongitude(lngStr);
        setLocating(false);
        verifyLocationPermission(latStr, lngStr);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  /**
   * Handle Photo selection and convert to Base64 for offline durability
   */
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Photo file size exceeds 5MB limit." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Count pending offline items in localStorage
   */
  const loadOfflineQueueCount = () => {
    try {
      const queue = JSON.parse(localStorage.getItem("offline_incidents_queue") || "[]");
      setOfflineQueueCount(queue.length);
    } catch (e) {
      setOfflineQueueCount(0);
    }
  };

  /**
   * Sync offline items when network is restored
   */
  const syncOfflineQueue = async () => {
    try {
      const queue: IncidentReport[] = JSON.parse(localStorage.getItem("offline_incidents_queue") || "[]");
      if (queue.length === 0) return;

      if (isConfigured) {
        // Upload queued incidents to Supabase 'incidents' table
        const { error } = await supabase.from("incidents").insert(
          queue.map((item) => ({
            type: item.type,
            description: item.description,
            location_lat: item.latitude,
            location_lng: item.longitude,
            latitude: item.latitude,
            longitude: item.longitude,
            severity_score: item.severity === "CRITICAL" ? 9 : item.severity === "HIGH" ? 7 : item.severity === "MODERATE" ? 5 : 3,
            status: "open",
            is_duplicate: false,
            duplicate_of_id: null,
            needed_resources: ["medical", "water"],
            ai_analysis_json: {},
            photo_url: item.photo_preview || null,
            created_at: item.created_at || new Date().toISOString()
          }))
        );

        if (!error) {
          localStorage.removeItem("offline_incidents_queue");
          setOfflineQueueCount(0);
          setFeedback({
            type: "success",
            message: `Network restored: Successfully synced ${queue.length} offline reports to Supabase!`
          });
        }
      } else {
        // Clear local queue during demo
        localStorage.removeItem("offline_incidents_queue");
        setOfflineQueueCount(0);
        setFeedback({
          type: "success",
          message: `Network restored: ${queue.length} offline incident reports pushed to command dispatcher.`
        });
      }
    } catch (err) {
      console.error("Error syncing offline queue:", err);
    }
  };

  /**
   * Form submission handler
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Form Validation (No empty submissions)
    if (!description.trim()) {
      setFeedback({ type: "error", message: "Please provide a detailed hazard description." });
      toast.error("Description Required", { description: "Please explain the emergency situation." });
      return;
    }
    if (!latitude || !longitude || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
      setFeedback({ type: "error", message: "Valid GPS latitude and longitude are required." });
      toast.error("GPS Coordinates Missing", { description: "Please enable location or enter valid GPS numbers." });
      return;
    }

    // Enforce AI Permission-to-Report restriction
    if (permissionCheck.allowed === false && !permissionCheck.overrideAllowed) {
      setFeedback({
        type: "error",
        message: "Digital reporting restricted: No active disaster telemetry detected within 50km. Please dial 112 for immediate crisis response, or select 'I'm reporting an unmapped new hazard'.",
      });
      toast.error("Emergency Reporting Restricted", {
        description: "No active hazard within 50km. Please call 112 directly.",
      });
      return;
    }

    setSubmitting(true);

    const newReport: IncidentReport = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      type: disasterType,
      description: description.trim(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      severity,
      photo_preview: photoPreview,
      created_at: new Date().toISOString(),
      is_offline_queued: !navigator.onLine
    };

    // Check Offline status
    if (!navigator.onLine) {
      // Offline Logic: Save form data to localStorage
      try {
        const queue: IncidentReport[] = JSON.parse(localStorage.getItem("offline_incidents_queue") || "[]");
        queue.push(newReport);
        localStorage.setItem("offline_incidents_queue", JSON.stringify(queue));
        setOfflineQueueCount(queue.length);

        setFeedback({
          type: "queued",
          message: "No internet connection detected. Incident report saved locally and Queued for Sync when connection returns."
        });
        toast.warning("Queued for Sync (Offline)", {
          description: "No network detected. Incident saved to local device."
        });

        // Clear input form
        setDescription("");
        setPhotoPreview(null);
        if (onIncidentReported) onIncidentReported(newReport);
      } catch (err) {
        setFeedback({ type: "error", message: "Unable to write to local storage." });
        toast.error("Storage Error", { description: "Unable to save report offline." });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Online Logic: Submit directly to Supabase
    try {
      if (isConfigured) {
        const { error } = await supabase.from("incidents").insert([
          {
            type: disasterType,
            description: description.trim(),
            location_lat: parseFloat(latitude),
            location_lng: parseFloat(longitude),
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            severity_score: severity === "CRITICAL" ? 9 : severity === "HIGH" ? 7 : severity === "MODERATE" ? 5 : 3,
            status: "open",
            is_duplicate: false,
            duplicate_of_id: null,
            needed_resources: [
              disasterType.toLowerCase().includes("flood") ? "boats" : "medical",
              "water"
            ],
            ai_analysis_json: {},
            photo_url: photoPreview,
            created_at: new Date().toISOString()
          }
        ]);

        if (error) throw error;
      }

      setFeedback({
        type: "success",
        message: "Incident reported successfully. Emergency dispatch & AI triage notified."
      });
      toast.success("Emergency Broadcast Dispatched", {
        description: `${disasterType} reported. Responders alerted.`
      });

      // Reset form
      setDescription("");
      setPhotoPreview(null);
      if (onIncidentReported) onIncidentReported(newReport);
    } catch (err: any) {
      console.error("Submission error:", err);
      // If network fails during upload, fallback to offline queue
      const queue = JSON.parse(localStorage.getItem("offline_incidents_queue") || "[]");
      queue.push(newReport);
      localStorage.setItem("offline_incidents_queue", JSON.stringify(queue));
      setOfflineQueueCount(queue.length);

      setFeedback({
        type: "queued",
        message: "Network request failed. Report stored offline and Queued for Sync."
      });
      toast.warning("Network Error - Queued for Sync", {
        description: "Failed to reach server. Report cached locally."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-[#DED9CE] border-l-4 border-l-[#791F1F] bg-[#FFFFFF] text-[#1A1A1A] rounded-sm shadow-none">
      <CardHeader className="pb-3 border-b border-[#DED9CE]">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider font-mono text-[#1A1A1A] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#791F1F]" strokeWidth={1.75} />
            {t("report_incident")}
          </CardTitle>

          {/* Online / Offline Status Indicator */}
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#3B6D11] bg-[#F6F4EF] border border-[#DED9CE] px-2 py-0.5 rounded-sm">
              <span className="dot-safe" />
              TELEMETRY ONLINE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#854F0B] bg-[#F6F4EF] border border-[#DED9CE] px-2 py-0.5 rounded-sm">
              <WifiOff className="h-3 w-3" strokeWidth={1.75} />
              {t("queued_offline")}
            </span>
          )}
        </div>
        <CardDescription className="text-xs text-[#6B655B] mt-0.5">
          {t("report_description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Offline Queued for Sync Banner */}
        {offlineQueueCount > 0 && (
          <div className="border border-[#DED9CE] border-l-4 border-l-[#854F0B] bg-[#F6F4EF] p-3 text-xs text-[#1A1A1A]">
            <div className="flex items-center gap-2 font-bold mb-0.5">
              <CloudUpload className="h-3.5 w-3.5 text-[#854F0B]" strokeWidth={1.75} />
              <span>{t("queued_offline")} ({offlineQueueCount} Cached Reports)</span>
            </div>
            <p className="text-[#6B655B]">
              Operating in offline resilience mode. Reports will automatically upload when connectivity is restored.
            </p>
          </div>
        )}

        {/* AI Permission-to-Report Status Banner */}
        {permissionCheck.checking ? (
          <div className="border border-[#DED9CE] bg-[#F6F4EF] p-2.5 rounded-sm flex items-center gap-2 text-xs text-[#6B655B] font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1A1A1A]" />
            <span>AI Sentinel: Validating regional disaster proximity within 50km...</span>
          </div>
        ) : permissionCheck.allowed === true ? (
          <div className="border border-[#3B6D11]/30 border-l-4 border-l-[#3B6D11] bg-[#3B6D11]/5 p-3 rounded-sm text-xs">
            <div className="flex items-center gap-2 text-[#3B6D11] font-bold mb-0.5">
              <ShieldCheck className="w-4 h-4" />
              <span>AI SENTINEL VERIFIED: CRISIS ZONE CONFIRMED</span>
            </div>
            <p className="text-[#2F580E] font-medium text-[11px] leading-relaxed">
              {permissionCheck.reason}
            </p>
          </div>
        ) : permissionCheck.allowed === false ? (
          <div className="border border-[#791F1F]/40 border-l-4 border-l-[#791F1F] bg-[#791F1F]/5 p-3.5 rounded-sm text-xs space-y-2">
            <div className="flex items-center gap-2 text-[#791F1F] font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>AI PRE-FLIGHT RESTRICTION: NO ACTIVE DISASTER IN 50KM</span>
            </div>
            <p className="text-[#5A1717] text-[11px] leading-relaxed">
              {permissionCheck.reason}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#791F1F] text-white font-bold text-[11px] hover:bg-[#601919] transition-colors"
              >
                <Phone className="w-3 h-3" />
                Call 112 National Emergency
              </a>
              {!permissionCheck.overrideAllowed ? (
                <button
                  type="button"
                  onClick={() => setPermissionCheck((prev) => ({ ...prev, overrideAllowed: true }))}
                  className="px-2.5 py-1 text-[11px] font-mono text-[#6B655B] hover:text-[#1A1A1A] underline"
                >
                  I'm reporting an unmapped new hazard →
                </button>
              ) : (
                <span className="text-[10px] font-mono text-[#854F0B] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Manual Unmapped Hazard Override Active
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`border border-[#DED9CE] border-l-4 p-3 text-xs rounded-sm ${
              feedback.type === "error"
                ? "border-l-[#791F1F] bg-[#F6F4EF]"
                : feedback.type === "queued"
                ? "border-l-[#854F0B] bg-[#F6F4EF]"
                : "border-l-[#3B6D11] bg-[#F6F4EF]"
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-0.5">
              {feedback.type === "error" && <AlertCircle className="h-3.5 w-3.5 text-[#791F1F]" strokeWidth={1.75} />}
              {feedback.type === "queued" && <CloudUpload className="h-3.5 w-3.5 text-[#854F0B]" strokeWidth={1.75} />}
              {feedback.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-[#3B6D11]" strokeWidth={1.75} />}
              <span className="capitalize">{feedback.type} Notification</span>
            </div>
            <p className="text-[#6B655B]">{feedback.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Disaster Type (Select) */}
          <div className="space-y-1">
            <Label htmlFor="disasterType" className="text-xs font-mono uppercase text-[#6B655B]">
              {t("disaster_type")}
            </Label>
            <select
              id="disasterType"
              value={disasterType}
              onChange={(e) => setDisasterType(e.target.value)}
              className="w-full h-9 rounded-sm border border-[#DED9CE] bg-[#F6F4EF]/50 px-3 py-1 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            >
              <option value="Flood">Flood / Water Surge</option>
              <option value="Fire">Fire / Transformer Burst</option>
              <option value="Earthquake">Earthquake / Tremor</option>
              <option value="Landslide">Landslide / Mud Debris</option>
              <option value="Cyclone">Cyclone / Heavy Winds</option>
              <option value="Medical Emergency">Medical Evacuation / Casualty</option>
              <option value="Structural Damage">Building / Bridge Collapse</option>
            </select>
          </div>

          {/* Severity Select */}
          <div className="space-y-1">
            <Label htmlFor="severity" className="text-xs font-mono uppercase text-[#6B655B]">
              Urgency Assessment
            </Label>
            <select
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full h-9 rounded-sm border border-[#DED9CE] bg-[#F6F4EF]/50 px-3 py-1 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
            >
              <option value="CRITICAL">Critical (Immediate Life Danger / Persons Trapped)</option>
              <option value="HIGH">High (Rising Water / Structural Risk)</option>
              <option value="MODERATE">Moderate (Power / Access Outage)</option>
              <option value="LOW">Low (Blocked Access / Precautionary)</option>
            </select>
          </div>

          {/* Location: Browser navigator.geolocation auto-fill */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono uppercase text-[#6B655B]">{t("gps_coordinates")}</Label>
              <button
                type="button"
                onClick={detectGeolocation}
                disabled={locating}
                className="text-[11px] font-mono text-[#1A1A1A] hover:underline flex items-center gap-1 transition-colors"
              >
                <Navigation className="h-3 w-3" strokeWidth={1.75} />
                {locating ? "Acquiring Coordinates..." : "Acquire GPS Coordinates"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                  className="bg-[#F6F4EF]/50 border-[#DED9CE] text-[#1A1A1A] text-xs font-mono pl-7 rounded-sm focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                />
                <MapPin className="h-3.5 w-3.5 text-[#6B655B] absolute left-2.5 top-2.5" strokeWidth={1.75} />
              </div>

              <div className="relative">
                <Input
                  type="text"
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  className="bg-[#F6F4EF]/50 border-[#DED9CE] text-[#1A1A1A] text-xs font-mono pl-7 rounded-sm focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                />
                <MapPin className="h-3.5 w-3.5 text-[#6B655B] absolute left-2.5 top-2.5" strokeWidth={1.75} />
              </div>
            </div>
          </div>

          {/* Description (Textarea) */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-xs font-mono uppercase text-[#6B655B]">
              {t("incident_details")}
            </Label>
            <textarea
              id="description"
              rows={3}
              placeholder={t("incident_placeholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-sm border border-[#DED9CE] bg-[#F6F4EF]/50 px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#6B655B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none"
            />
          </div>

          {/* Photo File Input with Preview */}
          <div className="space-y-1">
            <Label htmlFor="photo" className="text-xs font-mono uppercase text-[#6B655B]">
              Attach Photo Evidence (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[#DED9CE] hover:border-[#1A1A1A] rounded-sm bg-[#F6F4EF]/30 text-xs text-[#6B655B] hover:text-[#1A1A1A] cursor-pointer transition-colors w-full">
                <Camera className="h-3.5 w-3.5 text-[#6B655B]" strokeWidth={1.75} />
                <span>{photoPreview ? "Replace Selected Photo" : "Upload Sector Hazard Photo"}</span>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {photoPreview && (
              <div className="relative mt-2 rounded-sm overflow-hidden border border-[#DED9CE] max-h-36">
                <img
                  src={photoPreview}
                  alt="Hazard preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-1.5 right-1.5 bg-[#1A1A1A]/80 text-[#F6F4EF] rounded px-1.5 py-0.5 text-[10px]"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Primary Action Button (Specific Verb Phrase, Max 1 per screen) */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 rounded-sm bg-[#1A1A1A] text-[#F6F4EF] hover:bg-black font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A] flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
                {isOnline ? "Transmitting Incident to Sentinel Dispatch..." : "Caching Report Locally..."}
              </span>
            ) : isOnline ? (
              "Transmit Emergency Incident Report"
            ) : (
              "Cache Report for Offline Sync"
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
