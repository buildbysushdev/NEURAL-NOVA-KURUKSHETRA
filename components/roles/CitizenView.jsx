"use client";

import React, { useState } from "react";
import { useDisasterRelief } from "@/context/DisasterReliefContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, MapPin, Send, PhoneCall, ShieldCheck, LifeBuoy, CheckCircle2 } from "lucide-react";

export default function CitizenView() {
  const { incidents, reportIncident } = useDisasterRelief();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Sector 4, Near 12th Cross");
  const [category, setCategory] = useState("FLOOD");
  const [severity, setSeverity] = useState("CRITICAL");
  const [affectedCount, setAffectedCount] = useState(4);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;

    reportIncident({
      title,
      location,
      category,
      severity,
      affectedCount: Number(affectedCount),
      description,
      reportedBy: "Citizen (Direct Portal)"
    });

    setTitle("");
    setDescription("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* SOS Quick Trigger */}
      <div className="bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 border border-red-700/60 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Badge variant="destructive" className="animate-pulse">EMERGENCY SOS</Badge>
            <span className="text-xs text-red-300 font-mono">Priority satellite uplink</span>
          </div>
          <h2 className="text-lg font-bold text-white">Trapped or in immediate mortal danger?</h2>
          <p className="text-xs text-slate-300 max-w-lg">
            Broadcasting SOS instantly pings nearby rescue teams and reserves immediate agentic boat dispatch.
          </p>
        </div>
        <Button
          variant="urgent"
          size="lg"
          onClick={() => {
            reportIncident({
              title: "IMMEDIATE LIFE THREAT SOS TRIGGERED",
              location: "GPS: Geocoded User Location (12.9721° N, 77.5938° E)",
              category: "LIFE_THREAT_SOS",
              severity: "CRITICAL",
              affectedCount: 2,
              description: "Citizen pressed SOS beacon from mobile browser.",
              reportedBy: "Citizen SOS Beacon"
            });
          }}
          className="w-full sm:w-auto text-sm px-6 py-6 font-bold"
        >
          <LifeBuoy className="mr-2 h-5 w-5" />
          BROADCAST SOS
        </Button>
      </div>

      {submitted && (
        <div className="bg-emerald-950/70 border border-emerald-700 p-4 rounded-lg flex items-center gap-3 text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Incident submitted successfully.</span> AI agents (Groq fast triage + Gemini deep reasoning) are actively computing optimal dispatch routing.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Incident Reporting Form */}
        <Card className="md:col-span-2 border-slate-800 bg-slate-900/90">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Report Disaster or Hazard
              </CardTitle>
              <Badge variant="outline" className="text-xs font-mono">Agent-Monitored</Badge>
            </div>
            <CardDescription className="text-xs">
              Reports are processed in &lt;200ms by Groq triage models for rapid relief dispatch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Incident Title / Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Water overflowing into apartment stilt floor"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Hazard Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="FLOOD">Flood / Waterlogging</option>
                    <option value="LANDSLIDE">Landslide / Debris</option>
                    <option value="ELECTRICAL_FIRE">Electrical Fire / Transformer</option>
                    <option value="STRUCTURAL">Building / Wall Collapse</option>
                    <option value="MEDICAL_EVAC">Medical Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Severity Assessment
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="CRITICAL">Critical (Immediate life hazard)</option>
                    <option value="HIGH">High (Urgent intervention needed)</option>
                    <option value="MODERATE">Moderate (Property or access threat)</option>
                    <option value="LOW">Low (Precautionary report)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Street Location / Landmark
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md pl-8 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                    <MapPin className="h-4 w-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estimated Persons Affected
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={affectedCount}
                    onChange={(e) => setAffectedCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Additional Field Observations
                </label>
                <textarea
                  rows="3"
                  placeholder="Water depth, senior citizens or infants present, accessible entry points..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold">
                <Send className="mr-2 h-4 w-4" />
                Submit Incident for Agentic Triage
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Live Safety Status & Evacuation Routes */}
        <div className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                Designated Safe Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-200">Highland Ridge Community Stadium</div>
                <div className="text-slate-400">Elevation: +45m above flood plane &bull; Capacity: 2,500</div>
                <Badge variant="success" className="text-[10px]">Open &bull; Food / Medical Ready</Badge>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-200">Government Polytechnic Hall</div>
                <div className="text-slate-400">Route via Eastern Ring Road &bull; Capacity: 1,200</div>
                <Badge variant="success" className="text-[10px]">Open &bull; Standby Power Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/90">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                <PhoneCall className="h-4 w-4" />
                Civil Relief Helpline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-300">State Disaster Desk</span>
                <span className="font-mono text-slate-100 font-semibold">1070</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-300">Boat Rescue Dispatch</span>
                <span className="font-mono text-slate-100 font-semibold">080-22967111</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-300">Ambulance Triage</span>
                <span className="font-mono text-slate-100 font-semibold">108</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
