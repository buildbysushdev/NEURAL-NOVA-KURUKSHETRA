"use client";

import React, { useState } from "react";
import { useDisasterRelief } from "@/context/DisasterReliefContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Navigation, CheckCircle, AlertTriangle, Users, Anchor, Send } from "lucide-react";

export default function RescueTeamView() {
  const { incidents, notify } = useDisasterRelief();
  const [rescuedCount, setRescuedCount] = useState(38);
  const [teamStatus, setTeamStatus] = useState("EN_ROUTE_ZONE_4");

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Field Unit Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-500">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-100">Alpha-7 Rapid Inflatable Squad</h2>
              <Badge variant="warning" className="text-[10px]">Active Field Deployment</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Unit ID: RES-701 &bull; GPS: 12.9719° N, 77.5942° E &bull; Comms: Ch 04 VHF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">Victims Evacuated Today</div>
            <div className="text-2xl font-bold font-mono text-emerald-400">{rescuedCount}</div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRescuedCount(prev => prev + 2);
              notify("Tally updated: +2 rescued citizens checked into triage.", "success");
            }}
            className="border-emerald-700 text-emerald-300 hover:bg-emerald-950"
          >
            +2 Rescued
          </Button>
        </div>
      </div>

      {/* Dynamic Agent Re-route Advisory Notice */}
      <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-4 flex items-start gap-3 text-amber-200">
        <Navigation className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-amber-300 flex items-center gap-2">
            <span>DYNAMIC RE-ROUTE ADVISORY &mdash; GEMINI REASONING ENGINE</span>
            <Badge variant="outline" className="text-[10px] border-amber-700 text-amber-300">Live Reroute</Badge>
          </div>
          <p className="text-slate-300">
            Upstream surge at Bridge 3 has created high hydraulic shear. Gemini agent recommends aborting standard pier approach and docking at <strong>Slipway East (Grid 14-B)</strong> where current velocity is 40% lower.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Missions List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Anchor className="h-4 w-4 text-blue-400" />
            Current Assigned Incident Queue
          </h3>

          {incidents.slice(0, 3).map((inc) => (
            <Card key={inc.id} className="border-slate-800 bg-slate-900/90 text-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={inc.severity === "CRITICAL" ? "destructive" : "warning"}>
                      {inc.severity}
                    </Badge>
                    <span className="font-mono text-xs text-slate-400">{inc.id}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">{inc.timestamp}</span>
                </div>
                <CardTitle className="text-base text-slate-100 mt-1">{inc.title}</CardTitle>
                <CardDescription className="text-xs">{inc.location}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300">
                  <span className="text-red-400 font-semibold font-mono">GROQ TRIAGE ({inc.groqAnalysis?.speedMs ?? 120}ms): </span>
                  {inc.groqAnalysis?.immediateThreat}
                </div>

                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Persons at risk: <strong className="text-slate-200">{inc.affectedCount}</strong></span>
                  <span>Category: <strong className="text-slate-200">{inc.category}</strong></span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
                    onClick={() => notify(`Incident ${inc.id} marked as Evacuated.`, "success")}
                  >
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                    Mark Target Secured
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => notify(`Emergency backup requested for ${inc.id}.`, "urgent")}
                  >
                    Request Airboat Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tactical Field Gear & Replenishment Request */}
        <div className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-200">
                Squad Equipment Onboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">High-pressure inflatables</span>
                <span className="font-mono text-slate-200 font-bold">2 boats</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Life vests (Adult / Child)</span>
                <span className="font-mono text-slate-200 font-bold">18 / 6</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Trauma emergency kits</span>
                <span className="font-mono text-slate-200 font-bold">4 active</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Fuel range remaining</span>
                <span className="font-mono text-amber-400 font-bold">4.5 hours</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-200">
                Direct Field Depot Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-400">
                Need extra supplies delivered by drone or tender boat?
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full text-xs"
                onClick={() => notify("Request for 20x pediatric life vests sent to Depot North.", "info")}
              >
                Request 20x Pediatric Vests
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="w-full text-xs"
                onClick={() => notify("Request for medical oxygen tanks sent to Depot West.", "info")}
              >
                Request Medical Oxygen Cylinders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
