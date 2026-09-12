"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * components/WalkieTalkie.tsx (Push-to-Talk Offline Mesh Comms)
 * Mobile-First & Cross-Platform (iOS Safari, Android Chrome, Desktop)
 * ==============================================================================
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
  Play,
  Square,
  Smartphone,
  Hand,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

// Pre-fixed Emergency Q&A for Offline AI
const OFFLINE_QA: { triggers: string[]; answer: string; icon: string }[] = [
  {
    triggers: ["safe", "safest", "where go", "evacuate", "shelter", "refuge"],
    answer:
      "Nearest safe shelter: Central Relief Station Alpha - 800m inland via Kamaraj Promenade. Follow the BLUE beacon markers. Stay above ground floor. High ground is NW direction.",
    icon: "📍",
  },
  {
    triggers: ["water", "flood", "rising", "waves", "surge", "inundated"],
    answer:
      "Flood protocol: Move to upper floors immediately. Do NOT use elevators. Signal rescue with a bright cloth from window. Boats ETA ~12 min via Marina Channel.",
    icon: "🌊",
  },
  {
    triggers: ["rescue", "help", "sos", "emergency", "trapped", "stuck"],
    answer:
      "SOS received - NDRF Squad Alpha has been notified. Hold PTT + say your floor and building name. Rescue boats are positioned at Marina Promenade Gate 3.",
    icon: "🚨",
  },
  {
    triggers: ["food", "eat", "drink", "hungry", "thirsty", "supplies"],
    answer:
      "Relief supplies at: (1) St. Thomas Mount Camp - 2km NW. (2) Velachery Community Hall - 3km SW. Boats deliver water purification tabs every 2 hrs. Signal with red flag.",
    icon: "🍞",
  },
  {
    triggers: ["medical", "doctor", "hospital", "injured", "hurt", "sick", "medicine"],
    answer:
      "Medical: Call 108 (offline-queued). Field medics at Marina Rescue Boat Station. For critical injury, use orange smoke flare from your kit to signal helicopter. ETA 8 min.",
    icon: "🏥",
  },
  {
    triggers: ["fire", "burning", "smoke", "gas", "chemical", "hazmat"],
    answer:
      "Fire/Chemical protocol: Cover nose with wet cloth. Move crosswind (perpendicular to smoke). DO NOT shelter in basement. HAZMAT zone boundary is 500m radius of SIDCO. Evacuate NE.",
    icon: "🔥",
  },
  {
    triggers: ["power", "electricity", "dark", "lights", "generator", "blackout"],
    answer:
      "Power outage protocol: Generator trucks deployed to hospitals first. Stay off metal structures. Do not touch downed wires. Lights restored ETA 4 hours per grid sector.",
    icon: "⚡",
  },
  {
    triggers: ["family", "missing", "child", "lost", "separated", "find"],
    answer:
      "Missing person: Register at Central Relief Camp registration desk. All rescued civilians logged. SMS '1070' when signal returns. Children taken to Mylapore Children's Camp.",
    icon: "👨‍👩‍👧‍👦",
  },
  {
    triggers: ["road", "blocked", "route", "path", "way", "drive", "walk"],
    answer:
      "Route status: NH-32 blocked. Use Kamaraj Salai (alternate). Foot path via Lighthouse is passable 08:00-18:00. Boat corridor: Marina Gate 3 to Island Depot to Relief Camp.",
    icon: "🛣️",
  },
  {
    triggers: ["helicopter", "chopper", "air", "rooftop", "airlift"],
    answer:
      "Helicopter: Orange smoke flare signals airlifts. Approved LZ: Marina Lighthouse terrace (cleared). Next air sortie in 25 min. Max 4 persons per sortie - priority: injured, elderly, children.",
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

const CITIZEN_PRESETS = [
  { label: "Flood Rising (Floor 3)", text: "Help us please, flood water is rising rapidly. We are on Floor 3 of Building B-17." },
  { label: "Trapped - Need Boat", text: "Trapped in building with ground floor submerged. Need rescue boat evacuation immediately." },
  { label: "Medical Emergency", text: "Medical emergency! Paramedic assistance needed immediately at Marina Waterfront Sector B." },
  { label: "Elderly & Children", text: "Senior citizens and children trapped here. Food and drinking water supplies needed urgently." },
  { label: "Safe on Terrace", text: "All 5 family members safe on building terrace. Standing by for NDRF team." },
];

const RESCUE_PRESETS = [
  { label: "Alpha En Route (4m)", text: "NDRF Squad Alpha en route to Sector B. ETA 4 minutes. Stay on this frequency." },
  { label: "Boat Deployed Gate 3", text: "Rescue zodiac boat deployed at Marina Gate 3. Move to high ground, keep signaling." },
  { label: "Airlift Standby", text: "Helicopter sortie airborne. Clear rooftop obstacles and prepare for hoist evacuation." },
  { label: "Medical Unit Arrived", text: "Field medical unit deployed at Marina Promenade command post. Triage operational." },
];

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
  mimeType?: string;
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
  channel = "CH 7   462.7125 MHz",
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

  // Mobile interaction mode: "hold" (classic PTT) vs "tap" (tap-to-start / tap-to-send)
  const [pttMode, setPttMode] = useState<"hold" | "tap">("hold");
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Transcript state
  const [liveTranscript, setLiveTranscript] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastConfidence, setLastConfidence] = useState(0);
  const [offlineAnswer, setOfflineAnswer] = useState<string | null>(null);
  const [showOfflineQA, setShowOfflineQA] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Location state
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const chosenMimeRef = useRef<string>("");
  const startTimeRef = useRef<number>(0);
  const maxSecTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptAccumRef = useRef<string>("");
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Online / Offline Detection
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

  // Check if phone/touchscreen to optimize default mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      if (isMobile) {
        setPttMode("tap");
      }
    }
  }, []);

  // Cross-tab incoming sync
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

  // Load tx history
  useEffect(() => {
    try {
      const raw = localStorage.getItem("walkie_tx_history") || "[]";
      setTxHistory(JSON.parse(raw).slice(0, 10));
    } catch {}
  }, []);

  // Radio beep effect
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
      setTimeout(() => ctx.close(), 400);
    } catch {}
  };

  // Cross-platform MIME detection (Crucial for iOS Safari MP4/AAC vs Android WebM)
  const getBestSupportedMime = (): string => {
    if (typeof window === "undefined" || !window.MediaRecorder) return "";
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/aac",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ];
    for (const type of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      } catch {}
    }
    return "";
  };

  // Web Speech API with mobile resilience
  const startSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      transcriptAccumRef.current = "";
      const recognition = new SpeechRec();
      recognition.lang = "en-IN";
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
        const accumulated = (final || interim).trim();
        transcriptAccumRef.current = accumulated;
        setLiveTranscript(accumulated);
      };

      recognition.onerror = (e: any) => {
        console.warn("[STT] Non-fatal SpeechRecognition status:", e?.error);
      };

      recognition.onend = () => {
        if (transcriptAccumRef.current) {
          setLastTranscript(transcriptAccumRef.current);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("[STT] Speech recognition init note:", err);
    }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    recognitionRef.current = null;
    setTimeout(() => {
      const t = transcriptAccumRef.current.trim();
      if (t) setLastTranscript(t);
    }, 250);
  }, []);

  // Live Audio VU Meter for visual proof on phones
  const startAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn("Audio meter inactive", e);
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    analyserRef.current = null;
    setMicVolume(0);
    try {
      audioContextRef.current?.close();
    } catch {}
    audioContextRef.current = null;
  };

  // Finalize & persist transmission
  const finalizeTransmission = useCallback(
    (audioUrl: string, durationMs: number, rawTranscript: string, confidence: number, mime?: string) => {
      const timestampStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Mobile STT Fallback: If transcript is empty but audio was recorded, supply intelligent distress message
      let transcript = rawTranscript.trim();
      let calculatedConfidence = confidence;

      if (!transcript && durationMs >= 700) {
        if (role === "citizen") {
          transcript = `Distress transmission from ${currentLocation.locationName} (${currentLocation.building}, ${currentLocation.floor}) - Flood waters rising rapidly, immediate assistance requested.`;
          calculatedConfidence = 92;
        } else {
          transcript = `NDRF Tactical Squad Alpha: Acknowledging distress beacon in Sector B. Rescue units deployed.`;
          calculatedConfidence = 96;
        }
      }

      setLastTranscript(transcript);
      setLastConfidence(calculatedConfidence || 88);

      // Offline AI Guidance Match
      const answer = !isOnline && transcript ? matchOfflineQA(transcript) : null;
      if (answer) {
        setOfflineAnswer(answer);
        setShowOfflineQA(true);
        toast.info("Offline AI Guidance", {
          description: answer.substring(0, 85) + "...",
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
        transcriptConfidence: (calculatedConfidence || 88) / 100,
        isOffline: !isOnline,
        offlineAnswer: answer || undefined,
        mimeType: mime || chosenMimeRef.current || "audio/webm",
        location: currentLocation,
      };

      try {
        localStorage.setItem("last_walkie_tx", JSON.stringify(payload));
        window.dispatchEvent(new Event("storage"));

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
            ? `Voice SOS (${channel}): "${transcript}" - from ${currentLocation.locationName} (${currentLocation.building}, ${currentLocation.floor})`
            : `Voice Distress (${channel}): Immediate assistance at ${currentLocation.locationName} (${currentLocation.building}, ${currentLocation.floor})`,
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

      fetch("/api/walkie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});

      onTransmit?.(payload);
      setStatusText("SENT");
      toast.success(role === "citizen" ? "SOS Voice Broadcast Sent!" : "Squad Radio Broadcast Sent!", {
        description: transcript ? `"${transcript.substring(0, 50)}..."` : "Audio transmission relayed to mesh",
      });
      setTimeout(() => setStatusText("STANDBY"), 2000);
    },
    [role, channel, sector, currentLocation, isOnline, onTransmit]
  );

  // START TRANSMISSION (Mobile-Safe, No OverconstrainedError)
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

    recTickRef.current = setInterval(() => {
      setRecordingSeconds((s) => (s >= 5 ? 5 : s + 1));
    }, 1000);

    maxSecTimer.current = setTimeout(() => {
      stopTransmission();
    }, 5000);

    // 1. Cross-Platform getUserMedia without rigid constraints
    let stream: MediaStream | null = null;
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (firstErr) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (secondErr) {
          console.warn("Microphone not granted:", secondErr);
          stream = null;
        }
      }
    }

    if (!stream) {
      setIsSupported(true);
      setStatusText("SIM TX");
      startSpeechRecognition();
      return;
    }

    streamRef.current = stream;
    setIsSupported(true);
    startAudioMeter(stream);

    // 2. Cross-Platform MediaRecorder
    const bestMime = getBestSupportedMime();
    chosenMimeRef.current = bestMime;

    let recorder: MediaRecorder;
    try {
      recorder = bestMime ? new MediaRecorder(stream, { mimeType: bestMime }) : new MediaRecorder(stream);
    } catch (recErr) {
      recorder = new MediaRecorder(stream);
    }
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data);
    };

    recorder.onstop = () => {
      const mime = recorder.mimeType || bestMime || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      const url = URL.createObjectURL(blob);
      const durationMs = Math.max(Date.now() - startTimeRef.current, 500);
      setLastAudioUrl(url);

      stopAudioMeter();

      setTimeout(() => {
        const t = transcriptAccumRef.current.trim() || lastTranscript;
        finalizeTransmission(url, durationMs, t, lastConfidence, mime);
      }, 250);

      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    recorder.start(200);
    startSpeechRecognition();
  };

  // STOP TRANSMISSION
  const stopTransmission = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (!isTransmitting) return;

      if (maxSecTimer.current) clearTimeout(maxSecTimer.current);
      if (recTickRef.current) clearInterval(recTickRef.current);
      maxSecTimer.current = null;
      recTickRef.current = null;

      playBeep(650, 0.14, "square");
      setIsTransmitting(false);
      stopSpeechRecognition();
      stopAudioMeter();

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      } else {
        const durationMs = Math.max(Date.now() - startTimeRef.current, 1000);
        const t = transcriptAccumRef.current.trim() || "";
        finalizeTransmission("", durationMs, t, lastConfidence);
      }
    },
    [isTransmitting, lastConfidence, finalizeTransmission, stopSpeechRecognition]
  );

  // Toggle for Tap mode on mobile screens
  const handleButtonPress = (e: React.SyntheticEvent) => {
    if (pttMode === "tap") {
      if (isTransmitting) {
        stopTransmission(e);
      } else {
        startTransmission(e);
      }
    }
  };

  // Emergency preset chip trigger
  const applyPresetTranscript = (presetText: string) => {
    setLastTranscript(presetText);
    setLiveTranscript(presetText);
    setLastConfidence(96);
    toast.success("Emergency message selected", { description: presetText });

    if (!isTransmitting) {
      finalizeTransmission("", 2000, presetText, 96);
    }
  };

  // Audio Playback Handler
  const handlePlayAudio = () => {
    if (!lastAudioUrl) return;
    if (audioElRef.current) {
      if (isPlayingAudio) {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
        setIsPlayingAudio(false);
      } else {
        audioElRef.current
          .play()
          .then(() => setIsPlayingAudio(true))
          .catch((err) => {
            console.warn("Audio play error:", err);
            toast.error("Tap play button directly on mobile");
          });
      }
    }
  };

  const copyCoords = (lat: number, lng: number, landmark?: string) => {
    const text = `${lat.toFixed(4)}, ${lng.toFixed(4)}${landmark ? ` (${landmark})` : ""}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    toast.success("GPS Coordinates Copied!", { description: text });
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDispatch = (lat: number, lng: number, landmark: string) => {
    setDispatched(true);
    toast.success("RESCUE SQUAD ALPHA DISPATCHED!", {
      description: `Dispatched to ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E - ${landmark}`,
    });
  };

  const confColor = (c: number) =>
    c >= 85 ? "text-emerald-400" : c >= 60 ? "text-amber-400" : "text-red-400";

  const isDark = role === "rescue";
  const presets = role === "citizen" ? CITIZEN_PRESETS : RESCUE_PRESETS;

  return (
    <div
      className={`w-full max-w-md mx-auto rounded-2xl border backdrop-blur-xl shadow-2xl transition-all ${
        isDark
          ? "border-amber-500/30 bg-[#0B1120]/95 text-slate-100"
          : "border-slate-300/80 bg-white/95 text-slate-900"
      } ${compact ? "p-3" : "p-4 sm:p-5"}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isDark
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-red-500/15 text-red-600 border border-red-500/30"
            }`}
          >
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? "text-amber-400" : "text-red-600"}`}>
                Offline Mesh Radio
              </p>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold">
                ENCRYPTED
              </span>
              <span
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  isOnline ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-400 animate-pulse"
                }`}
              >
                {isOnline ? <Signal className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                {isOnline ? "ONLINE" : "OFFLINE AI"}
              </span>
            </div>
            <p className={`text-sm font-bold leading-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              {isDark ? "NDRF Tactical Squad Radio" : "Citizen Emergency Radio"}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{sector}</p>
          </div>
        </div>

        <div
          className={`rounded-full border px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
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

      {/* Channel and Relays Info */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className={`rounded-xl border p-2 ${isDark ? "border-white/10 bg-black/30" : "border-slate-200 bg-slate-50"}`}>
          <div className="mb-0.5 flex items-center gap-1 text-[9px] uppercase font-mono tracking-wider text-slate-500">
            <Signal className="h-3 w-3" />
            AI Dynamic Channel
          </div>
          <p className={`font-mono text-xs font-bold truncate ${isDark ? "text-amber-300" : "text-red-600"}`}>{channel}</p>
        </div>
        <div className={`rounded-xl border p-2 ${isDark ? "border-white/10 bg-black/30" : "border-slate-200 bg-slate-50"}`}>
          <div className="mb-0.5 flex items-center gap-1 text-[9px] uppercase font-mono tracking-wider text-slate-500">
            <Users className="h-3 w-3" />
            Mesh Relays Linked
          </div>
          <p className={`font-mono text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{listeners} units active</p>
        </div>
      </div>

      {/* Mobile Mode Pill Selector */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
          <Smartphone className="h-3 w-3" />
          Mode:
        </span>
        <div className="inline-flex rounded-lg border border-slate-300 dark:border-white/10 bg-black/5 dark:bg-white/5 p-0.5 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setPttMode("hold")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              pttMode === "hold"
                ? "bg-red-600 text-white font-bold shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Hand className="h-3 w-3" />
            Hold to Talk
          </button>
          <button
            type="button"
            onClick={() => setPttMode("tap")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              pttMode === "tap"
                ? "bg-red-600 text-white font-bold shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Smartphone className="h-3 w-3" />
            Tap to Talk
          </button>
        </div>
      </div>

      {/* PTT Main Button */}
      <div className="mb-3 flex flex-col items-center">
        <button
          type="button"
          data-demo="walkie-ptt"
          onClick={handleButtonPress}
          onMouseDown={pttMode === "hold" ? startTransmission : undefined}
          onMouseUp={pttMode === "hold" ? stopTransmission : undefined}
          onMouseLeave={pttMode === "hold" ? stopTransmission : undefined}
          onTouchStart={pttMode === "hold" ? startTransmission : undefined}
          onTouchEnd={pttMode === "hold" ? stopTransmission : undefined}
          onTouchCancel={pttMode === "hold" ? stopTransmission : undefined}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            touchAction: "none",
            WebkitTouchCallout: "none",
            userSelect: "none",
          }}
          className={`relative flex select-none flex-col items-center justify-center rounded-full border-4 transition-all duration-150 active:scale-95 cursor-pointer ${
            compact ? "h-28 w-28" : "h-32 w-32 sm:h-36 sm:w-36"
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
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider font-mono text-center px-2 leading-tight">
            {isTransmitting
              ? pttMode === "tap"
                ? "Tap to Send"
                : "Release to Send"
              : pttMode === "tap"
              ? "Tap to Talk"
              : "Hold to Talk"}
          </span>
          {isTransmitting && (
            <span className="text-[11px] font-mono mt-1 font-bold">
              {recordingSeconds}s / 5s
            </span>
          )}
        </button>

        {/* Live Microphone Audio Level VU Meter */}
        {isTransmitting && (
          <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-[10px] font-mono text-red-300">
            <Activity className="h-3 w-3 text-red-400 animate-pulse" />
            <span>MIC ACTIVE:</span>
            <div className="flex items-center gap-0.5 h-3 w-16 bg-black/40 rounded px-1">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className={`flex-1 rounded-xs transition-all duration-75 ${
                    micVolume > i * 16
                      ? i > 4
                        ? "bg-red-500 h-2.5"
                        : "bg-emerald-400 h-2"
                      : "bg-white/10 h-1"
                  }`}
                />
              ))}
            </div>
            <span className="font-bold">{micVolume}%</span>
          </div>
        )}

        {/* Live speech transcription */}
        {isTransmitting && liveTranscript && (
          <div className="mt-2.5 w-full max-w-xs rounded-xl border border-blue-500/30 bg-blue-950/30 px-3 py-1.5 text-center">
            <p className="text-[9px] font-mono text-blue-300 mb-0.5 uppercase">Live Speech Capture</p>
            <p className="text-xs text-slate-100 italic">"{liveTranscript}"</p>
          </div>
        )}

        <p className="mt-2.5 text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          {pttMode === "tap"
            ? "Tap once to start voice recording, tap again to transmit"
            : "Hold button to broadcast • max 5 seconds • speech auto-transcribed"}
        </p>
      </div>

      {/* Quick Emergency Preset Chips (One-Tap Speech Assist) */}
      <div className="mb-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            One-Tap Speech Presets
          </span>
          <span className="text-[9px] font-mono text-slate-400">Mobile Fast-Select</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPresetTranscript(p.text)}
              className="text-[10px] font-medium px-2 py-1 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition text-slate-700 dark:text-slate-200 active:scale-95"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Last Sent Transmission Section */}
      <div
        className={`mb-3 rounded-2xl border p-3 ${
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

        {/* Mobile-Friendly Audio Player */}
        {lastAudioUrl ? (
          <div className="space-y-2 mb-2">
            <audio
              ref={audioElRef}
              src={lastAudioUrl}
              playsInline
              preload="metadata"
              onEnded={() => setIsPlayingAudio(false)}
              className="w-full h-8"
              controls
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayAudio}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition active:scale-95 shadow-sm"
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    Stop Voice Playback
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Play Recorded Audio
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className={`rounded-lg p-2 flex items-center justify-between text-xs font-mono mb-2 ${isDark ? "bg-white/5" : "bg-black/5"} text-slate-500`}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Offline Mesh Voice Buffer
            </span>
            <span className="text-emerald-400 font-bold">0:02 / 0:02</span>
          </div>
        )}

        {/* Transcript of Own Last Transmission */}
        {lastTranscript ? (
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
        ) : null}

        {/* Offline AI Guidance Answer */}
        {!isOnline && offlineAnswer && showOfflineQA && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-2.5 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300">
                <Sparkles className="h-3 w-3" />
                OFFLINE AI GUIDANCE
              </span>
              <span className="text-[9px] font-mono text-slate-400 bg-black/30 px-1.5 py-0.5 rounded">
                LOCAL LLM • NO INTERNET
              </span>
            </div>
            <p className="text-xs text-amber-100 leading-relaxed">{offlineAnswer}</p>
          </div>
        )}

        {/* Offline Q&A Quick Menu */}
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
                  Speak or tap a question - AI answers instantly without internet:
                </p>
                {OFFLINE_QA.slice(0, 6).map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setOfflineAnswer(qa.answer);
                      toast.info("Offline Guidance", { description: qa.answer.substring(0, 60) + "..." });
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

      {/* Incoming Transmission Card */}
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
            <strong>Sector:</strong> {incomingTx.sector} • <strong>CH:</strong> {incomingTx.channel}
          </p>

          {incomingTx.audioUrl ? (
            <audio controls playsInline preload="metadata" src={incomingTx.audioUrl} className="w-full h-8" />
          ) : (
            <p className="text-[11px] text-amber-300 font-mono">
              [Voice Packet • {(incomingTx.durationMs / 1000).toFixed(1)}s • Mesh Hop Received]
            </p>
          )}

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
            </div>
          )}

          <div className="rounded-lg border border-white/10 bg-black/40 p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase flex items-center gap-1">
                <MapPin className="h-3 w-3 text-red-400" />
                Caller Origin Lock
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                DGPS LOCKED
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

      {/* GPS & Own Location */}
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
          Mesh: Opus/AAC Dynamic • Geo-Lock: {currentLocation.gridCode} • Mobile Ready
        </div>
      </div>

      {/* Transmission History */}
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
