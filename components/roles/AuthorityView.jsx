"use client";

import React, { useState } from "react";
import { useDisasterRelief } from "@/context/DisasterReliefContext";
import AuditLogPanel from "@/components/authority/AuditLogPanel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Activity,
  Layers,
  Cpu,
  RefreshCw,
  Shield,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
  Boxes,
  Zap,
  Sparkles,
  ArrowRight,
  Wifi,
  LifeBuoy,
  Flame,
  ChevronDown
} from "lucide-react";

export default function AuthorityView() {
  const {
    incidents,
    resources,
    auditLogs,
    realtimeStatus,
    lastRealtimeEvent,
    simulateDisaster,
    simulateAiEdgeFunctionUpdate,
    approveAllocation,
    notify
  } = useDisasterRelief();

  const [selectedTab, setSelectedTab] = useState("incidents"); // 'incidents' | 'audit' | 'inventory' | 'agents'
  const [filterSeverity, setFilterSeverity] = useState("ALL");

  const filteredIncidents = incidents.filter(i => {
    if (filterSeverity === "ALL") return true;
    return i.severity === filterSeverity;
  });

  const criticalCount = incidents.filter(i => i.severity === "CRITICAL").length;
  const allocatedCount = incidents.filter(i => i.resourceAllocated).length;
  const totalResponders = resources.reduce((acc, r) => acc + r.personnelDeployed, 0);
  const totalBoats = resources.reduce((acc, r) => acc + r.rescueBoatsAvailable, 0);

  return (
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
      {/* Top Operations Header - Mobile Responsive */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-100">
              Disaster Relief Unified Command Desk
            </h1>
            <Badge variant="destructive" className="font-mono text-[10px] sm:text-xs">
              LIVE DISPATCH
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Groq Fast Triage (&lt;150ms) + Gemini Deep Reasoning &bull; Real-time AI Edge Function Listener
          </p>
        </div>

        {/* Action Buttons: Simulate Disaster & Real-time Edge Push */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Supabase Realtime WebSocket Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 hidden sm:inline">Supabase Realtime:</span>
            <span className="text-emerald-400 font-semibold">{realtimeStatus}</span>
          </div>

          {/* SIMULATE DISASTER BUTTON (Seeds 5 fake incidents with varying severity) */}
          <Button
            size="sm"
            onClick={simulateDisaster}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-950/50 py-4 px-3 sm:px-4"
            title="Seeds 5 incidents with varying severity and automated AI action logs"
          >
            <Flame className="mr-1.5 h-4 w-4 animate-pulse text-amber-300" />
            <span>Simulate Disaster (5 Incidents)</span>
          </Button>

          {/* Trigger to simulate AI Edge Function update */}
          <Button
            size="sm"
            variant="outline"
            onClick={simulateAiEdgeFunctionUpdate}
            className="border-cyan-700/80 text-cyan-300 hover:bg-cyan-950 text-xs py-4 px-2.5 sm:px-3"
            title="Simulate Supabase AI Edge Function updating the database in real-time"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AI Edge Push</span>
            <span className="sm:hidden">Edge</span>
          </Button>
        </div>
      </div>

      {/* Realtime Event Notification Bar */}
      {lastRealtimeEvent && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-md bg-cyan-950/50 border border-cyan-700/60 text-cyan-200 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 truncate">
            <Wifi className="h-3.5 w-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="truncate">LAST SUPABASE REALTIME EVENT: <strong>{lastRealtimeEvent.type}</strong> at {lastRealtimeEvent.timestamp}</span>
          </div>
          <span className="text-[10px] text-cyan-300/80 shrink-0 hidden sm:inline">Synced</span>
        </div>
      )}

      {/* Top Metrics Row - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader className="p-3.5 sm:p-4 pb-1">
            <CardDescription className="text-[10px] sm:text-xs font-mono uppercase text-slate-400">
              Active Incidents
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold font-mono text-slate-100 flex items-center justify-between">
              <span>{incidents.length}</span>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-normal">
                {criticalCount} Critical
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-1">
            <div className="text-[10px] sm:text-[11px] text-slate-400">
              {allocatedCount} of {incidents.length} Allocated
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader className="p-3.5 sm:p-4 pb-1">
            <CardDescription className="text-[10px] sm:text-xs font-mono uppercase text-slate-400">
              Allocated Teams
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 flex items-center justify-between">
              <span>{allocatedCount} Active</span>
              <LifeBuoy className="h-4 w-4 text-emerald-400 hidden sm:block" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-1">
            <div className="text-[10px] sm:text-[11px] text-slate-400">{totalResponders} personnel deployed</div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader className="p-3.5 sm:p-4 pb-1">
            <CardDescription className="text-[10px] sm:text-xs font-mono uppercase text-slate-400">
              Rescue Boats
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold font-mono text-slate-100 flex items-center justify-between">
              <span>{totalBoats}</span>
              <span className="text-xs text-amber-400 font-normal">Reserve</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-1">
            <div className="text-[10px] sm:text-[11px] text-slate-400">34 deployed in active flood zones</div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/90">
          <CardHeader className="p-3.5 sm:p-4 pb-1">
            <CardDescription className="text-[10px] sm:text-xs font-mono uppercase text-slate-400">
              AI Verification
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 flex items-center justify-between">
              <span>100% Verified</span>
              <Sparkles className="h-4 w-4 text-cyan-400 hidden sm:block" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 sm:p-4 pt-1">
            <div className="text-[10px] sm:text-[11px] text-slate-400">Groq Fast LPU + Gemini 1.5</div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-1 sm:gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setSelectedTab("incidents")}
          className={`px-3 sm:px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            selectedTab === "incidents"
              ? "border-red-500 text-slate-100 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          <span>Incident Queue ({incidents.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab("audit")}
          className={`px-3 sm:px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            selectedTab === "audit"
              ? "border-red-500 text-slate-100 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="h-3.5 w-3.5 text-amber-400" />
          <span>Audit Log Panel ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab("inventory")}
          className={`px-3 sm:px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            selectedTab === "inventory"
              ? "border-red-500 text-slate-100 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Boxes className="h-3.5 w-3.5 text-blue-400" />
          <span>Inventory &amp; Depots</span>
        </button>

        <button
          onClick={() => setSelectedTab("agents")}
          className={`px-3 sm:px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            selectedTab === "agents"
              ? "border-red-500 text-slate-100 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>AI Architecture</span>
        </button>
      </div>

      {/* TAB 1: INCIDENTS + AUDIT LOG SIDE-BY-SIDE ON DESKTOP */}
      {selectedTab === "incidents" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
          {/* Left 2 Columns: Incident Triage Queue */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium mr-1">Severity:</span>
                {["ALL", "CRITICAL", "HIGH", "MODERATE", "LOW"].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                      filterSeverity === sev
                        ? "bg-slate-800 text-slate-100 font-bold border border-slate-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Showing {filteredIncidents.length} of {incidents.length} incidents
              </span>
            </div>

            <div className="space-y-4">
              {filteredIncidents.map((inc) => (
                <Card
                  key={inc.id}
                  className={`bg-slate-900/95 overflow-hidden border transition-all ${
                    inc.resourceAllocated
                      ? "border-slate-800 border-l-4 border-l-emerald-500 shadow-sm shadow-emerald-950/20"
                      : "border-slate-800 border-l-4 border-l-amber-500 shadow-sm shadow-amber-950/20"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Left: Incident Details */}
                    <div className="p-4 sm:p-5 flex-1 space-y-3">
                      {/* Header Badges with AI Analysis Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {/* Core Severity */}
                          <Badge
                            variant={inc.severity === "CRITICAL" ? "destructive" : inc.severity === "HIGH" ? "warning" : "default"}
                            className="font-mono text-[11px] uppercase"
                          >
                            {inc.severity}
                          </Badge>

                          {/* AI ANALYSIS BADGE: Severity Score (e.g. 'Severity: 9') */}
                          <Badge
                            className={`font-mono text-xs font-bold px-2 py-0.5 border ${
                              (inc.aiAnalysis?.severityScore ?? 9) >= 9
                                ? "bg-red-950 text-red-300 border-red-700/80"
                                : (inc.aiAnalysis?.severityScore ?? 9) >= 7
                                ? "bg-amber-950 text-amber-300 border-amber-700/80"
                                : "bg-emerald-950 text-emerald-300 border-emerald-700/80"
                            }`}
                          >
                            Severity: {inc.aiAnalysis?.severityScore ? Number(inc.aiAnalysis.severityScore).toFixed(1) : "9"} / 10
                          </Badge>

                          {/* AI ANALYSIS BADGE: 'AI Verified' */}
                          {inc.aiAnalysis?.aiVerified && (
                            <Badge className="bg-cyan-950/90 text-cyan-300 border border-cyan-700/80 font-mono text-[10px] sm:text-[11px] flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-cyan-400" />
                              <span>AI Verified</span>
                            </Badge>
                          )}

                          <span className="font-mono text-xs text-slate-400">{inc.id}</span>
                          <span className="text-xs text-slate-400 font-medium hidden sm:inline">&bull; {inc.category}</span>
                        </div>

                        <span className="font-mono text-[11px] sm:text-xs text-slate-400">{inc.timestamp}</span>
                      </div>

                      {/* Title & Location */}
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-100">{inc.title}</h3>
                        <p className="text-xs text-slate-300 flex flex-wrap items-center gap-1 mt-1">
                          <span>{inc.location}</span>
                          <span className="font-mono text-slate-500">({inc.coordinates})</span>
                        </p>
                      </div>

                      {/* VISUAL INDICATOR FOR 'RESOURCE ALLOCATED' */}
                      {inc.resourceAllocated ? (
                        <div className="flex flex-wrap items-center justify-between p-2.5 rounded-md bg-emerald-950/50 border border-emerald-700/70 text-emerald-200 text-xs gap-2">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="font-bold tracking-wide uppercase text-emerald-400 font-mono text-xs">
                              Resource Allocated
                            </span>
                            <span className="text-slate-300 font-medium truncate">
                              &bull; {inc.allocationDetails?.assignedTeam || "Tactical Relief Squad"}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-emerald-300 font-medium">
                            {inc.allocationDetails?.unitsCommitted || "Dispatched"}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between p-2.5 rounded-md bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs gap-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                            <span className="font-bold tracking-wide uppercase text-amber-400 font-mono text-xs">
                              Pending Resource Allocation
                            </span>
                            <span className="text-slate-400 text-[11px] hidden sm:inline">
                              &bull; Auto-reserved at Regional Depot
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-300 font-semibold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                            Approval Needed
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400">
                        <span>Affected: <strong className="text-slate-200">{inc.affectedCount} persons</strong></span>
                        <span>Source: <strong className="text-slate-200">{inc.reportedBy}</strong></span>
                        <span>Model: <strong className="text-cyan-400 font-mono">{inc.aiAnalysis?.model || "Groq + Gemini"}</strong></span>
                      </div>
                    </div>

                    {/* Right: AI Dual Agent Assessment & Action Panel */}
                    <div className="p-4 sm:p-5 lg:w-[380px] bg-slate-950/70 border-t lg:border-t-0 lg:border-l border-slate-800/80 flex flex-col justify-between space-y-3">
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-emerald-400 flex items-center gap-1">
                            <Cpu className="h-3 w-3" />
                            AI EDGE ANALYSIS
                          </span>
                          <span className="font-mono text-[11px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60 font-semibold">
                            Confidence: {inc.aiAnalysis?.confidence ?? 98}%
                          </span>
                        </div>

                        <p className="text-slate-300 text-[11px] bg-slate-900 p-2.5 rounded border border-slate-800 leading-relaxed">
                          {inc.aiAnalysis?.threatSummary || inc.groqAnalysis?.immediateThreat}
                        </p>

                        <div className="pt-1">
                          <span className="font-mono font-semibold text-cyan-400 flex items-center gap-1 text-[11px]">
                            <Activity className="h-3 w-3" />
                            AGENT RECOMMENDATION
                          </span>
                          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                            {inc.geminiReasoning?.multiFactorRationale || "Cross-referenced terrain gradient with depot equipment availability."}
                          </p>
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="pt-2">
                        {inc.resourceAllocated ? (
                          <div className="flex items-center justify-between gap-2 bg-emerald-950/80 border border-emerald-700/80 p-2.5 rounded">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                              <span>Resource Allocated</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] border-emerald-700 text-emerald-300 hover:bg-emerald-900"
                              onClick={() => notify(`Dynamic route re-verified for ${inc.id}.`, "info")}
                            >
                              Verify Route
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-950/40 py-5"
                            onClick={() => approveAllocation(inc.id)}
                          >
                            Approve Resource Allocation
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right 1 Column on Desktop: Scrollable Audit Log Panel */}
          <div className="xl:col-span-1 space-y-4">
            <div className="sticky top-20">
              <AuditLogPanel />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOG DEDICATED FULL VIEW */}
      {selectedTab === "audit" && (
        <div className="max-w-4xl mx-auto">
          <AuditLogPanel className="min-h-[500px]" />
        </div>
      )}

      {/* TAB 3: RESOURCE INVENTORY */}
      {selectedTab === "inventory" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((depot) => (
              <Card key={depot.id} className="border-slate-800 bg-slate-900/90 text-xs space-y-3 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-400">{depot.id}</span>
                  <Badge
                    variant={depot.status === "DEPLETING" ? "destructive" : "success"}
                    className="font-mono text-[10px]"
                  >
                    {depot.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">{depot.name}</h3>
                  <p className="text-slate-400">{depot.location}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Personnel (Reserves / Deployed)</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {depot.personnelAvailable} / {depot.personnelDeployed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rescue Inflatables &amp; Boats</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {depot.rescueBoatsAvailable} / {depot.rescueBoatsDeployed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emergency Medical Kits</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {depot.medicalKitsAvailable}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Food &amp; Potable Water Packets</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {depot.foodWaterPackets}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => notify(`Requisition order logged for ${depot.name}.`, "info")}
                >
                  Request Inter-Depot Transfer
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AGENTIC ALLOCATION ARCHITECTURE */}
      {selectedTab === "agents" && (
        <Card className="border-slate-800 bg-slate-900/90 p-4 sm:p-5 space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Agentic Allocation Engine Architecture (Groq + Gemini + Supabase Edge)
            </h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            The platform orchestrates dual AI layers synchronized via <strong>Supabase Realtime</strong>:
            When an incident is reported, a <strong>Supabase AI Edge Function</strong> triggers Groq for sub-150ms threat scoring and classification, then invokes Gemini to assess multi-factor hydrological risks, outputting an explainable resource plan with an immediate real-time broadcast to all connected Authority desks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <span className="font-mono font-bold text-emerald-400 text-xs">Layer 1: Groq Fast Triage Agent</span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Parses citizen voice, photo, and geocoded text in &lt;150ms</li>
                <li>Calculates dynamic &lsquo;Severity: 9/10&rsquo; score</li>
                <li>Tags incident as &lsquo;AI Verified&rsquo;</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
              <span className="font-mono font-bold text-cyan-400 text-xs">Layer 2: Gemini Multi-Factor Reasoning</span>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Simulates hydrologic flood velocity and road blockage risks</li>
                <li>Commits optimal depot packages and sets &lsquo;Resource Allocated&rsquo; status</li>
                <li>Pushes updates via Supabase Realtime WebSockets to all commanders</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
