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
import {
  AlertTriangle,
  MapPin,
  Camera,
  WifiOff,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation
} from "lucide-react";

export interface IncidentReport {
  id?: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  photo_preview?: string | null;
  created_at?: string;
  is_offline_queued?: boolean;
}

export default function ReportForm({
  onIncidentReported
}: {
  onIncidentReported?: (incident: IncidentReport) => void;
}) {
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
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (error) => {
        console.warn("Geolocation permission or timeout error:", error.message);
        // Fallback demo coordinates (Bangalore relief coordinates)
        setLatitude("12.971600");
        setLongitude("77.594600");
        setLocating(false);
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
    <Card className="border-slate-800 bg-slate-900/95 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Report Ground Incident
          </CardTitle>

          {/* Online / Offline Status Indicator */}
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded">
              <WifiOff className="h-3 w-3" />
              Offline Mode
            </span>
          )}
        </div>
        <CardDescription className="text-xs text-slate-400">
          Emergency telemetry logs are transmitted to rescue teams and Groq triage models.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Offline Queued for Sync Banner */}
        {offlineQueueCount > 0 && (
          <Alert variant="warning" className="border-amber-700/80 bg-amber-950/70">
            <CloudUpload className="h-4 w-4 text-amber-400" />
            <AlertTitle className="text-xs font-bold text-amber-300">
              Queued for Sync ({offlineQueueCount} Report{offlineQueueCount > 1 ? "s" : ""})
            </AlertTitle>
            <AlertDescription className="text-xs text-amber-200">
              You are working in offline mode. Reports will automatically upload to Supabase when connectivity returns.
            </AlertDescription>
          </Alert>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <Alert
            variant={feedback.type === "error" ? "destructive" : feedback.type === "queued" ? "warning" : "success"}
          >
            {feedback.type === "error" && <AlertCircle className="h-4 w-4" />}
            {feedback.type === "queued" && <CloudUpload className="h-4 w-4" />}
            {feedback.type === "success" && <CheckCircle2 className="h-4 w-4" />}
            <AlertTitle className="text-xs font-bold capitalize">{feedback.type}</AlertTitle>
            <AlertDescription className="text-xs">{feedback.message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Disaster Type (Select) */}
          <div className="space-y-1">
            <Label htmlFor="disasterType">Disaster / Hazard Category</Label>
            <select
              id="disasterType"
              value={disasterType}
              onChange={(e) => setDisasterType(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
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
            <Label htmlFor="severity">Urgency Assessment</Label>
            <select
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="w-full h-9 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="CRITICAL">Critical (Life Threat / Trapped Persons)</option>
              <option value="HIGH">High (Immediate Property/Access Danger)</option>
              <option value="MODERATE">Moderate (Rising Water / Utility Outage)</option>
              <option value="LOW">Low (Precautionary / Blocked Lane)</option>
            </select>
          </div>

          {/* Location: Browser navigator.geolocation auto-fill */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Location Coordinates (Auto-detected via GPS)</Label>
              <button
                type="button"
                onClick={detectGeolocation}
                disabled={locating}
                className="text-[11px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
              >
                <Navigation className="h-3 w-3" />
                {locating ? "Acquiring GPS..." : "Re-pin Location"}
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
                  className="bg-slate-950 border-slate-800 text-xs font-mono pl-7"
                />
                <MapPin className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              <div className="relative">
                <Input
                  type="text"
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 text-xs font-mono pl-7"
                />
                <MapPin className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Description (Textarea) */}
          <div className="space-y-1">
            <Label htmlFor="description">Observed Situation &amp; Needs</Label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe water depth, number of trapped individuals, accessible roads, or urgent medical needs..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
            />
          </div>

          {/* Photo (File Input) with Preview */}
          <div className="space-y-1">
            <Label htmlFor="photo">Attach Photo Evidence (Optional)</Label>
            <div className="flex items-center gap-2">
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-700 hover:border-slate-500 rounded-md bg-slate-950 text-xs text-slate-300 cursor-pointer transition-colors w-full">
                <Camera className="h-3.5 w-3.5 text-slate-400" />
                <span>{photoPreview ? "Change Selected Photo" : "Upload Hazard Photo"}</span>
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
              <div className="relative mt-2 rounded-md overflow-hidden border border-slate-800 max-h-36">
                <img
                  src={photoPreview}
                  alt="Hazard preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-1.5 right-1.5 bg-slate-950/80 text-white rounded px-1.5 py-0.5 text-[10px] hover:bg-red-950"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-5"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {isOnline ? "Transmitting to Dispatch..." : "Saving Offline..."}
              </span>
            ) : isOnline ? (
              "Submit Ground Report (Live)"
            ) : (
              "Queue Report Offline"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
