"use client";

import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Play, Square, Radio, Activity, Sparkles } from "lucide-react";
import {
  ensurePlayableAudioUrl,
  playTacticalVoiceComms,
  stopTacticalVoiceComms,
  createTacticalRadioWav,
} from "@/lib/audioUtils";

interface TacticalVoicePlayerProps {
  audioUrl?: string;
  transcript?: string;
  role?: "citizen" | "rescue";
  durationMs?: number;
  className?: string;
  compact?: boolean;
}

export default function TacticalVoicePlayer({
  audioUrl,
  transcript,
  role = "rescue",
  durationMs = 3000,
  className = "",
  compact = false,
}: TacticalVoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string>(() =>
    ensurePlayableAudioUrl(audioUrl, (durationMs || 3000) / 1000)
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Update resolved URL if audioUrl prop changes
  useEffect(() => {
    setResolvedAudioUrl(ensurePlayableAudioUrl(audioUrl, (durationMs || 3000) / 1000));
  }, [audioUrl, durationMs]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTacticalVoiceComms();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopTacticalVoiceComms();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);

      // Try playing native audio element first if available
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }

      // Also trigger speech synthesis with tactical radio chirp
      playTacticalVoiceComms(transcript || "Tactical mesh comms audio received on Channel 7.", {
        audioUrl: resolvedAudioUrl,
        role,
        onEnd: () => {
          setIsPlaying(false);
        },
      });
    }
  };

  const handleAudioError = () => {
    // If native audio encountered an error (e.g. invalid blob URL), auto-repair to synthetic tactical WAV
    const repaired = createTacticalRadioWav((durationMs || 3000) / 1000);
    setResolvedAudioUrl(repaired);
  };

  const isRescue = role === "rescue";
  const durationSec = Math.max(2, Math.round((durationMs || 3000) / 1000));

  return (
    <div
      className={`rounded-xl border p-2.5 space-y-2 transition-all ${
        isRescue
          ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-100"
          : "border-amber-500/30 bg-amber-950/40 text-amber-100"
      } ${className}`}
    >
      {/* Play Controls Header */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition active:scale-95 shadow-md ${
            isPlaying
              ? "bg-red-600 text-white animate-pulse"
              : isRescue
              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
              : "bg-amber-600 hover:bg-amber-500 text-slate-950"
          }`}
        >
          {isPlaying ? (
            <>
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Stop Playback</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Play {isRescue ? "Squad Voice" : "Citizen SOS"}</span>
            </>
          )}
        </button>

        {/* Live Audio Equalizer Animation */}
        <div className="flex items-center gap-1">
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-4 px-2 py-0.5 rounded bg-black/40 border border-white/10">
              {[60, 100, 40, 90, 75, 45, 80].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-emerald-400 rounded-xs animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDuration: `${0.3 + (i % 3) * 0.2}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Radio className="h-3 w-3 text-emerald-400" />
              0:0{durationSec} / 0:0{durationSec}
            </span>
          )}
        </div>
      </div>

      {/* Native HTML Audio Element (Guaranteed non-dead source) */}
      <audio
        ref={audioRef}
        controls
        playsInline
        preload="auto"
        src={resolvedAudioUrl}
        onError={handleAudioError}
        onPlay={() => setIsPlaying(true)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-8 opacity-90 contrast-125"
      />
    </div>
  );
}
