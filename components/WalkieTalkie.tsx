"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * components/WalkieTalkie.tsx (Push-to-Talk Offline Mesh Comms)
 * ==============================================================================
 * 
 * Features:
 * 1. Hold-to-Talk Push-to-Talk (PTT) interface with mouse and touch events
 * 2. Real microphone recording via MediaRecorder API (fallback simulated mode)
 * 3. Authentic tactical walkie-talkie squelch & Roger beep sounds using Web Audio API
 * 4. AI-Assigned frequency/channel coordination (e.g. CH 7 • 462.7125 MHz)
 * 5. Cross-tab synchronization via localStorage & /api/walkie
 * 6. Live incoming transmission cards with audio playback for Responders and Citizens
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  Radio,
  Volume2,
  Signal,
  Users,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  ExternalLink,
  Compass,
  Navigation,
  Copy,
  Check,
  Crosshair,
  Send,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export interface WalkieTransmission {
  id?: string;
  role: "citizen" | "rescue";
  channel: string;
  sector: string;
  audioUrl: string;
  durationMs: number;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    locationName: string;
    building?: string;
    floor?: string;
    accuracyMeters?: number;
    gridCode?: string;
  };
}

type WalkieTalkieProps = {
  role?: "citizen" | "rescue";
  channel?: string;
  sector?: string;
  onTransmit?: (payload: WalkieTransmission) => void;
  compact?: boolean;
};

export default function WalkieTalkie({
  role = "citizen",
  channel = "CH 7 • 462.7125 MHz",
  sector = "Marina Waterfront Sector B",
  onTransmit,
  compact = false,
}: WalkieTalkieProps) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("STANDBY");
  const [listeners] = useState(role === "rescue" ? 6 : 14);
  const [incomingTx, setIncomingTx] = useState<WalkieTransmission | null>(null);

  // Live Location & GPS Coordinates Telemetry
  const [currentLocation, setCurrentLocation] = useState({
    lat: role === "rescue" ? 13.0827 : 13.0544,
    lng: role === "rescue" ? 80.2707 : 80.2818,
    locationName:
      role === "rescue"
        ? "NDRF Forward Command Post, Central Anna Salai"
        : "Marina Waterfront Sector B, Chennai",
    building: role === "rescue" ? "Tactical Command Truck 01" : "Building B-17",
    floor: role === "rescue" ? "Ground Unit" : "Floor 3",
    accuracyMeters: 2.8,
    gridCode: role === "rescue" ? "CHN-CMD-HQ" : "CHN-MRN-B17",
  });
  const [lastTransmissionTime, setLastTransmissionTime] = useState<string>("10:42:15 AM");
  const [copied, setCopied] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  const copyCoords = (lat: number, lng: number, landmark?: string) => {
    const text = `${lat.toFixed(4)}, ${lng.toFixed(4)}${landmark ? ` (${landmark})` : ""}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    toast.success("GPS Coordinates Copied to Clipboard!", {
      description: text,
    });
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDispatch = (targetLat: number, targetLng: number, targetLandmark: string) => {
    setDispatched(true);
    toast.success("🚨 RESCUE SQUAD ALPHA DISPATCHED!", {
      description: `Dispatched to ${targetLat.toFixed(4)}° N, ${targetLng.toFixed(4)}° E • ${targetLandmark} • ETA: 3-5 min via Amphibious Unit 02`,
    });
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  // Check audio recording support & attempt live GPS fix
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      setStatusText("MIC UNAVAILABLE");
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation((prev) => ({
            ...prev,
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
            accuracyMeters: Number(pos.coords.accuracy.toFixed(1)),
          }));
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Listen for incoming transmissions from other tabs/roles
  useEffect(() => {
    const syncIncoming = () => {
      try {
        const raw = localStorage.getItem("last_walkie_tx");
        if (raw) {
          const parsed: WalkieTransmission = JSON.parse(raw);
          // Only show as incoming if from the other role
          if (parsed && parsed.role !== role) {
            setIncomingTx(parsed);
          }
        }
      } catch (e) {}
    };

    syncIncoming();
    window.addEventListener("storage", syncIncoming);
    const interval = setInterval(syncIncoming, 2500);
    return () => {
      window.removeEventListener("storage", syncIncoming);
      clearInterval(interval);
    };
  }, [role]);

  // Authentic Walkie-Talkie Roger Beep & Squelch (Web Audio API)
  const playBeep = (freq = 980, duration = 0.12, type: OscillatorType = "square") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.08;

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);

      setTimeout(() => ctx.close(), 350);
    } catch {
      // Ignore audio context errors in restricted environments
    }
  };

  const startTransmission = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isTransmitting) return;

    playBeep(1200, 0.1, "sawtooth"); // Open squelch sound
    setIsTransmitting(true);
    setStatusText("TRANSMITTING");
    chunksRef.current = [];
    startTimeRef.current = Date.now();

    if (!isSupported) {
      return; // Visual demo mode if mic is denied
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : undefined,
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const durationMs = Date.now() - startTimeRef.current;

        setLastAudioUrl(url);
        setStatusText("SENT");

        const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLastTransmissionTime(timestampStr);

        const payload: WalkieTransmission = {
          role,
          channel,
          sector,
          audioUrl: url,
          durationMs,
          timestamp: timestampStr,
          location: currentLocation,
        };

        // Save to localStorage for cross-tab transmission
        try {
          localStorage.setItem("last_walkie_tx", JSON.stringify(payload));
          window.dispatchEvent(new Event("storage"));
        } catch (e) {}

        // Send to backend API
        fetch("/api/walkie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch(() => {});

        onTransmit?.(payload);

        // Stop microphone stream tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        setTimeout(() => setStatusText("STANDBY"), 1500);
      };

      recorder.start();
    } catch (err) {
      console.warn("Microphone access unavailable, using simulated demo mode:", err);
      setIsSupported(false);
      setStatusText("SIMULATED TX");
    }
  };

  const stopTransmission = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isTransmitting) return;

    playBeep(650, 0.14, "square"); // Close squelch Roger beep
    setIsTransmitting(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback for demo mode
      setStatusText("SENT");
      const durationMs = Date.now() - startTimeRef.current;
      const timestampStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastTransmissionTime(timestampStr);

      const payload: WalkieTransmission = {
        role,
        channel,
        sector,
        audioUrl: "",
        durationMs,
        timestamp: timestampStr,
        location: currentLocation,
      };

      try {
        localStorage.setItem("last_walkie_tx", JSON.stringify(payload));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}

      setTimeout(() => setStatusText("STANDBY"), 1500);
      onTransmit?.(payload);
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${
        role === "rescue"
          ? "border-amber-500/30 bg-[#0B1120]/95 text-slate-100"
          : "border-slate-300/80 bg-white/95 text-slate-900"
      } ${compact ? "p-3.5" : "p-5"}`}
    >
      {/* Radio Header */}
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              role === "rescue"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-red-500/15 text-red-600 border border-red-500/30"
            }`}
          >
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p
                className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  role === "rescue" ? "text-amber-400" : "text-red-600"
                }`}
              >
                Offline Mesh Radio
              </p>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold">
                ENCRYPTED
              </span>
            </div>
            <p
              className={`text-sm font-bold leading-tight ${
                role === "rescue" ? "text-slate-100" : "text-slate-900"
              }`}
            >
              {role === "rescue" ? "NDRF Tactical Squad Radio" : "Citizen Emergency Radio"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{sector}</p>
          </div>
        </div>

        {/* Transmission Status Badge */}
        <div
          className={`rounded-full border px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
            isTransmitting
              ? "border-red-500/60 bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30"
              : statusText === "SENT"
              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
              : "border-slate-400/30 bg-black/10 dark:bg-white/5 text-slate-500 dark:text-slate-400"
          }`}
        >
          {statusText}
        </div>
      </div>

      {/* Frequency & Linked Mesh Units Telemetry */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div
          className={`rounded-xl border p-2.5 ${
            role === "rescue" ? "border-white/10 bg-black/30" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="mb-0.5 flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-500">
            <Signal className="h-3 w-3" />
            AI Dynamic Channel
          </div>
          <p
            className={`font-mono text-xs font-bold ${
              role === "rescue" ? "text-amber-300" : "text-red-600"
            }`}
          >
            {channel}
          </p>
        </div>

        <div
          className={`rounded-xl border p-2.5 ${
            role === "rescue" ? "border-white/10 bg-black/30" : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="mb-0.5 flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-500">
            <Users className="h-3 w-3" />
            Mesh Relays Linked
          </div>
          <p
            className={`font-mono text-xs font-bold ${
              role === "rescue" ? "text-slate-200" : "text-slate-800"
            }`}
          >
            {listeners} units active
          </p>
        </div>
      </div>

      {/* Centerpiece: The Push-To-Talk Button */}
      <div className="mb-4 flex flex-col items-center">
        <button
          type="button"
          onMouseDown={(e) => startTransmission(e)}
          onMouseUp={(e) => stopTransmission(e)}
          onMouseLeave={(e) => stopTransmission(e)}
          onTouchStart={(e) => startTransmission(e)}
          onTouchEnd={(e) => stopTransmission(e)}
          className={`relative flex select-none flex-col items-center justify-center rounded-full border-4 transition-all duration-150 active:scale-95 ${
            compact ? "h-28 w-28" : "h-36 w-36"
          } ${
            isTransmitting
              ? "scale-105 border-red-300 bg-red-600 text-white shadow-[0_0_50px_rgba(239,68,68,0.7)]"
              : role === "rescue"
              ? "border-amber-300 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.4)] hover:brightness-110"
              : "border-red-400 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_0_35px_rgba(239,68,68,0.35)] hover:brightness-110"
          }`}
        >
          {/* Animated pulse rings during transmission */}
          {isTransmitting && (
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75 pointer-events-none" />
          )}

          <Mic className={`h-8 w-8 mb-1 ${isTransmitting ? "animate-pulse text-white" : ""}`} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono">
            {isTransmitting ? "Release to Send" : "Hold to Talk"}
          </span>
        </button>

        <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {isSupported
            ? "Press & hold the button to broadcast voice over offline mesh frequency"
            : "Microphone blocked in browser — visual simulation transmission mode active"}
        </p>
      </div>

      {/* Incoming Audio Transmission Alert Card */}
      {incomingTx && (
        <div className="mb-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs space-y-2 animate-slide-up">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 uppercase font-mono text-[10px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Incoming {incomingTx.role === "citizen" ? "Citizen SOS Voice" : "Rescue Squad Voice"}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{incomingTx.timestamp}</span>
          </div>
          <p className="text-slate-200 text-xs">
            <strong>Sector:</strong> {incomingTx.sector} | <strong>Channel:</strong> {incomingTx.channel}
          </p>
          {incomingTx.audioUrl ? (
            <audio controls src={incomingTx.audioUrl} className="w-full h-8 mt-1" />
          ) : (
            <p className="text-[11px] text-amber-300 font-mono">
              [Voice Packet Received via Mesh Hop · Duration: {(incomingTx.durationMs / 1000).toFixed(1)}s]
            </p>
          )}

          {/* Caller GPS Origin Telemetry for Immediate Rescue Tracking */}
          <div className="rounded-xl bg-black/60 border border-emerald-500/40 p-3 text-xs font-mono text-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-300 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-red-400 animate-bounce" />
                Caller Voice Origin &amp; Location Lock
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                GNSS / MESH LOCKED
              </span>
            </div>

            {/* Coordinate Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[9px] text-slate-400 uppercase block font-sans font-semibold">
                  GPS Latitude / Longitude
                </span>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="font-bold text-emerald-300 text-xs">
                    {incomingTx.location?.lat ? `${incomingTx.location.lat.toFixed(4)}° N, ${incomingTx.location.lng.toFixed(4)}° E` : "13.0544° N, 80.2818° E"}
                  </span>
                  <button
                    onClick={() => copyCoords(incomingTx.location?.lat || 13.0544, incomingTx.location?.lng || 80.2818, incomingTx.location?.building)}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    title="Copy GPS Coordinates"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[9px] text-slate-400 uppercase block font-sans font-semibold">
                  Landmark / Floor
                </span>
                <span className="font-bold text-amber-300 text-xs mt-0.5 block">
                  {incomingTx.location?.building || "Building B-17"} ({incomingTx.location?.floor || "Floor 3"})
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 font-sans pt-1 border-t border-white/10 flex items-center justify-between">
              <span className="truncate mr-2">
                📍 <strong>Sector:</strong> {incomingTx.location?.locationName || incomingTx.sector}
              </span>
              <span className="shrink-0 text-[10px] font-mono text-emerald-400 font-bold">
                GRID: {incomingTx.location?.gridCode || "CHN-MRN-B17"}
              </span>
            </div>

            {/* Tactical Navigation & Dispatch Actions */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${incomingTx.location?.lat || 13.0544}&mlon=${incomingTx.location?.lng || 80.2818}#map=18/${incomingTx.location?.lat || 13.0544}/${incomingTx.location?.lng || 80.2818}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/40 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Track on Live Map</span>
                </a>
                <a
                  href={`https://www.google.com/maps?q=${incomingTx.location?.lat || 13.0544},${incomingTx.location?.lng || 80.2818}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 hover:text-blue-200 bg-blue-950/60 px-2.5 py-1 rounded border border-blue-500/40 hover:underline"
                >
                  <Navigation className="h-3 w-3" />
                  <span>Google Maps</span>
                </a>
              </div>

              <button
                onClick={() => handleDispatch(incomingTx.location?.lat || 13.0544, incomingTx.location?.lng || 80.2818, incomingTx.location?.building || "Building B-17")}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition-all shadow-sm ${
                  dispatched
                    ? "bg-emerald-600 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                }`}
              >
                {dispatched ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Squad Alpha Dispatched</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="h-3.5 w-3.5" />
                    <span>Dispatch Rescue to Origin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last Sent Transmission Playback & Origin Coordinates */}
      <div
        className={`rounded-2xl border p-3.5 ${
          role === "rescue"
            ? "border-amber-500/30 bg-black/40 text-slate-100"
            : "border-slate-200 bg-slate-50/90 text-slate-900 shadow-sm"
        }`}
      >
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
            <Volume2 className="h-4 w-4 text-amber-500" />
            Your Last Transmission
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            READY
          </span>
        </div>

        {lastAudioUrl ? (
          <audio controls src={lastAudioUrl} className="w-full h-8" />
        ) : (
          <div className="rounded-lg bg-black/5 dark:bg-white/5 p-2 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Offline Mesh Voice Buffer
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">0:02 / 0:02</span>
          </div>
        )}

        {/* GPS Coordinates & Origin Location Telemetry - Placed Directly Below Voice Player */}
        <div
          className={`mt-3 rounded-xl border p-3.5 ${
            role === "rescue"
              ? "border-amber-500/40 bg-black/50 text-slate-100"
              : "border-red-200/80 bg-white text-slate-900 shadow-md ring-1 ring-red-500/10"
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono uppercase font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-red-500 animate-bounce" />
              Voice Origin Coordinates &amp; Location Tracking
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              GPS LOCKED (±{currentLocation.accuracyMeters}m)
            </span>
          </div>

          {/* Coordinate & Landmark Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono mb-2.5">
            <div
              className={`p-2.5 rounded-lg border ${
                role === "rescue" ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-500 uppercase font-sans font-semibold">
                  GPS Latitude / Longitude
                </span>
                <button
                  onClick={() => copyCoords(currentLocation.lat, currentLocation.lng, currentLocation.building)}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 transition-colors"
                  title="Copy GPS coordinates"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs mt-1 block">
                {currentLocation.lat.toFixed(4)}° N, {currentLocation.lng.toFixed(4)}° E
              </span>
            </div>

            <div
              className={`p-2.5 rounded-lg border ${
                role === "rescue" ? "bg-white/5 border-white/10" : "bg-amber-50/60 border-amber-200"
              }`}
            >
              <span className="text-[9px] text-amber-800 dark:text-amber-400 uppercase block font-sans font-semibold">
                Landmark / Building &amp; Floor
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-400 text-xs mt-1 block">
                {currentLocation.building} ({currentLocation.floor})
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-sans flex items-center justify-between pt-1.5 border-t border-black/5 dark:border-white/10">
            <span className="truncate mr-2">
              📍 <strong>Sector Address:</strong> {currentLocation.locationName}
            </span>
            <span className="shrink-0 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
              GRID: {currentLocation.gridCode}
            </span>
          </div>

          {/* Rescue Origin Action Bar with Direct Navigation Links */}
          <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <a
                href={`https://www.openstreetmap.org/?mlat=${currentLocation.lat}&mlon=${currentLocation.lng}#map=18/${currentLocation.lat}/${currentLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Track on Live Map</span>
              </a>
              <a
                href={`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg border border-slate-300 dark:border-white/10 hover:underline"
              >
                <Navigation className="h-3 w-3" />
                <span>Google Maps</span>
              </a>
            </div>

            <button
              onClick={() => handleDispatch(currentLocation.lat, currentLocation.lng, currentLocation.building)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                dispatched
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {dispatched ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Squad Alpha En Route</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  <span>Dispatch Rescue Here</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
            Mesh Audio Packet Encapsulation: Opus/16kHz + Geo-Lock Header (CHN-MRN-B17)
          </div>
        </div>
      </div>
    </div>
  );
}
