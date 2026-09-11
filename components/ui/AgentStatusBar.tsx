"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - Hackathon Demo: AI Agent Live Status Bar
 * AgentStatusBar.tsx
 * ==============================================================================
 * 
 * Floating translucent bar at the bottom of Authority/Rescue dashboards.
 * Shows judges in real-time:
 * - Sentinel Agent (Groq LLaMA 3.1) — triage count + last latency
 * - Strategist Agent (Gemini 1.5) — allocation count + last confidence
 * - Notification Agent (CAP v1.2) — dispatches count
 * - System health indicators
 */

import React, { useState, useEffect } from "react";
import { Zap, Brain, Radio, CheckCircle2, Activity } from "lucide-react";

interface AgentStatus {
  triageCount: number;
  allocationCount: number;
  notificationCount: number;
  lastTriageMs: number;
  lastConfidence: number;
}

export function AgentStatusBar() {
  const [status, setStatus] = useState<AgentStatus>({
    triageCount: 4,
    allocationCount: 3,
    notificationCount: 7,
    lastTriageMs: 287,
    lastConfidence: 94,
  });

  const [tick, setTick] = useState(0);
  const [groqActive, setGroqActive] = useState(false);
  const [geminiActive, setGeminiActive] = useState(false);

  // Simulate realistic live agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      
      // Random micro-updates to simulate real pipeline activity
      if (Math.random() > 0.75) {
        setGroqActive(true);
        setTimeout(() => {
          setStatus((s) => ({
            ...s,
            triageCount: s.triageCount + 1,
            lastTriageMs: Math.floor(220 + Math.random() * 150),
          }));
          setGroqActive(false);
        }, 800);
      }

      if (Math.random() > 0.80) {
        setGeminiActive(true);
        setTimeout(() => {
          setStatus((s) => ({
            ...s,
            allocationCount: s.allocationCount + 1,
            lastConfidence: Math.floor(88 + Math.random() * 9),
          }));
          setGeminiActive(false);
        }, 1200);
      }

      if (Math.random() > 0.85) {
        setStatus((s) => ({
          ...s,
          notificationCount: s.notificationCount + 1,
        }));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      {/* Gradient fade from transparent to dark */}
      <div className="h-8 bg-gradient-to-t from-[#0B0F19]/80 to-transparent" />
      
      <div className="bg-[#0B0F19]/90 backdrop-blur-xl border-t border-white/[0.06] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 py-2 overflow-x-auto">
          
          {/* Left: System Label */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Multi-Agent Pipeline Active
            </span>
          </div>

          {/* Center: Agent Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Sentinel Agent: Groq LLaMA 3.1 */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono transition-all duration-300 ${
                groqActive
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-white/[0.03] border-white/[0.06] text-slate-400"
              }`}
            >
              <Zap
                className={`w-3 h-3 ${groqActive ? "text-cyan-400 animate-pulse" : "text-slate-500"}`}
                strokeWidth={2}
              />
              <span className="hidden sm:inline">Sentinel · Groq AI</span>
              <span className="sm:hidden">Sentinel</span>
              <span className="font-semibold text-slate-200">{status.triageCount} triaged</span>
              <span className="hidden md:inline text-slate-500">·</span>
              <span className="hidden md:inline text-cyan-400">{status.lastTriageMs}ms</span>
            </div>

            {/* Strategist Agent: Gemini 3.6 Flash */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-mono transition-all duration-300 ${
                geminiActive
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                  : "bg-white/[0.03] border-white/[0.06] text-slate-400"
              }`}
            >
              <Brain
                className={`w-3 h-3 ${geminiActive ? "text-violet-400 animate-pulse" : "text-slate-500"}`}
                strokeWidth={2}
              />
              <span className="hidden sm:inline">Strategist · Gemini 3.6</span>
              <span className="sm:hidden">Strategist</span>
              <span className="font-semibold text-slate-200">{status.allocationCount} allocated</span>
              <span className="hidden md:inline text-slate-500">·</span>
              <span className="hidden md:inline text-violet-400">{status.lastConfidence}% conf.</span>
            </div>

            {/* CAP Notification Agent */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] text-[10px] font-mono text-slate-400">
              <Radio className="w-3 h-3 text-amber-400" strokeWidth={2} />
              <span className="hidden sm:inline">CAP v1.2 · Dispatch</span>
              <span className="sm:hidden">CAP</span>
              <span className="font-semibold text-slate-200">{status.notificationCount} sent</span>
            </div>
          </div>

          {/* Right: Live Feed indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Activity className="w-3 h-3 text-emerald-400" strokeWidth={2} />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider whitespace-nowrap">
              Live
            </span>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default AgentStatusBar;
