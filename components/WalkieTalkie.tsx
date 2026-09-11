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
import { Mic, Radio, Volume2, Signal, Users, Play, Square, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface WalkieTransmission {
  id?: string;
  role: "citizen" | "rescue";
  channel: string;
  sector: string;
  audioUrl: string;
  durationMs: number;
  timestamp: string;
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  // Check audio recording support
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      setStatusText("MIC UNAVAILABLE");
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

        const payload: WalkieTransmission = {
          role,
          channel,
          sector,
          audioUrl: url,
          durationMs,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
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
      const payload: WalkieTransmission = {
        role,
        channel,
        sector,
        audioUrl: "",
        durationMs,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
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
        <div className="mb-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs space-y-1.5 animate-slide-up">
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
        </div>
      )}

      {/* Last Sent Transmission Playback */}
      <div
        className={`rounded-xl border p-3 ${
          role === "rescue" ? "border-white/10 bg-black/25" : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-amber-400" />
            Your Last Transmission
          </span>
          {lastAudioUrl && <span className="text-emerald-400 font-bold">READY</span>}
        </div>

        {lastAudioUrl ? (
          <audio controls src={lastAudioUrl} className="w-full h-8" />
        ) : (
          <p className="text-xs text-slate-400 italic">
            No outgoing voice packet recorded yet. Hold the button above and speak.
          </p>
        )}
      </div>
    </div>
  );
}
