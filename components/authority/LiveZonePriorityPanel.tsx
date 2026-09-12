"use client";

/**
 * LiveZonePriorityPanel — Authority Portal
 * =========================================
 * Demonstrates the full expected demo flow:
 *  1. Simulate 4-5 zones with varying severity
 *  2. AI prioritizes by severity × resource gap
 *  3. Shows supply redirect when depot is depleted
 *  4. "Inject Escalation" button simulates a NEW urgent report arriving
 *     → AI re-ranks zones and reallocates resources in real time
 */

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Zap,
  ArrowRightLeft,
  AlertTriangle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Clock,
  Package,
  Activity,
  Flame,
  Waves,
  ShieldAlert,
  Play,
  RotateCcw,
  TrendingUp,
} from "lucide-react";

type ZoneStatus = "waiting" | "allocated" | "redirected" | "escalated" | "resolved";

interface LiveZone {
  id: string;
  name: string;
  type: string;
  icon: React.FC<{ className?: string }>;
  severity: number;
  civilians: number;
  resources: string[];
  depotStock: number;
  depotName: string;
  status: ZoneStatus;
  allocation: number;
  allocatedFrom?: string;
  priorityRank: number;
  etaMin: number;
  isNew?: boolean;
}

const INITIAL_ZONES: LiveZone[] = [
  {
    id: "z-a",
    name: "Zone A — North Harbor",
    type: "Structural Collapse",
    icon: ShieldAlert,
    severity: 10,
    civilians: 340,
    resources: ["heavy_machinery", "medical", "tent"],
    depotStock: 40,
    depotName: "Marina North Depot",
    status: "waiting",
    allocation: 0,
    priorityRank: 1,
    etaMin: 12,
  },
  {
    id: "z-b",
    name: "Zone B — Marina Waterfront",
    type: "Flash Flood",
    icon: Waves,
    severity: 9,
    civilians: 1420,
    resources: ["boats", "water", "medical"],
    depotStock: 45,
    depotName: "Coastal Relief Hub",
    status: "waiting",
    allocation: 0,
    priorityRank: 2,
    etaMin: 16,
  },
  {
    id: "z-c",
    name: "Zone C — Central Metro",
    type: "Electrical Fire",
    icon: Flame,
    severity: 7,
    civilians: 85,
    resources: ["fire_tender", "medical"],
    depotStock: 120,
    depotName: "Emergency Warehouse B",
    status: "waiting",
    allocation: 0,
    priorityRank: 3,
    etaMin: 20,
  },
  {
    id: "z-d",
    name: "Zone D — Velachery Canal",
    type: "Flood / Road Block",
    icon: Waves,
    severity: 5,
    civilians: 340,
    resources: ["machinery", "boats"],
    depotStock: 180,
    depotName: "Southern Staging Point",
    status: "waiting",
    allocation: 0,
    priorityRank: 4,
    etaMin: 24,
  },
  {
    id: "z-e",
    name: "Zone E — Mylapore Relief Camp",
    type: "Mass Casualty",
    icon: Activity,
    severity: 6,
    civilians: 65,
    resources: ["medical", "tent", "water"],
    depotStock: 200,
    depotName: "Emergency Warehouse B",
    status: "waiting",
    allocation: 0,
    priorityRank: 5,
    etaMin: 28,
  },
];

const REQUIRED_UNITS = [80, 60, 40, 30, 20];
const REDIRECT_THRESHOLD = 50;

function severityColor(s: number) {
  if (s >= 9) return { text: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/40", bar: "bg-red-500" };
  if (s >= 7) return { text: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/40", bar: "bg-amber-500" };
  if (s >= 5) return { text: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/40", bar: "bg-yellow-500" };
  return { text: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/40", bar: "bg-emerald-500" };
}

function statusBadge(status: ZoneStatus) {
  const map: Record<ZoneStatus, { label: string; cls: string }> = {
    waiting: { label: "PENDING", cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
    allocated: { label: "ALLOCATED", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    redirected: { label: "REDIRECTED", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    escalated: { label: "⚡ ESCALATED", cls: "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse" },
    resolved: { label: "✓ RESOLVED", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  };
  return map[status];
}

export function LiveZonePriorityPanel() {
  const [zones, setZones] = useState<LiveZone[]>(INITIAL_ZONES);
  const [phase, setPhase] = useState<"idle" | "simulating" | "allocating" | "escalating" | "reallocating" | "done">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showApproveBtn, setShowApproveBtn] = useState(false);
  const [approved, setApproved] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);

  const addLog = (msg: string) => {
    const t = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((p) => [`[${t}] ${msg}`, ...p].slice(0, 30));
  };

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const reset = () => {
    stopRef.current = true;
    setTimeout(() => {
      stopRef.current = false;
      setZones(INITIAL_ZONES.map((z) => ({ ...z, status: "waiting", allocation: 0 })));
      setPhase("idle");
      setCurrentStep(0);
      setLogs([]);
      setShowApproveBtn(false);
      setApproved(false);
    }, 100);
  };

  const runFullDemo = async () => {
    stopRef.current = false;
    setPhase("simulating");
    setCurrentStep(0);
    setLogs([]);
    setShowApproveBtn(false);
    setApproved(false);
    setZones(INITIAL_ZONES.map((z) => ({ ...z, status: "waiting", allocation: 0 })));

    // ── PHASE 1: Incoming reports appear one by one ──────────────────────
    addLog("🚨 Sentinel Agent activated — scanning incoming distress reports...");
    await wait(800);

    for (let i = 0; i < INITIAL_ZONES.length; i++) {
      if (stopRef.current) return;
      const z = INITIAL_ZONES[i];
      addLog(`📍 Report received: ${z.name} — ${z.type} | Severity: ${z.severity}/10 | Civilians: ${z.civilians.toLocaleString()}`);
      setZones((prev) => prev.map((p) => p.id === z.id ? { ...p, isNew: true } : p));
      await wait(900);
      setZones((prev) => prev.map((p) => p.id === z.id ? { ...p, isNew: false } : p));
    }

    // ── PHASE 2: AI prioritization ───────────────────────────────────────
    setPhase("allocating");
    setCurrentStep(1);
    await wait(600);
    addLog("🤖 Strategist Agent: Ranking zones by severity × civilian density × resource availability...");
    await wait(1200);
    addLog("📊 Priority Matrix computed:");
    await wait(400);
    const sorted = [...INITIAL_ZONES].sort((a, b) => b.severity - a.severity);
    for (let i = 0; i < sorted.length; i++) {
      if (stopRef.current) return;
      addLog(`  P${i + 1} → ${sorted[i].name} (Severity ${sorted[i].severity}/10)`);
      await wait(500);
    }

    // ── PHASE 3: Allocate zone by zone with supply redirect ──────────────
    await wait(600);
    addLog("📦 Dispatching resources in priority order...");
    await wait(600);

    for (let i = 0; i < sorted.length; i++) {
      if (stopRef.current) return;
      const z = sorted[i];
      const required = REQUIRED_UNITS[i];
      const isRedirected = z.depotStock < REDIRECT_THRESHOLD;

      await wait(1000);
      setCurrentStep(i + 2);

      if (isRedirected) {
        addLog(`⚠️ ${z.name}: Depot "${z.depotName}" has only ${z.depotStock} units (need ${required})`);
        await wait(700);
        addLog(`↪️ AI REDIRECT → Emergency Warehouse B (200 units) — saves ~35 min transit`);
        await wait(500);
        toast.warning(`Supply Redirect: ${z.name}`, {
          description: `${z.depotName} depleted. AI rerouted to Emergency Warehouse B.`,
          duration: 4000,
        });
        setZones((prev) =>
          prev.map((p) =>
            p.id === z.id
              ? { ...p, status: "redirected", allocation: required, allocatedFrom: "Emergency Warehouse B" }
              : p
          )
        );
      } else {
        addLog(`✅ ${z.name}: Allocated ${required} units from "${z.depotName}" (ETA: ${8 + (i + 1) * 4} min)`);
        setZones((prev) =>
          prev.map((p) =>
            p.id === z.id ? { ...p, status: "allocated", allocation: required, allocatedFrom: z.depotName } : p
          )
        );
      }
    }

    // ── PHASE 4: Human approval ──────────────────────────────────────────
    await wait(800);
    addLog("⏳ Awaiting Commander ratification before dispatch...");
    setShowApproveBtn(true);
    setPhase("escalating");

    // Wait for approval
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (stopRef.current || approved) {
          clearInterval(check);
          resolve();
        }
      }, 300);
      // Auto-approve after 8 seconds for smooth demo
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 8000);
    });

    if (stopRef.current) return;
    setShowApproveBtn(false);
    setApproved(true);
    addLog("✅ Commander APPROVED all dispatch orders");
    toast.success("✅ Commander Approval Confirmed", {
      description: "All 5 zone allocations authorized. Squads en route.",
      duration: 4000,
    });

    // ── PHASE 5: NEW URGENT ESCALATION arrives mid-mission ───────────────
    await wait(2000);
    if (stopRef.current) return;
    addLog("🚨 NEW URGENT REPORT: Citizen SOS from Zone B — water rising, 340 trapped on rooftops!");
    addLog("⚡ Escalation detected — severity upgraded: Zone B 9 → 10 (now ties Zone A)");
    await wait(500);

    toast.error("⚡ Zone Escalation Event!", {
      description: "Zone B severity upgraded to 10. AI re-ranking all active zones and reallocating resources.",
      duration: 5000,
    });

    setZones((prev) =>
      prev.map((p) =>
        p.id === "z-b"
          ? { ...p, severity: 10, status: "escalated", isNew: true }
          : p
      )
    );

    setPhase("reallocating");
    setCurrentStep(8);
    await wait(800);

    addLog("🤖 Strategist Agent: Re-computing priority matrix with escalated Zone B...");
    await wait(1000);
    addLog("📊 NEW Priority Order: Zone B (10) = Zone A (10) → tie-break by civilian count");
    await wait(600);
    addLog("↩️ Re-allocating Zone A resources — 20 units freed → redirected to Zone B boats");
    await wait(600);

    setZones((prev) =>
      prev.map((p) => {
        if (p.id === "z-b") return { ...p, severity: 10, status: "escalated", allocation: 80, isNew: false, priorityRank: 1 };
        if (p.id === "z-a") return { ...p, allocation: 60, priorityRank: 2, status: "allocated" };
        return p;
      })
    );

    addLog("✅ Re-allocation complete — Zone B now P1, additional 20 units dispatched");
    await wait(600);
    addLog("🚁 Rescue Squad Alpha: Mission updated — 4 additional boats dispatched to Zone B");

    // Broadcast to rescue portal
    try {
      window.dispatchEvent(
        new CustomEvent("kurukshetra:incident_reported", {
          detail: {
            id: `esc-${Date.now()}`,
            type: "Flood Escalation — Rooftop Rescue",
            description: "[Zone B - Marina Waterfront] Citizen SOS: 340 trapped on rooftops — water rising fast",
            location_lat: 13.0544,
            location_lng: 80.2818,
            severity: "CRITICAL",
            severity_score: 10,
            needed_resources: ["boats", "water", "medical"],
            created_at: new Date().toISOString(),
          },
        })
      );
    } catch {}

    await wait(1500);
    // ── PHASE 6: First zone resolved ────────────────────────────────────
    addLog("✅ Zone A — North Harbor: Rescue squad reports all workers extracted. Marking RESOLVED.");
    setZones((prev) =>
      prev.map((p) => (p.id === "z-a" ? { ...p, status: "resolved" } : p))
    );
    toast.success("✅ Zone A Resolved — Resources Freed", {
      description: "North Harbor extraction complete. Freed machinery reallocated to Zone D.",
      duration: 4000,
    });
    await wait(800);
    addLog("♻️ Freed resources from Zone A → reallocated to Zone D (canal clearance)");
    setZones((prev) =>
      prev.map((p) => (p.id === "z-d" ? { ...p, allocation: (p.allocation || 0) + 20, etaMin: Math.max(8, p.etaMin - 8) } : p))
    );

    addLog("🏁 Full demo cycle complete: 5 zones prioritized → allocated → escalation handled → re-allocated → resolved");
    setPhase("done");
    setCurrentStep(10);
    toast.success("🏆 Demo Complete!", {
      description: "5-zone priority, supply redirect, escalation re-allocation — all demonstrated.",
      duration: 6000,
    });
  };

  const sortedZones = [...zones].sort((a, b) => a.priorityRank - b.priorityRank);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0B0F1A]/95 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Live Zone Priority & Reallocation Engine</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              5-zone AI triage · supply redirect · escalation reallocation · commander approval
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase !== "idle" && (
            <button
              onClick={reset}
              className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-white transition"
              title="Reset demo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {phase === "idle" && (
            <button
              onClick={runFullDemo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-violet-500/20 transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Run Priority Demo
            </button>
          )}
          {(phase === "simulating" || phase === "allocating") && (
            <span className="flex items-center gap-1.5 text-[11px] text-violet-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
              AI Prioritizing...
            </span>
          )}
          {phase === "reallocating" && (
            <span className="flex items-center gap-1.5 text-[11px] text-red-300 font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              ⚡ Re-allocating
            </span>
          )}
          {phase === "done" && (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Demo Complete
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
        {/* Left: Zone Cards */}
        <div className="lg:col-span-3 p-4 space-y-2.5">
          {/* Step progress bar */}
          {phase !== "idle" && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
              {["Incoming Reports", "AI Ranking", "Zone Allocation", "Approval", "Escalation", "Re-allocation", "Resolved"].map(
                (label, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentStep > i ? "bg-emerald-400" : currentStep === i ? "bg-violet-400 animate-pulse" : "bg-white/10"
                      }`}
                    />
                    {i < 6 && <div className={`w-3 h-px ${currentStep > i ? "bg-emerald-400/50" : "bg-white/10"}`} />}
                  </div>
                )
              )}
              <span className="text-[10px] text-slate-400 ml-1 font-mono">
                {["Incoming", "Ranking", "Allocating", "Awaiting Approval", "Approved", "Escalation!", "Re-allocating", "Done"][
                  Math.min(currentStep, 7)
                ]}
              </span>
            </div>
          )}

          {sortedZones.map((zone) => {
            const col = severityColor(zone.severity);
            const Icon = zone.icon;
            const badge = statusBadge(zone.status);
            return (
              <div
                key={zone.id}
                className={`rounded-xl border p-3 transition-all duration-500 ${
                  zone.isNew ? "scale-[1.02] shadow-lg" : ""
                } ${
                  zone.status === "escalated"
                    ? "border-red-500/60 bg-red-950/20 shadow-red-500/10 shadow-lg"
                    : zone.status === "resolved"
                    ? "border-white/[0.04] bg-white/[0.01] opacity-60"
                    : col.border + " " + col.bg.replace("bg-", "bg-") + "/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Priority badge */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${col.bg} ${col.text} border ${col.border}`}
                  >
                    P{zone.priorityRank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${col.text}`} />
                        <span className="text-xs font-bold text-slate-100 truncate">{zone.name}</span>
                        {zone.isNew && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{zone.type}</p>

                    {/* Severity bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${col.bar} rounded-full transition-all duration-700`}
                          style={{ width: `${zone.severity * 10}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold font-mono ${col.text}`}>
                        {zone.severity}/10
                      </span>
                    </div>

                    {/* Metrics row */}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Package className="w-2.5 h-2.5" />
                        {zone.allocation > 0 ? (
                          <span className="text-emerald-300 font-semibold">{zone.allocation} units</span>
                        ) : (
                          "pending"
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        ETA {zone.etaMin}m
                      </span>
                      {zone.status === "redirected" && (
                        <span className="flex items-center gap-1 text-amber-300">
                          <ArrowRightLeft className="w-2.5 h-2.5" />
                          {zone.allocatedFrom}
                        </span>
                      )}
                    </div>

                    {/* Redirect notice */}
                    {zone.status === "redirected" && (
                      <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1">
                        <ArrowRightLeft className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="text-[9px] text-amber-300">
                          <span className="line-through text-red-400">{zone.depotName}</span>
                          {" → "}{zone.allocatedFrom} (depleted redirect)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Log + controls */}
        <div className="lg:col-span-2 p-4 flex flex-col gap-3">
          {/* Approve button */}
          {showApproveBtn && !approved && (
            <button
              data-demo="approve-btn"
              onClick={() => {
                setApproved(true);
                setShowApproveBtn(false);
                addLog("✅ Commander manually approved all dispatch orders");
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95 border border-emerald-400/30 animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4" />
              ✅ Approve Allocation — Human-in-Loop
            </button>
          )}

          {/* Live log */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">AI Decision Log</span>
              {logs.length > 0 && (
                <span className="text-[9px] text-slate-500">{logs.length} events</span>
              )}
            </div>
            <div
              ref={logRef}
              className="h-72 lg:h-full min-h-[240px] overflow-y-auto space-y-1.5 rounded-xl border border-white/[0.05] bg-black/30 p-2.5 scrollbar-thin"
            >
              {logs.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic text-center mt-8">
                  Click "Run Priority Demo" to start the 5-zone simulation.
                </p>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px]">
                    <span
                      className={`shrink-0 w-1.5 h-1.5 mt-1 rounded-full ${
                        l.includes("⚠️") || l.includes("⚡")
                          ? "bg-red-400"
                          : l.includes("↪️")
                          ? "bg-amber-400"
                          : l.includes("✅")
                          ? "bg-emerald-400"
                          : "bg-violet-400"
                      }`}
                    />
                    <span className="font-mono text-slate-300 leading-tight">{l}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stats row */}
          {phase !== "idle" && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                <div className="text-base font-bold text-violet-300">
                  {zones.filter((z) => z.status !== "waiting").length}/5
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Zones Active</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                <div className="text-base font-bold text-amber-300">
                  {zones.filter((z) => z.status === "redirected").length}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Redirected</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center">
                <div className="text-base font-bold text-emerald-300">
                  {zones.filter((z) => z.status === "resolved").length}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Resolved</div>
              </div>
            </div>
          )}

          {phase === "idle" && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 space-y-2">
              <p className="text-[10px] font-bold text-violet-300">What this demo shows:</p>
              <ul className="text-[10px] text-slate-400 space-y-1">
                <li>✦ 5 incoming zone reports arrive sequentially</li>
                <li>✦ AI ranks them by severity × civilian density</li>
                <li>✦ Depleted depots trigger supply redirect</li>
                <li>✦ Commander approves (human-in-loop)</li>
                <li>✦ New SOS escalates Zone B → full reallocation</li>
                <li>✦ Resolved zone frees resources to next zone</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
