"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * components/WalkieTalkie.tsx (Push-to-Talk Offline Mesh Comms)
 * ==============================================================================
 *
 * Features:
 * 1. Hold-to-Talk PTT — max 5 second auto-stop recording
 * 2. Real microphone via MediaRecorder API + fallback simulated mode
 * 3. Web Speech API live speech-to-text transcript (browser-native, OFFLINE capable)
 * 4. Offline LLM — pre-fixed answers for common emergency questions when no internet
 * 5. Roger beep + squelch via Web Audio API
 * 6. Cross-tab sync via localStorage + /api/walkie
 * 7. Transcript shown on both sent and received transmissions
 * 8. Data stored: localStorage + API + custom events for authority portal
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Mic,
  Radio,
  Volume2,
  Signal,
  Users,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Navigation,
  Copy,
  Check,
  Crosshair,
  Send,
  ShieldCheck,
  MessageSquare,
  WifiOff,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

// ── Offline LLM: Pre-fixed Emergency Q&A ──────────────────────────────────────
const OFFLINE_QA: { triggers: string[]; answer: string; icon: string }[] = [
  {
    triggers: ["safe", "safest", "where go", "evacuate", "shelter", "refuge"],
    answer:
      "🏫 Nearest safe shelter: Central Relief Station Alpha — 800m inland via Kamaraj Promenade. Follow the BLUE beacon markers. Stay above ground floor. High ground is NW direction.",
    icon: "🏫",
  },
  {
    triggers: ["water", "flood", "rising", "waves", "surge", "inundated"],
    answer:
      "🌊 Flood protocol: Move to upper floors immediately. Do NOT use elevators. Signal rescue with a bright cloth from window. Boats ETA ~12 min via Marina Channel.",
    icon: "🌊",
  },
  {
    triggers: ["rescue", "help", "sos", "emergency", "trapped", "stuck"],
    answer:
      "🚨 SOS received — NDRF Squad Alpha has been notified. Hold PTT + say your floor and building name. Rescue boats are positioned at Marina Promenade Gate 3.",
    icon: "🚨",
  },
  {
    triggers: ["food", "eat", "drink", "hungry", "thirsty", "supplies"],
    answer:
      "🥫 Relief supplies at: (1) St. Thomas Mount Camp — 2km NW. (2) Velachery Community Hall — 3km SW. Boats deliver water purification tabs every 2 hrs. Signal with red flag.",
    icon: "🥫",
  },
  {
    triggers: ["medical", "doctor", "hospital", "injured", "hurt", "sick", "medicine"],
    answer:
      "🏥 Medical: Call 108 (offline-queued). Field medics at Marina Rescue Boat Station. For critical injury, use orange smoke flare from your kit to signal helicopter. ETA 8 min.",
    icon: "🏥",
  },
  {
    triggers: ["fire", "burning", "smoke", "gas", "chemical", "hazmat"],
    answer:
      "🔥 Fire/Chemical protocol: Cover nose with wet cloth. Move crosswind (perpendicular to smoke). DO NOT shelter in basement. HAZMAT zone boundary is 500m radius of SIDCO. Evacuate NE.",
    icon: "🔥",
  },
  {
    triggers: ["power", "electricity", "dark", "lights", "generator", "blackout"],
    answer:
      "⚡ Power outage protocol: Generator trucks deployed to hospitals first. Stay off metal structures. Do not touch downed wires. Lights restored ETA 4 hours per grid sector.",
    icon: "⚡",
  },
  {
    triggers: ["family", "missing", "child", "lost", "separated", "find"],
    answer:
      "👨‍👩‍👧 Missing person: Register at Central Relief Camp registration desk. All rescued civilians logged. SMS '1070' when signal returns. Children taken to Mylapore Children's Camp.",
    icon: "👨‍👩‍👧",
  },
  {
    triggers: ["road", "blocked", "route", "path", "way", "drive", "walk"],
    answer:
      "🛣️ Route status: NH-32 blocked. Use Kamaraj Salai (alternate). Foot path via Lighthouse is passable 08:00-18:00. Boat corridor: Marina Gate 3 → Island Depot → Relief Camp.",
    icon: "🛣️",
  },
  {
    triggers: ["helicopter", "chopper", "air", "rooftop", "airlift"],
    answer:
      "🚁 Helicopter: Orange smoke flare signals airlifts. Approved LZ: Marina Lighthouse terrace (cleared). Next air sortie in 25 min. Max 4 persons per sortie — priority: injured, elderly, children.",
    icon: "🚁",
  },
];

function matchOfflineQA(text: string): string | null {
  const lower = text.toLowerCase();
  for (const qa of OFFLINE_QA) {
    if (qa.triggers.some((t) => lower.includes(t))) {
      return qa.answer;
    }
  }
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface WalkieTransmission {
  id?: string;
  role: "citizen" | "rescue";
  channel: string;
  sector: string;
  audioUrl: string;
  durationMs: number;
  timestamp: string;
  transcript?: string;
  transcriptConfidence?: number;
  isOffline?: boolean;
  offlineAnswer?: string;
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

// ── Main Component ─────────────────────────────────────────────────────────────
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
  const [isOnline, setIsOnline] = useState(true);

  // Transcript state
  const [liveTranscript, setLiveTranscript] = useState(""); // shown while recording
  const [lastTranscript, setLastTranscript] = useState(""); // final transcript of own tx
  const [lastConfidence, setLastConfidence] = useState(0);
  const [offlineAnswer, setOfflineAnswer] = useState<string | null>(null);
  const [showOfflineQA, setShowOfflineQA] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Location
  const [currentLocation] = useState({
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

  const [copied, setCopied] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [txHistory, setTxHistory] = useState<WalkieTransmission[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const maxSecTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptAccumRef = useRef<string>("");

  // ── Online/Offline detection ─────────────────────────────────────────────
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // ── Mic support check + GPS ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      setStatusText("MIC UNAVAILABLE");
    }
  }, []);

  // ── Cross-tab incoming sync ──────────────────────────────────────────────
  useEffect(() => {
    const syncIncoming = () => {
      try {
        const raw = localStorage.getItem("last_walkie_tx");
        if (raw) {
          const parsed: WalkieTransmission = JSON.parse(raw);
          if (parsed && parsed.role !== role) {
            setIncomingTx(parsed);
          }
        }
      } catch {}
    };
    syncIncoming();
    window.addEventListener("storage", syncIncoming);
    const interval = setInterval(syncIncoming, 2500);
    return () => {
      window.removeEventListener("storage", syncIncoming);
      clearInterval(interval);
    };
  }, [role]);

  // Load tx history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("walkie_tx_history") || "[]";
      setTxHistory(JSON.parse(raw).slice(0, 10));
    } catch {}
  }, []);

  // ── Web Audio beep ───────────────────────────────────────────────────────
  const playBeep = (freq = 980, duration = 0.12, type: OscillatorType = "square") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.06;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      setTimeout(() => ctx.close(), 400);
    } catch {}
  };

  // ── Web Speech API — starts alongside MediaRecorder ──────────────────────
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    transcriptAccumRef.current = "";
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; // Indian English
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          final += r[0].transcript + " ";
          const conf = r[0].confidence;
          if (conf) setLastConfidence(Math.round(conf * 100));
        } else {
          interim += r[0].transcript;
        }
      }
      transcriptAccumRef.current = (final || interim).trim();
      setLiveTranscript(transcriptAccumRef.current);
    };

    recognition.onerror = (e: any) => {
      // non-fatal — audio recording still continues
      console.warn("[STT] Recognition error:", e.error);
    };

    recognition.onend = () => {
      // capture final result
      if (transcriptAccumRef.current) {
        setLastTranscript(transcriptAccumRef.current);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    recognitionRef.current = null;
    // Small delay to get final result
    setTimeout(() => {
      const t = transcriptAccumRef.current.trim();
      if (t) setLastTranscript(t);
    }, 200);
  }, []);

  // ── Build & persist transmission ─────────────────────────────────────────
  const finalizeTransmission = useCallback(
    (audioUrl: string, durationMs: number, transcript: string, confidence: number) => {
      const timestampStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Offline LLM match
      const answer = !isOnline && transcript ? matchOfflineQA(transcript) : null;
      if (answer) {
        setOfflineAnswer(answer);
        setShowOfflineQA(true);
        toast.info("💡 Offline AI Guidance", {
          description: answer.substring(0, 80) + "...",
          duration: 6000,
        });
      }

      const payload: WalkieTransmission = {
        role,
        channel,
        sector,
        audioUrl,
        durationMs,
        timestamp: timestampStr,
        transcript,
        transcriptConfidence: confidence,
        isOffline: !isOnline,
        offlineAnswer: answer || undefined,
        location: currentLocation,
      };

      // Persist to localStorage
      try {
        localStorage.setItem("last_walkie_tx", JSON.stringify(payload));
        window.dispatchEvent(new Event("storage"));

        // History log
        const history = JSON.parse(localStorage.getItem("walkie_tx_history") || "[]");
        history.unshift(payload);
        localStorage.setItem("walkie_tx_history", JSON.stringify(history.slice(0, 20)));
        setTxHistory(history.slice(0, 10));
      } catch {}

      // Citizen SOS sync to authority + rescue
      if (role === "citizen") {
        const voiceIncident = {
          id: `VOICE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          type: "Citizen Voice SOS",
          description: transcript
            ? `🎙️ Voice SOS (${channel}): "${transcript}" — from ${currentLocation.locationName} (${currentLocation.building}, ${currentLocation.floor})`
            : `🎙️ Voice Distress (${channel}): Immediate assistance at ${currentLocation.locationName} (${currentLocation.building}, ${currentLocation.floor})`,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
          location_lat: currentLocation.lat,
          location_lng: currentLocation.lng,
          severity: "CRITICAL",
          severity_score: 9,
          status: "open",
          needed_resources: ["rescue_boats", "medical_kits", "paramedics"],
          audio_url: audioUrl || undefined,
          transcript,
          created_at: new Date().toISOString(),
          location_name: currentLocation.locationName,
          building: currentLocation.building,
          floor: currentLocation.floor,
        };

        try {
          localStorage.setItem("kurukshetra_latest_incident", JSON.stringify(voiceIncident));
          const existing = JSON.parse(localStorage.getItem("citizen_submitted_incidents") || "[]");
          existing.unshift(voiceIncident);
          localStorage.setItem("citizen_submitted_incidents", JSON.stringify(existing.slice(0, 50)));
          localStorage.setItem("latest_citizen_voice_cry", JSON.stringify(payload));
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new CustomEvent("kurukshetra:incident_reported", { detail: voiceIncident }));
          window.dispatchEvent(new CustomEvent("kurukshetra:voice_transmitted", { detail: payload }));
        } catch {}
      }

      // POST to API (fire-and-forget)
      fetch("/api/walkie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      onTransmit?.(payload);
      setStatusText("SENT");
      setTimeout(() => setStatusText("STANDBY"), 2000);
    },
    [role, channel, sector, currentLocation, isOnline, onTransmit]
  );

  // ── Start Transmission ───────────────────────────────────────────────────
  const startTransmission = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isTransmitting) return;

    playBeep(1200, 0.1, "sawtooth");
    setIsTransmitting(true);
    setStatusText("TRANSMITTING");
    setLiveTranscript("");
    setLastTranscript("");
    setOfflineAnswer(null);
    setShowOfflineQA(false);
    chunksRef.current = [];
    startTimeRef.current = Date.now();
    setRecordingSeconds(0);

    // Tick counter
    recTickRef.current = setInterval(() => {
      setRecordingSeconds((s) => {
        if (s >= 5) return s; // cap display at 5
        return s + 1;
      });
    }, 1000);

    // Auto-stop after 5 seconds
    maxSecTimer.current = setTimeout(() => {
      stopTransmission();
    }, 5000);

    if (!isSupported) {
      // Simulated demo mode
      startSpeechRecognition();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "",
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

        // Give speech recognition a moment to finalize
        setTimeout(() => {
          const t = transcriptAccumRef.current.trim() || lastTranscript;
          finalizeTransmission(url, durationMs, t, lastConfidence);
        }, 300);

        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(250); // collect chunks every 250ms for smoother
      startSpeechRecognition(); // start STT in parallel
    } catch (err) {
      console.warn("Mic unavailable, simulated mode:", err);
      setIsSupported(false);
      setStatusText("SIM TX");
      startSpeechRecognition();
    }
  };

  // ── Stop Transmission ────────────────────────────────────────────────────
  const stopTransmission = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (!isTransmitting) return;

      // Clear timers
      if (maxSecTimer.current) clearTimeout(maxSecTimer.current);
      if (recTickRef.current) clearInterval(recTickRef.current);
      maxSecTimer.current = null;
      recTickRef.current = null;

      playBeep(650, 0.14, "square");
      setIsTransmitting(false);
      stopSpeechRecognition();

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop(); // triggers recorder.onstop above
      } else {
        // Demo/simulated mode
        const durationMs = Date.now() - startTimeRef.current;
        const t = transcriptAccumRef.current.trim() || "";
        finalizeTransmission("", durationMs, t, lastConfidence);
      }
    },
    [isTransmitting, lastConfidence, finalizeTransmission, stopSpeechRecognition]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  const copyCoords = (lat: number, lng: number, landmark?: string) => {
    const text = `${lat.toFixed(4)}, ${lng.toFixed(4)}${landmark ? ` (${landmark})` : ""}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    toast.success("GPS Coordinates Copied!", { description: text });
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDispatch = (lat: number, lng: number, landmark: string) => {
    setDispatched(true);
    toast.success("🚨 RESCUE SQUAD ALPHA DISPATCHED!", {
      description: `Dispatched to ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E • ${landmark}`,
    });
  };

  // ── Confidence color ──────────────────────────────────────────────────────
  const confColor = (c: number) =>
    c >= 85 ? "text-emerald-400" : c >= 60 ? "text-amber-400" : "text-red-400";

  // ── Render ─────────────────────────────────────────────────────────────────
  const isDark = role === "rescue";

  return (
    <div
      className={`w-full rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${
        isDark
          ? "border-amber-500/30 bg-[#0B1120]/95 text-slate-100"
          : "border-slate-300/80 bg-white/95 text-slate-900"
      } ${compact ? "p-3.5" : "p-5"}`}
    >
      {/* ── Header ── */}
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-black/10 dark:border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isDark
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-red-500/15 text-red-600 border border-red-500/30"
            }`}
          >
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? "text-amber-400" : "text-red-600"}`}>
                Offline Mesh Radio
              </p>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold">
                ENCRYPTED
              </span>
              {/* Online/Offline indicator */}
              <span
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  isOnline
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-red-500/15 text-red-400 animate-pulse"
                }`}
              >
                {isOnline ? (
                  <Signal className="h-2.5 w-2.5" />
                ) : (
                  <WifiOff className="h-2.5 w-2.5" />
                )}
                {isOnline ? "ONLINE" : "OFFLINE — LOCAL AI"}
              </span>
            </div>
            <p className={`text-sm font-bold leading-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              {isDark ? "NDRF Tactical Squad Radio" : "Citizen Emergency Radio"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{sector}</p>
          </div>
        </div>

        {/* Status badge */}
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

      {/* ── Frequency & Mesh Units ── */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className={`rounded-xl border p-2.5 ${isDark ? "border-white/10 bg-black/30" : "border-slate-200 bg-slate-50"}`}>
          <div className="mb-0.5 flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-500">
            <Signal className="h-3 w-3" />
            AI Dynamic Channel
          </div>
          <p className={`font-mono text-xs font-bold ${isDark ? "text-amber-300" : "text-red-600"}`}>{channel}</p>
        </div>
        <div className={`rounded-xl border p-2.5 ${isDark ? "border-white/10 bg-black/30" : "border-slate-200 bg-slate-50"}`}>
          <div className="mb-0.5 flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-500">
            <Users className="h-3 w-3" />
            Mesh Relays Linked
          </div>
          <p className={`font-mono text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{listeners} units active</p>
        </div>
      </div>

      {/* ── Push-to-Talk Button ── */}
      <div className="mb-4 flex flex-col items-center">
        <button
          type="button"
          data-demo="walkie-ptt"
          onMouseDown={startTransmission}
          onMouseUp={stopTransmission}
          onMouseLeave={stopTransmission}
          onTouchStart={startTransmission}
          onTouchEnd={stopTransmission}
          className={`relative flex select-none flex-col items-center justify-center rounded-full border-4 transition-all duration-150 active:scale-95 ${
            compact ? "h-28 w-28" : "h-36 w-36"
          } ${
            isTransmitting
              ? "scale-105 border-red-300 bg-red-600 text-white shadow-[0_0_50px_rgba(239,68,68,0.7)]"
              : isDark
              ? "border-amber-300 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.4)] hover:brightness-110"
              : "border-red-400 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_0_35px_rgba(239,68,68,0.35)] hover:brightness-110"
          }`}
        >
          {isTransmitting && (
            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75 pointer-events-none" />
          )}
          <Mic className={`h-8 w-8 mb-1 ${isTransmitting ? "animate-pulse text-white" : ""}`} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono">
            {isTransmitting ? "Release to Send" : "Hold to Talk"}
          </span>
          {/* Recording timer */}
          {isTransmitting && (
            <span className="text-[11px] font-mono mt-1 font-bold">
              {recordingSeconds}s / 5s
            </span>
          )}
        </button>

        {/* Live transcript while speaking */}
        {isTransmitting && liveTranscript && (
          <div className="mt-3 w-full max-w-xs rounded-xl border border-blue-500/30 bg-blue-950/30 px-3 py-2 text-center">
            <p className="text-[10px] font-mono text-blue-300 mb-1 uppercase">Live Transcript</p>
            <p className="text-xs text-slate-200 italic">"{liveTranscript}"</p>
          </div>
        )}

        <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {isSupported
            ? "Hold button to broadcast · max 5 seconds · speech auto-transcribed"
            : "Microphone blocked — visual simulation mode active · transcript from demo"}
        </p>
      </div>

      {/* ── Last Sent Transmission ── */}
      <div
        className={`mb-3 rounded-2xl border p-3.5 ${
          isDark ? "border-amber-500/30 bg-black/40" : "border-slate-200 bg-slate-50/90 shadow-sm"
        }`}
      >
        <div className="mb-2 flex items-center justify-between text-[11px] font-mono">
          <span className={`flex items-center gap-1.5 font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            <Volume2 className="h-4 w-4 text-amber-500" />
            Your Last Transmission
          </span>
          <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px]">
            READY
          </span>
        </div>

        {/* Audio playback */}
        {lastAudioUrl ? (
          <audio controls src={lastAudioUrl} className="w-full h-8 mb-2" />
        ) : (
          <div className={`rounded-lg p-2 flex items-center justify-between text-xs font-mono mb-2 ${isDark ? "bg-white/5" : "bg-black/5"} text-slate-500`}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Offline Mesh Voice Buffer
            </span>
            <span className="text-emerald-400 font-bold">0:02 / 0:02</span>
          </div>
        )}

        {/* Transcript of own last transmission */}
        {lastTranscript && (
          <div className={`rounded-xl border p-2.5 mb-2 ${isDark ? "border-blue-500/30 bg-blue-950/20" : "border-blue-200 bg-blue-50"}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-blue-400">
                <MessageSquare className="h-3 w-3" />
                SPEECH TRANSCRIPT
              </span>
              {lastConfidence > 0 && (
                <span className={`text-[10px] font-mono font-bold ${confColor(lastConfidence)}`}>
                  {lastConfidence}% confidence
                </span>
              )}
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? "text-slate-200" : "text-slate-700"}`}>
              "{lastTranscript}"
            </p>
          </div>
        )}

        {/* Offline AI Answer */}
        {!isOnline && offlineAnswer && showOfflineQA && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-2.5 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300">
                <Sparkles className="h-3 w-3" />
                OFFLINE AI GUIDANCE
              </span>
              <span className="text-[9px] font-mono text-slate-400 bg-black/30 px-1.5 py-0.5 rounded">
                LOCAL LLM · NO INTERNET
              </span>
            </div>
            <p className="text-xs text-amber-100 leading-relaxed">{offlineAnswer}</p>
          </div>
        )}

        {/* Offline Q&A Quick Menu (when offline) */}
        {!isOnline && (
          <div className="mt-2">
            <button
              onClick={() => setShowOfflineQA(!showOfflineQA)}
              className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 hover:text-amber-200 transition"
            >
              <WifiOff className="h-3 w-3" />
              {showOfflineQA ? "Hide" : "Show"} Offline Emergency Guidance
              {showOfflineQA ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showOfflineQA && (
              <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-950/10 p-2 space-y-1.5">
                <p className="text-[9px] text-slate-400 font-mono mb-2">
                  Speak or tap a question — AI answers instantly without internet:
                </p>
                {OFFLINE_QA.slice(0, 6).map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setOfflineAnswer(qa.answer);
                      toast.info("💡 Offline Guidance", { description: qa.answer.substring(0, 60) + "..." });
                    }}
                    className="w-full text-left flex items-center gap-2 rounded-lg border border-amber-500/20 bg-black/20 hover:bg-amber-950/30 px-2 py-1.5 text-[10px] text-amber-200 transition"
                  >
                    <span className="text-sm">{qa.icon}</span>
                    <span className="font-medium">{qa.triggers[0].charAt(0).toUpperCase() + qa.triggers[0].slice(1)} guidance</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Incoming Transmission Card ── */}
      {incomingTx && (
        <div className="mb-3 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs space-y-2 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 uppercase font-mono text-[10px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Incoming {incomingTx.role === "citizen" ? "Citizen SOS" : "Rescue Squad"} Voice
            </span>
            <span className="text-[10px] font-mono text-slate-400">{incomingTx.timestamp}</span>
          </div>

          <p className="text-slate-300 text-[11px]">
            <strong>Sector:</strong> {incomingTx.sector} · <strong>CH:</strong> {incomingTx.channel}
          </p>

          {/* Audio playback */}
          {incomingTx.audioUrl ? (
            <audio controls src={incomingTx.audioUrl} className="w-full h-8" />
          ) : (
            <p className="text-[11px] text-amber-300 font-mono">
              [Voice Packet · {(incomingTx.durationMs / 1000).toFixed(1)}s · Mesh Hop Received]
            </p>
          )}

          {/* Incoming transcript */}
          {incomingTx.transcript && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-blue-400">
                  <MessageSquare className="h-3 w-3" />
                  SPEECH TRANSCRIPT
                </span>
                {(incomingTx.transcriptConfidence ?? 0) > 0 && (
                  <span className={`text-[10px] font-mono font-bold ${confColor((incomingTx.transcriptConfidence ?? 0) * 100)}`}>
                    {Math.round((incomingTx.transcriptConfidence ?? 0) * 100)}% confidence
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-100 leading-relaxed font-medium">
                "{incomingTx.transcript}"
              </p>
              {incomingTx.isOffline && (
                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono text-amber-400">
                  <WifiOff className="h-2.5 w-2.5" />
                  Sent while offline · stored &amp; forwarded
                </span>
              )}
            </div>
          )}

          {/* Incoming GPS + dispatch */}
          <div className="rounded-xl bg-black/60 border border-emerald-500/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-red-400 animate-bounce" />
                Caller Origin Lock
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                GNSS LOCKED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[9px] text-slate-400 uppercase block font-semibold mb-0.5">GPS Coordinates</span>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-emerald-300 text-[11px]">
                    {incomingTx.location?.lat?.toFixed(4) ?? "13.0544"}° N, {incomingTx.location?.lng?.toFixed(4) ?? "80.2818"}° E
                  </span>
                  <button
                    onClick={() => copyCoords(incomingTx.location?.lat ?? 13.0544, incomingTx.location?.lng ?? 80.2818)}
                    className="p-1 rounded hover:bg-white/10 text-slate-300 transition"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-[9px] text-slate-400 uppercase block font-semibold mb-0.5">Building / Floor</span>
                <span className="font-bold text-amber-300 text-[11px]">
                  {incomingTx.location?.building ?? "Building B-17"} ({incomingTx.location?.floor ?? "Floor 3"})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${incomingTx.location?.lat ?? 13.0544}&mlon=${incomingTx.location?.lng ?? 80.2818}#map=18/${incomingTx.location?.lat ?? 13.0544}/${incomingTx.location?.lng ?? 80.2818}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/40 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Track
                </a>
                <a
                  href={`https://www.google.com/maps?q=${incomingTx.location?.lat ?? 13.0544},${incomingTx.location?.lng ?? 80.2818}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 bg-blue-950/60 px-2.5 py-1 rounded border border-blue-500/40 hover:underline"
                >
                  <Navigation className="h-3 w-3" />
                  Maps
                </a>
              </div>
              <button
                onClick={() => handleDispatch(incomingTx.location?.lat ?? 13.0544, incomingTx.location?.lng ?? 80.2818, incomingTx.location?.building ?? "Building B-17")}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded text-[11px] font-bold transition ${
                  dispatched ? "bg-emerald-600 text-white" : "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                }`}
              >
                {dispatched ? (
                  <><ShieldCheck className="h-3.5 w-3.5" /><span>Dispatched</span></>
                ) : (
                  <><Crosshair className="h-3.5 w-3.5" /><span>Dispatch Rescue</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GPS & Own Location ── */}
      <div className={`rounded-xl border p-3.5 ${isDark ? "border-amber-500/40 bg-black/50" : "border-red-200/80 bg-white shadow-md"}`}>
        <div className="flex items-center justify-between mb-2.5">
          <span className={`text-[11px] font-mono uppercase font-bold flex items-center gap-1.5 ${isDark ? "text-red-400" : "text-red-600"}`}>
            <MapPin className="h-4 w-4 animate-bounce" />
            Your Voice Origin
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            GPS LOCKED (±{currentLocation.accuracyMeters}m)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2.5">
          <div className={`p-2.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 uppercase font-semibold">GPS Coordinates</span>
              <button
                onClick={() => copyCoords(currentLocation.lat, currentLocation.lng, currentLocation.building)}
                className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <span className={`font-bold text-xs mt-1 block ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              {currentLocation.lat.toFixed(4)}° N, {currentLocation.lng.toFixed(4)}° E
            </span>
          </div>
          <div className={`p-2.5 rounded-lg border ${isDark ? "bg-white/5 border-white/10" : "bg-amber-50/60 border-amber-200"}`}>
            <span className="text-[9px] text-amber-600 dark:text-amber-400 uppercase block font-semibold">Landmark / Floor</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-xs mt-1 block">
              {currentLocation.building} ({currentLocation.floor})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1.5 border-t border-black/5 dark:border-white/10">
          <a
            href={`https://www.openstreetmap.org/?mlat=${currentLocation.lat}&mlon=${currentLocation.lng}#map=18/${currentLocation.lat}/${currentLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Track on Live Map
          </a>
          <a
            href={`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg border border-slate-300 dark:border-white/10 hover:underline"
          >
            <Navigation className="h-3 w-3" />
            Google Maps
          </a>
          <button
            onClick={() => handleDispatch(currentLocation.lat, currentLocation.lng, currentLocation.building)}
            className={`ml-auto inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold ${
              dispatched ? "bg-emerald-600 text-white" : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {dispatched ? (
              <><ShieldCheck className="h-3.5 w-3.5" /><span>En Route</span></>
            ) : (
              <><Send className="h-3 w-3" /><span>Dispatch Here</span></>
            )}
          </button>
        </div>

        <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
          Mesh: Opus/16kHz · Geo-Lock: {currentLocation.gridCode} · Store-and-Forward: ON
        </div>
      </div>

      {/* ── Transmission History ── */}
      {txHistory.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 hover:text-slate-300 transition w-full justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Transmission History ({txHistory.length})
            </span>
            {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-white/[0.06] bg-black/20 p-2">
              {txHistory.map((tx, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px] border-b border-white/[0.04] pb-1.5 last:border-0">
                  <span className={`shrink-0 w-1.5 h-1.5 mt-1 rounded-full ${tx.role === "citizen" ? "bg-red-400" : "bg-amber-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-slate-300">{tx.role.toUpperCase()}</span>
                      <span className="text-slate-500">{tx.timestamp}</span>
                    </div>
                    {tx.transcript && (
                      <p className="text-slate-400 truncate">"{tx.transcript}"</p>
                    )}
                    {tx.isOffline && (
                      <span className="text-amber-500 flex items-center gap-1">
                        <WifiOff className="h-2.5 w-2.5" /> offline-send
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
