'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Play,
  Square,
  ChevronRight,
  Zap,
  Volume2,
  VolumeX,
  Sparkles,
  Minus,
  Maximize2,
  AlertTriangle,
  ArrowRightLeft,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { CitizenShowcase } from '@/components/demo/CitizenShowcase';
import {
  clearDemoState,
  getDemoState,
  setDemoState,
  wait,
  type DemoScenario,
} from '@/lib/demo/demoOrchestrator';


// ─── Supply Redirect Logic ────────────────────────────────────────────────────
type SupplyZone = {
  id: string;
  name: string;
  stock: number;
};

const DEMO_SUPPLY_ZONES: SupplyZone[] = [
  { id: 'zone-a', name: 'Marina North Depot', stock: 40 },
  { id: 'zone-b', name: 'Coastal Relief Hub', stock: 120 },
  { id: 'zone-c', name: 'Emergency Warehouse B', stock: 200 },
  { id: 'zone-d', name: 'Southern Staging Point', stock: 180 },
];

function getSupplyAllocation(
  requiredUnits: number,
  preferredZoneId: string
): { zone: SupplyZone; redirected: boolean; reason?: string } {
  const preferred = DEMO_SUPPLY_ZONES.find((z) => z.id === preferredZoneId);
  if (preferred && preferred.stock >= requiredUnits) {
    return { zone: preferred, redirected: false };
  }
  const alternative = DEMO_SUPPLY_ZONES
    .filter((z) => z.id !== preferredZoneId && z.stock >= requiredUnits)
    .sort((a, b) => b.stock - a.stock)[0];
  if (alternative) {
    return {
      zone: alternative,
      redirected: true,
      reason: preferred
        ? `${preferred.name} has only ${preferred.stock} units (need ${requiredUnits})`
        : 'Primary zone unavailable',
    };
  }
  const fallback = [...DEMO_SUPPLY_ZONES].sort((a, b) => b.stock - a.stock)[0];
  return { zone: fallback, redirected: true, reason: 'All primary zones low — consolidated dispatch' };
}

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
  const [isMinimized, setIsMinimized] = useState(false);
  const [scenario, setScenario] = useState<DemoScenario | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);
  const [totalSteps, setTotalSteps] = useState(5);
  const [logs, setLogs] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [supplyRedirectInfo, setSupplyRedirectInfo] = useState<{
    from: string; to: string; reason: string;
  } | null>(null);
  const [showCitizenShowcase, setShowCitizenShowcase] = useState(false);
  const stopRef = useRef(false);


  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((p) => [`[${time}] ${msg}`, ...p].slice(0, 22));
  };

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92; // Slightly slower for clarity
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const go = async (path: string) => {
    router.push(path);
    await wait(2800); // Longer wait — let page fully mount before actors run
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
          setSupplyRedirectInfo(null);
        }, 7000);
      }
    };

    checkState();
    window.addEventListener('kurukshetra-demo-updated', checkState);
    return () => window.removeEventListener('kurukshetra-demo-updated', checkState);
  }, []);

  const buildBlueFloodSteps = (): Step[] => [
    {
      id: 'boot',
      title: '🟢 Arm multi-agent war room',
      detail: 'Sentinel + Analyst + Strategist online',
      durationMs: 3500,
      speechText: 'Arming multi-agent war room. Sentinel, Analyst, and Strategist are now online and monitoring all coastal sensors.',
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
        await wait(1400);
        log('📡 Satellite uplink established — USGS stream active');
        await wait(900);
        log('🤖 AI Allocation Engine warm-up complete');
      },
    },
    {
      id: 'simulate',
      title: '🚨 Inject Marina flood cluster',
      detail: '4 zones detected — severity mapped on authority dashboard',
      durationMs: 5000,
      speechText: 'Injecting coastal flash flood cluster. Four distress zones detected along Marina waterfront with varying severity levels.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'blue-flood',
          step: 'simulate',
          updatedAt: Date.now(),
          logs: ['🚨 Flood simulation fired. NASA FIRMS and USGS telemetry synced.'],
        });
        log('🚨 Flood simulation fired');
        await wait(700);
        try {
          await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario: 'blue-flood' }),
          });
        } catch {}
        await wait(500);
        const btn = document.querySelector('[data-demo="simulate-btn"]') as HTMLElement | null;
        btn?.click();
        await wait(800);
        log('📍 Zone A: Marina North — CRITICAL (storm surge 2.4m)');
        await wait(700);
        log('📍 Zone B: Coastal Colony — HIGH (1.8m surge, 340 displaced)');
        await wait(700);
        log('📍 Zone C: Fishermen Harbour — MEDIUM (evacuation in progress)');
        await wait(700);
        log('📍 Zone D: Relief Camp Alpha — LOW (needs supply coordination)');
        if (onRefresh) onRefresh();
      },
    },
    {
      id: 'supply-check',
      title: '📦 AI supply prioritization',
      detail: 'Zone A depleted → AI redirects to nearest alternative depot',
      durationMs: 4000,
      speechText: 'Running AI supply allocation engine. Zone A shows depleted stock. System automatically redirects to the nearest alternative depot — saving significant transit time versus fresh allocation.',
      run: async () => {
        log('📦 Checking inventory across all 4 supply zones...');
        await wait(1400);
        const alloc = getSupplyAllocation(80, 'zone-a');
        await wait(900);
        if (alloc.redirected) {
          const redirectData = {
            from: 'Marina North Depot (Zone A)',
            to: alloc.zone.name,
            reason: alloc.reason || 'Stock exhausted',
          };
          setSupplyRedirectInfo(redirectData);
          log(`⚠️ Zone A DEPLETED — ${alloc.reason}`);
          await wait(700);
          log(`↪️ AI REDIRECT → ${alloc.zone.name} (${alloc.zone.stock} units available)`);
          await wait(500);
          toast.warning('⚠️ Supply Redirect Triggered', {
            description: `${redirectData.from} is depleted. AI rerouted to ${redirectData.to} — saves ~38 min vs fresh allocation.`,
            duration: 6000,
          });
        } else {
          log('✅ Zone A stock sufficient — direct dispatch confirmed');
        }
        await wait(700);
        log('🤖 Priority order: Zone A → B → C → D (severity × resource gap)');
      },
    },
    {
      id: 'approve',
      title: '✅ Human-in-loop approval',
      detail: 'Commander reviews + ratifies AI allocation plan',
      durationMs: 4500,
      speechText: 'Commander reviewing the AI tactical resource allocation plan. Human oversight confirmed before dispatch is authorized.',
      run: async () => {
        log('⏳ Presenting AI allocation plan to Incident Commander...');
        await wait(1800);
        setDemoState({
          active: true,
          scenario: 'blue-flood',
          step: 'approve',
          updatedAt: Date.now(),
          logs: ['✅ Allocation approved by Incident Commander.'],
        });
        await wait(700);
        log('✅ Commander APPROVED tactical allocation');
        await wait(400);
        const btn = document.querySelector('[data-demo="approve-btn"]') as HTMLElement | null;
        btn?.click();
        await wait(900);
        log('📋 Audit trail logged — human approval timestamp: ' + new Date().toLocaleTimeString());
      },
    },
    {
      id: 'citizen-showcase',
      title: '👁️ Citizen Portal Feature Preview',
      detail: 'Offline AI · Walkie-Talkie · Safe Shelters · Map · Alerts — shown without redirecting',
      durationMs: 26000, // 5 slides × ~5s each + buffer
      speechText: 'Now showcasing the Citizen Safety Portal features — offline AI guidance, mesh walkie-talkie, safe shelter locator, incident map, and government alerts.',
      run: async () => {
        log('📱 Showcasing Citizen Portal features...');
        await wait(600);
        log('📴 Offline AI: 10 emergency Q&A categories — works without internet');
        await wait(1200);
        log('🎙️ Walkie-Talkie: PTT + speech-to-text + GPS lock');
        await wait(1200);
        log('🏫 Safe Shelter Locator: live occupancy, safe routes, medical team status');
        await wait(1200);
        log('🗺️ Alert Map: NASA FIRMS + USGS real-time hazard zones');
        await wait(1200);
        log('🚨 Government Alerts: authority-issued evacuation directives');
        setShowCitizenShowcase(true);
        speak('Citizen portal features now displayed. Five key safety features shown in sequence.');
        // Showcase auto-closes after slides complete (~25s)
        await wait(25000);
        setShowCitizenShowcase(false);
      },
    },
    {
      id: 'to-rescue',
      title: '➡️ Handoff to Rescue Portal',
      detail: 'Mission cards + route animation dispatched to Rescue Squad Alpha',
      durationMs: 3200,
      speechText: 'Routing dispatch orders to Rescue Squad Alpha field console. Field units receive mission cards with route animation.',
      run: async () => {
        log('📡 Broadcasting mission orders to Rescue Squad Alpha...');
        await wait(1200);
        setDemoState({
          active: true,
          scenario: 'blue-flood',
          step: 'rescue-accept',
          updatedAt: Date.now(),
          logs: ['➡️ Routing to Rescue console'],
        });
        await wait(600);
        log('➡️ Navigating to Rescue Squad console...');
        await go('/dashboard/rescue');
      },
    },
  ];


  const buildRedInfernoSteps = (): Step[] => [
    {
      id: 'boot',
      title: '🔥 Thermal crisis mode',
      detail: 'FIRMS hotspot + hospital exclusion cone activated',
      durationMs: 3500,
      speechText: 'Thermal crisis mode activated. Industrial chemical fire detected. Toxic smoke plume dispersion model now engaged.',
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
        await wait(1400);
        log('🌫️ Toxic plume model — wind NE @ 22 km/h, spread radius: 4km');
        await wait(900);
        log('🏥 Hospital exclusion cone calculated — 2km radius St. Mary');
      },
    },
    {
      id: 'simulate',
      title: '🚨 Inject industrial fire wave',
      detail: '4 zones — fire + toxic plume + hospital risk',
      durationMs: 5000,
      speechText: 'Injecting industrial chemical fire scenario. Four zones affected — active fire, toxic exposure, hospital risk, and secondary ignition.',
      run: async () => {
        setDemoState({
          active: true,
          scenario: 'red-inferno',
          step: 'simulate',
          updatedAt: Date.now(),
          logs: ['🚨 Chemical fire simulation fired'],
        });
        log('🚨 Chemical fire simulation fired');
        await wait(700);
        try {
          await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scenario: 'red-inferno' }),
          });
        } catch {}
        await wait(500);
        const btn = document.querySelector('[data-demo="simulate-btn"]') as HTMLElement | null;
        btn?.click();
        await wait(800);
        log('🔥 Zone 1: Industrial Sector — CRITICAL (active chemical fire)');
        await wait(700);
        log('🌫️ Zone 2: Downwind Residential — HIGH (toxic CO₂ exposure)');
        await wait(700);
        log('🏥 Zone 3: St. Mary Hospital — MEDIUM (evacuation advisory)');
        await wait(700);
        log('🧯 Zone 4: Chemical Plant B — HIGH (secondary ignition risk)');
        if (onRefresh) onRefresh();
      },
    },
    {
      id: 'supply-check',
      title: '📦 HAZMAT supply prioritization',
      detail: 'SCBA kit depot exhausted → AI redirects to nearest alternative',
      durationMs: 4000,
      speechText: 'Running HAZMAT supply allocation. Checking SCBA kits and chemical neutralizer stocks. Primary depot exhausted — AI rerouting to nearest alternative.',
      run: async () => {
        log('📦 Checking HAZMAT inventory across depots...');
        await wait(1400);
        const alloc = getSupplyAllocation(60, 'zone-a');
        await wait(900);
        if (alloc.redirected) {
          const redirectData = {
            from: 'Marina North Depot (HAZMAT Primary)',
            to: alloc.zone.name,
            reason: alloc.reason || 'HAZMAT stock exhausted',
          };
          setSupplyRedirectInfo(redirectData);
          log(`⚠️ HAZMAT depot EXHAUSTED — ${alloc.reason}`);
          await wait(700);
          log(`↪️ AI REDIRECT → ${alloc.zone.name} (${alloc.zone.stock} units available)`);
          await wait(500);
          toast.warning('⚠️ HAZMAT Supply Redirect', {
            description: `Primary depot depleted. AI rerouted SCBA kits to ${alloc.zone.name} — saves ~25 min vs fresh allocation.`,
            duration: 6000,
          });
        }
        await wait(700);
        log('🤖 HAZMAT priority: Chemical Plant B > Industrial > Residential');
      },
    },
    {
      id: 'approve',
      title: '✅ Authorize multi-team HAZMAT package',
      detail: 'Fire tender + HAZMAT team + hospital exclusion zone',
      durationMs: 4500,
      speechText: 'Commander authorizing multi-agency HAZMAT response. Fire tender plus three SCBA teams plus hospital exclusion zone confirmed.',
      run: async () => {
        log('⏳ Commander reviewing multi-agency HAZMAT package...');
        await wait(1800);
        setDemoState({
          active: true,
          scenario: 'red-inferno',
          step: 'approve',
          updatedAt: Date.now(),
          logs: ['✅ Multi-team HAZMAT dispatch approved'],
        });
        await wait(700);
        log('✅ Multi-team HAZMAT dispatch APPROVED');
        await wait(400);
        const btn = document.querySelector('[data-demo="approve-btn"]') as HTMLElement | null;
        btn?.click();
        await wait(900);
        log('📋 HAZMAT approval logged — fire tender + 3 SCBA teams dispatched');
      },
    },
    {
      id: 'citizen-showcase',
      title: '👁️ Citizen Portal Feature Preview',
      detail: 'Offline AI · Walkie-Talkie · Shelters · Map — shown without redirecting',
      durationMs: 26000,
      speechText: 'Showcasing Citizen Safety Portal — offline AI, mesh radio, safe shelters, and hazard map features.',
      run: async () => {
        log('📱 Showcasing Citizen Portal features...');
        await wait(600);
        log('📴 Offline AI: HAZMAT Q&A + fire evacuation corridor guidance');
        await wait(1200);
        log('🎙️ Walkie-Talkie: PTT + speech-to-text + GPS + offline mesh');
        await wait(1200);
        log('🏫 Safe Shelter Locator: live occupancy, food rations, safe routes');
        await wait(1200);
        log('🗺️ Hazard Map: NASA FIRMS + plume dispersion overlay');
        setShowCitizenShowcase(true);
        speak('Citizen portal features now displayed.');
        await wait(25000);
        setShowCitizenShowcase(false);
      },
    },
    {
      id: 'to-rescue',
      title: '➡️ Handoff to Rescue Portal',
      detail: 'HAZMAT tasks + route animation dispatched to Rescue field console',
      durationMs: 3200,
      speechText: 'Dispatching tactical fire and rescue units to the field console.',
      run: async () => {
        log('📡 Broadcasting HAZMAT orders to Rescue Squad Alpha...');
        await wait(1200);
        setDemoState({
          active: true,
          scenario: 'red-inferno',
          step: 'rescue-accept',
          updatedAt: Date.now(),
          logs: ['➡️ Routing to Rescue console'],
        });
        await wait(600);
        log('➡️ Navigating to Rescue console...');
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
    setSupplyRedirectInfo(null);

    const steps = type === 'blue-flood' ? buildBlueFloodSteps() : buildRedInfernoSteps();
    setTotalSteps(steps.length);
    log(`▶ ${type === 'blue-flood' ? 'Operation Blue Flood' : 'Operation Red Inferno'} launched`);
    await wait(600); // Short breath before starting

    for (let i = 0; i < steps.length; i++) {
      if (stopRef.current) break;
      setStepIndex(i);
      log(`→ Step ${i + 1}/${steps.length}: ${steps[i].title}`);
      if (steps[i].speechText) speak(steps[i].speechText!);
      // Announce step to audience via toast
      toast.info(`Step ${i + 1}/${steps.length}`, {
        description: steps[i].detail,
        duration: 3000,
      });
      await wait(1500); // Pre-step pause — lets presenter explain what's about to happen
      try {
        await steps[i].run();
      } catch (e) {
        console.error(e);
        log(`⚠ step error: ${steps[i].id}`);
      }
      await wait(steps[i].durationMs); // Post-step hold — audience can clearly see what changed
    }
  };

  const stop = () => {
    stopRef.current = true;
    setRunning(false);
    clearDemoState();
    setSupplyRedirectInfo(null);
    log('■ Demo stopped');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 left-6 z-[90] animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-3 rounded-2xl border border-violet-500/40 bg-[#0B1220]/95 px-3.5 py-2 shadow-2xl backdrop-blur-xl border-t-2 border-t-violet-400 hover:border-violet-400 cursor-pointer transition-all hover:scale-[1.02]"
          title="Click to expand AI Demo Director"
        >
          <div className="relative flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-500/10">
            <Bot className="h-4 w-4" />
            {running && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 group-hover:text-violet-300 transition">
                AI Demo Director
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  running
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {running ? `STEP ${Math.max(1, stepIndex + 1)}` : 'READY'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[170px]">
              {running
                ? scenario === 'blue-flood'
                  ? '🌊 Blue Flood Active'
                  : '🔥 Red Inferno Active'
                : 'Click to expand war room'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/10">
            {running && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  stop();
                }}
                className="rounded-lg border border-red-500/40 bg-red-500/20 hover:bg-red-500/30 px-2 py-1 text-[10px] font-bold text-red-300 transition flex items-center gap-1"
                title="Stop Auto Demo"
              >
                <Square className="h-2.5 w-2.5" /> STOP
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(false);
              }}
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition"
              title="Expand AI Demo Director"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] transition"
              title="Minimize AI Demo Director"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Action Trigger Cards (When Idle) */}
        {!running && (
          <div className="mb-3 space-y-2">
            <div className="flex items-start gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-2 mb-1">
              <Sparkles className="h-3 w-3 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Runs <strong className="text-slate-300">step-by-step with pauses</strong> so you can explain each action. Supply redirect included.
              </p>
            </div>

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
                  Authority → Supply Redirect → Rescue → Citizen → Closed Loop
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
                  HAZMAT plume + supply redirect + 3-portal closed loop
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
          <div className="mb-2 rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                Cross-Portal Autopilot Active
              </p>
              <p className="text-xs font-bold text-slate-100 mt-0.5">
                {scenario === 'blue-flood' ? '🌊 Operation Blue Flood' : '🔥 Operation Red Inferno'}
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 font-mono text-[11px] font-bold">
              {Math.max(1, stepIndex + 1)}/{totalSteps}
            </div>
          </div>
        )}

        {/* Supply Redirect Alert */}
        {supplyRedirectInfo && (
          <div className="mb-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5">
            <div className="flex items-start gap-2">
              <ArrowRightLeft className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  AI Supply Redirect
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  <span className="text-red-300 line-through">{supplyRedirectInfo.from}</span>
                  {' → '}
                  <span className="text-emerald-300 font-semibold">{supplyRedirectInfo.to}</span>
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{supplyRedirectInfo.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Log Feed */}
        <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/5 bg-black/30 p-2.5 scrollbar-thin">
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

      {/* Citizen Portal Feature Showcase Overlay */}
      <CitizenShowcase
        visible={showCitizenShowcase}
        onClose={() => setShowCitizenShowcase(false)}
        autoPlay={true}
      />
    </div>
  );
}
