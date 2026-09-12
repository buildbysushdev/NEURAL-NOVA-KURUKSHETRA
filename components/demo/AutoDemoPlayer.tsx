'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Play, Square, ChevronRight, Zap, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  clearDemoState,
  getDemoState,
  setDemoState,
  wait,
  type DemoScenario,
} from '@/lib/demo/demoOrchestrator';

type Step = {
  id: string;
  title: string;
  detail: string;
  durationMs: number;
  speechText?: string;
  run: () => Promise<void>;
};

export default function AutoDemoPlayer({
  onRefresh,
  onSwitchTab,
}: {
  onRefresh?: () => void;
  onSwitchTab?: (tab: string) => void;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const stopRef = useRef(false);

  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((p) => [`[${time}] ${msg}`, ...p].slice(0, 16));
  };

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const go = async (path: string) => {
    router.push(path);
    await wait(1400); // let page mount
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.location.href = path;
    }
  };

  // Check if returning from other portals mid-demo
  useEffect(() => {
    const checkState = () => {
      const state = getDemoState();
      if (!state?.active) {
        if (running) setRunning(false);
        return;
      }

      setScenario(state.scenario);
      if (state.logs && state.logs.length > 0) {
        setLogs((prev) => Array.from(new Set([...state.logs!, ...prev])).slice(0, 16));
      }

      // If returning from Citizen portal to Authority to complete loop
      if (state.step === 'return-authority') {
        setRunning(true);
        log('↩️ Returned to Authority Command HQ');
        log('🏁 Closed-Loop Orchestration Complete: Detect → Decide → Dispatch → Field Squad → Citizen Safety loop sealed!');
        toast.success('🏆 Closed-Loop Relief Mission Sealed', {
          description:
            'Full autonomous loop verified across Authority HQ, Rescue Squad Alpha, and Citizen Safety Portal!',
          duration: 7000,
        });
        speak('Closed loop relief mission sealed across all three portals.');
        setDemoState({
          ...state,
          step: 'complete',
          updatedAt: Date.now(),
        });
        setTimeout(() => {
          setRunning(false);
          clearDemoState();
        }, 5000);
      }
    };

    checkState();
    window.addEventListener('kurukshetra-demo-updated', checkState);
    return () => window.removeEventListener('kurukshetra-demo-updated', checkState);
  }, []);

  const buildBlueFloodSteps = (): Step[] => [
    {
      id: 'boot',
      title: 'Arm multi-agent war room',
      detail: 'Sentinel + Analyst + Strategist online',
      durationMs: 1000,
      speechText: 'Arming multi-agent war room. Sentinel, Analyst, and Strategist online.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'blue-flood',
          step: 'boot',
          updatedAt: Date.now(),
          logs: ['🟢 Pipeline armed: Sentinel & Strategist online'],
        });
        log('🟢 Pipeline armed: Sentinel & Strategist online');
        if (onSwitchTab) onSwitchTab('simulator');
      },
    },
    {
      id: 'simulate',
      title: 'Inject Marina flood cluster',
      detail: 'Authority simulate endpoint + map markers',
      durationMs: 1800,
      speechText: 'Injecting coastal flash flood cluster along Marina waterfront.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'blue-flood',
          step: 'simulate',
          updatedAt: Date.now(),
          logs: ['🚨 Flood simulation fired. NASA FIRMS and USGS telemetry synced.'],
        });
        log('🚨 Flood simulation fired');
        try {
          await fetch('/api/demo/simulate-disaster', { method: 'POST' });
        } catch {}
        const btn = document.querySelector('[data-demo="simulate-btn"]') as HTMLElement | null;
        btn?.click();
        if (onRefresh) onRefresh();
      },
    },
    {
      id: 'approve',
      title: 'Human-in-loop approval',
      detail: 'Commander ratifies AI allocation',
      durationMs: 1500,
      speechText: 'Commander ratifies AI tactical resource allocation.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'blue-flood',
          step: 'approve',
          updatedAt: Date.now(),
          logs: ['✅ Allocation approved by Incident Commander.'],
        });
        log('✅ Tactical allocation approved');
        const btn = document.querySelector('[data-demo="approve-btn"]') as HTMLElement | null;
        btn?.click();
      },
    },
    {
      id: 'to-rescue',
      title: 'Shift to Rescue Portal',
      detail: 'Handing mission cards to field squads',
      durationMs: 1000,
      speechText: 'Routing dispatch orders to Rescue Squad Alpha field console.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'blue-flood',
          step: 'rescue-accept',
          updatedAt: Date.now(),
          logs: ['➡️ Routing to Rescue console'],
        });
        log('➡️ Routing to Rescue Squad console');
        await go('/dashboard/rescue');
      },
    },
  ];

  const buildRedInfernoSteps = (): Step[] => [
    {
      id: 'boot',
      title: 'Thermal crisis mode',
      detail: 'FIRMS hotspot + hospital risk cone',
      durationMs: 1000,
      speechText: 'Thermal crisis mode activated. Toxic smoke plume model engaged.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'red-inferno',
          step: 'boot',
          updatedAt: Date.now(),
          logs: ['🔥 Red Inferno armed: Industrial chemical plume alert'],
        });
        log('🔥 Red Inferno armed');
        if (onSwitchTab) onSwitchTab('simulator');
      },
    },
    {
      id: 'simulate',
      title: 'Inject industrial fire wave',
      detail: 'Fire + toxic plume scenario',
      durationMs: 1800,
      speechText: 'Injecting industrial chemical fire with toxic smoke cone.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'red-inferno',
          step: 'simulate',
          updatedAt: Date.now(),
          logs: ['🚨 Chemical fire simulation fired'],
        });
        log('🚨 Chemical fire simulation fired');
        try {
          await fetch('/api/demo/simulate-disaster', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario: 'red-inferno' }),
          });
        } catch {}
        const btn = document.querySelector('[data-demo="simulate-btn"]') as HTMLElement | null;
        btn?.click();
        if (onRefresh) onRefresh();
      },
    },
    {
      id: 'approve',
      title: 'Authorize multi-team package',
      detail: 'Fire tender + HAZMAT + hospital exclusion',
      durationMs: 1500,
      speechText: 'Authorizing multi-agency HAZMAT response and hospital exclusion.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'red-inferno',
          step: 'approve',
          updatedAt: Date.now(),
          logs: ['✅ Multi-team HAZMAT dispatch approved'],
        });
        log('✅ Multi-team HAZMAT dispatch approved');
        const btn = document.querySelector('[data-demo="approve-btn"]') as HTMLElement | null;
        btn?.click();
      },
    },
    {
      id: 'to-rescue',
      title: 'Shift to Rescue Portal',
      detail: 'Field units receive inferno tasks',
      durationMs: 1000,
      speechText: 'Dispatching tactical fire and rescue units.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'red-inferno',
          step: 'rescue-accept',
          updatedAt: Date.now(),
          logs: ['➡️ Routing to Rescue console'],
        });
        log('➡️ Routing to Rescue console');
        await go('/dashboard/rescue');
      },
    },
  ];

  const run = async (type: DemoScenario) => {
    stopRef.current = false;
    setRunning(true);
    setScenario(type);
    setStepIndex(-1);
    setLogs([]);

    const steps = type === 'blue-flood' ? buildBlueFloodSteps() : buildRedInfernoSteps();
    log(`▶ ${type === 'blue-flood' ? 'Operation Blue Flood' : 'Operation Red Inferno'} launched`);

    for (let i = 0; i < steps.length; i++) {
      if (stopRef.current) break;
      setStepIndex(i);
      log(`→ ${steps[i].title}`);
      if (steps[i].speechText) speak(steps[i].speechText!);
      try {
        await steps[i].run();
      } catch (e) {
        console.error(e);
        log(`⚠ step error: ${steps[i].id}`);
      }
      await wait(steps[i].durationMs);
    }
  };

  const stop = () => {
    stopRef.current = true;
    setRunning(false);
    clearDemoState();
    log('■ Demo stopped');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[90] w-[390px] max-w-[94vw] animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="rounded-2xl border border-white/10 bg-[#0B1220]/96 p-4 shadow-2xl backdrop-blur-xl border-t-2 border-t-violet-500/50">
        
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-lg shadow-violet-500/10">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-100">AI Demo Director</p>
                <span className="px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-mono text-[9px] font-bold">
                  CROSS-PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Autonomous closed-loop choreography</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-1.5 rounded-lg border transition ${
                voiceEnabled
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
              title={voiceEnabled ? 'Voice narration ON' : 'Voice narration OFF'}
            >
              {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>

            {running ? (
              <button
                onClick={stop}
                className="rounded-xl border border-red-500/40 bg-red-500/20 hover:bg-red-500/30 px-2.5 py-1 text-[10px] font-bold text-red-300 transition flex items-center gap-1"
              >
                <Square className="h-3 w-3" /> STOP
              </button>
            ) : (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                READY
              </span>
            )}
          </div>
        </div>

        {/* Action Trigger Cards (When Idle) */}
        {!running && (
          <div className="mb-3 space-y-2">
            <button
              onClick={() => run('blue-flood')}
              className="flex w-full items-center justify-between rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-[#0E1B31] to-cyan-950/30 hover:border-blue-500/60 p-3 text-left transition shadow-md group"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition">
                    Operation Blue Flood
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">
                    Coastal Surge
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Authority → Rescue → Citizen → Closed Loop
                </p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 group-hover:bg-blue-400 text-white shadow-md shadow-blue-500/30 transition">
                <Play className="h-3.5 w-3.5 fill-white" />
              </div>
            </button>

            <button
              onClick={() => run('red-inferno')}
              className="flex w-full items-center justify-between rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-[#1C121A] to-amber-950/30 hover:border-red-500/60 p-3 text-left transition shadow-md group"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-red-300 transition">
                    Operation Red Inferno
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-semibold">
                    Chemical Fire
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  HAZMAT plume full-loop across 3 portals
                </p>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 group-hover:bg-red-400 text-white shadow-md shadow-red-500/30 transition">
                <Play className="h-3.5 w-3.5 fill-white" />
              </div>
            </button>
          </div>
        )}

        {/* Running Banner */}
        {running && (
          <div className="mb-3 rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                Cross-Portal Autopilot Active
              </p>
              <p className="text-xs font-bold text-slate-100 mt-0.5">
                {scenario === 'blue-flood' ? '🌊 Operation Blue Flood' : '🔥 Operation Red Inferno'}
              </p>
            </div>
            <div className="px-2 py-0.5 rounded-lg bg-violet-500/20 text-violet-300 font-mono text-[10px] font-bold">
              Step {Math.max(1, stepIndex + 1)}
            </div>
          </div>
        )}

        {/* Telemetry Log Feed */}
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-white/5 bg-black/30 p-2.5 scrollbar-thin">
          {logs.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic">Ready for hands-free cross-portal autonomous demonstration.</p>
          ) : (
            logs.map((l, i) => (
              <div key={i} className="flex items-start gap-1 text-[10px] text-slate-300">
                <ChevronRight className="mt-0.5 h-3 w-3 text-violet-400 shrink-0" />
                <span className="font-mono leading-tight">{l}</span>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Auto portal shifts + field tasks</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 font-mono">
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span>Closed-Loop</span>
          </div>
        </div>
      </div>
    </div>
  );
}
