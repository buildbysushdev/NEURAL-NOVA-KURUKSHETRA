"use client";

/**
 * CitizenShowcase.tsx
 * ====================
 * Auto-scrolling citizen portal feature showcase for demo.
 * Shows: Offline AI, Walkie-Talkie, Safe Shelters, Maps, Alerts
 * Does NOT redirect — shown as an overlay panel on authority portal
 */

import React, { useEffect, useRef, useState } from "react";
import {
  WifiOff,
  Radio,
  Shield,
  MapPin,
  AlertTriangle,
  MessageSquare,
  Waves,
  ChevronRight,
  Sparkles,
  HeartPulse,
  Navigation,
  Phone,
  CheckCircle2,
  X,
} from "lucide-react";

interface ShowcaseSlide {
  id: string;
  title: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bgGrad: string;
  features: string[];
  badge?: string;
}

const SLIDES: ShowcaseSlide[] = [
  {
    id: "offline-ai",
    title: "Offline AI Emergency Assistant",
    subtitle: "Works without internet — 10+ emergency Q&A categories",
    icon: WifiOff,
    color: "text-amber-300",
    bgGrad: "from-amber-950/60 via-[#0B0F17] to-orange-950/40",
    badge: "LOCAL LLM",
    features: [
      "💬 'Where is the safest shelter nearby?'",
      "🌊 Flood protocol steps — no internet needed",
      "🏥 Medical emergency routing & field medic locations",
      "🔥 Fire & HAZMAT evacuation corridor guidance",
      "🚁 Helicopter airlifts & LZ coordinates",
      "👨‍👩‍👧 Missing family member registration & reunification",
    ],
  },
  {
    id: "walkie-talkie",
    title: "Mesh Walkie-Talkie PTT",
    subtitle: "Speech-to-text transcription · 5s max · offline mesh radio",
    icon: Radio,
    color: "text-red-300",
    bgGrad: "from-red-950/60 via-[#0B0F17] to-rose-950/40",
    badge: "OFFLINE MESH",
    features: [
      "🎙️ Hold-to-Talk PTT — up to 5 seconds",
      "📝 Live speech-to-text transcript while speaking",
      "📍 GPS coordinates auto-attached to every SOS",
      "🔗 Cross-portal sync → Authority + Rescue notified",
      "📴 Works offline via LoRa 868MHz mesh network",
      "🔊 Incoming transmissions with audio + transcript",
    ],
  },
  {
    id: "safe-shelters",
    title: "Safe Shelter Locator",
    subtitle: "Live occupancy · safe routes · medical team status",
    icon: Shield,
    color: "text-emerald-300",
    bgGrad: "from-emerald-950/60 via-[#0B0F17] to-teal-950/40",
    badge: "LIVE DATA",
    features: [
      "🏫 Central Relief Station Alpha — 0.8 km away",
      "🏥 Royapettah Civil Relief Post — 1.2 km",
      "📊 Real-time occupancy & food ration counts",
      "🛣️ Safe evacuation route guidance per shelter",
      "👨‍⚕️ Medical team availability displayed",
      "🗺️ One-tap navigation to Google Maps / OSM",
    ],
  },
  {
    id: "alert-map",
    title: "Live Incident Alert Map",
    subtitle: "Real-time hazard zones · wind direction · fire points",
    icon: MapPin,
    color: "text-blue-300",
    bgGrad: "from-blue-950/60 via-[#0B0F17] to-cyan-950/40",
    badge: "NASA FIRMS",
    features: [
      "🔴 Critical hazard zones with pulsing markers",
      "💨 Wind direction + speed overlay for fire spread",
      "🔥 NASA FIRMS thermal anomaly fire points",
      "📡 USGS seismic readings in real time",
      "🌊 Flood surge depth contour lines",
      "🔔 Tap any zone for full incident details",
    ],
  },
  {
    id: "alerts",
    title: "Government Alerts & SOS",
    subtitle: "Authority-issued warnings · instant distress reporting",
    icon: AlertTriangle,
    color: "text-red-400",
    bgGrad: "from-red-950/60 via-[#0B0F17] to-amber-950/40",
    badge: "CRITICAL",
    features: [
      "🚨 Authority-issued evacuation directives",
      "📋 Submit incident report with GPS + photo",
      "📞 Emergency contacts: 108, 100, NDRF hotline",
      "🔔 Severity-based alert banners (CRITICAL/HIGH/LOW)",
      "🔁 Two-way communication with rescue teams",
      "⚡ Instant AI triage of your report",
    ],
  },
];

interface CitizenShowcaseProps {
  visible: boolean;
  onClose?: () => void;
  autoPlay?: boolean; // auto-advance slides
}

export function CitizenShowcase({ visible, onClose, autoPlay = true }: CitizenShowcaseProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const SLIDE_DURATION = 5000; // ms per slide
  const PROGRESS_TICK = 50; // ms per progress update

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const goToSlide = (idx: number) => {
    setCurrentSlide(idx);
    setProgress(0);
  };

  const startAutoPlay = () => {
    clearTimers();
    setProgress(0);

    progressRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return p + (100 / (SLIDE_DURATION / PROGRESS_TICK));
      });
    }, PROGRESS_TICK);

    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;
        setProgress(0);
        return next;
      });
    }, SLIDE_DURATION);
  };

  useEffect(() => {
    if (visible && autoPlay) {
      startAutoPlay();
    }
    return clearTimers;
  }, [visible, autoPlay]);

  // Simulate slow scroll animation on the showcase
  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    const tick = setInterval(() => {
      frame++;
      setScrollY(Math.sin(frame * 0.02) * 8); // subtle parallax float
    }, 50);
    return () => clearInterval(tick);
  }, [visible]);

  if (!visible) return null;

  const slide = SLIDES[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div
        ref={containerRef}
        className="w-full max-w-2xl mx-4 rounded-3xl border border-white/[0.1] bg-[#080C14]/98 shadow-2xl overflow-hidden"
        style={{ transform: `translateY(${scrollY}px)`, transition: "transform 0.8s ease" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-gradient-to-r from-violet-950/40 to-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
              <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-100">Citizen Portal — Feature Showcase</p>
              <p className="text-[10px] text-slate-400">Auto-demo · {currentSlide + 1}/{SLIDES.length} features</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/[0.04] relative">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Main slide area */}
        <div
          className={`p-6 bg-gradient-to-br ${slide.bgGrad} transition-all duration-500`}
          style={{ minHeight: 280 }}
        >
          <div className="flex items-start gap-4 mb-5">
            <div className={`p-3 rounded-2xl border ${slide.color.replace("text-", "border-").replace("-300", "-500/40")} bg-white/[0.05] backdrop-blur-sm`}>
              <SlideIcon className={`w-6 h-6 ${slide.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-base font-bold text-white">{slide.title}</h3>
                {slide.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${slide.color} bg-white/[0.08] border border-current/30`}>
                    {slide.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">{slide.subtitle}</p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {slide.features.map((feat, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 transition-all duration-300 hover:bg-white/[0.07]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <ChevronRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${slide.color}`} />
                <span className="text-[11px] text-slate-200 leading-tight">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Slide selector dots + nav */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-black/20">
          <div className="flex items-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  goToSlide(i);
                  if (autoPlay) startAutoPlay();
                }}
                className={`transition-all duration-300 rounded-full ${
                  i === currentSlide
                    ? "w-6 h-2 bg-violet-400"
                    : "w-2 h-2 bg-white/20 hover:bg-white/40"
                }`}
                title={s.title}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToSlide((currentSlide - 1 + SLIDES.length) % SLIDES.length)}
              className="px-3 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/[0.1] transition"
            >
              ← Prev
            </button>
            <button
              onClick={() => {
                if (currentSlide < SLIDES.length - 1) {
                  goToSlide(currentSlide + 1);
                } else {
                  onClose?.();
                }
              }}
              className="px-3 py-1 rounded-lg text-[10px] font-bold bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 transition"
            >
              {currentSlide < SLIDES.length - 1 ? "Next →" : "Close ✓"}
            </button>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="px-5 py-2 bg-violet-950/20 border-t border-violet-500/10 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            👆 Citizen portal — open at{" "}
            <span className="text-violet-400">/dashboard/citizen</span> to interact live
          </p>
        </div>
      </div>
    </div>
  );
}
