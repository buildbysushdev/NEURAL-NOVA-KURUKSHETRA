import { NextRequest, NextResponse } from "next/server";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { assessIncidentWithGroq } from "@/lib/ai/needs-assessment";
import { allocateResourcesWithGemini } from "@/lib/ai/allocation-agent";
import { dispatchMultiChannelNotification } from "@/lib/notifications/dispatcher";

interface SimulatedIncidentInput {
  type: string;
  location_lat: number;
  location_lng: number;
  description: string;
  severity_hint?: number;
  zone_name?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scenario = body.scenario || "chennai-flash-flood";
    const incidents: SimulatedIncidentInput[] = body.incidents || [];

    const processedResults = [];

    for (let i = 0; i < incidents.length; i++) {
      const inc = incidents[i];
      const incidentId = `SIM-INC-${Date.now()}-${i + 1}`;

      // 1. Ingestion: insert into database or local state
      if (isConfigured) {
        try {
          await supabase.from("incidents").insert({
            id: incidentId,
            type: inc.type,
            location_lat: inc.location_lat,
            location_lng: inc.location_lng,
            latitude: inc.location_lat,
            longitude: inc.location_lng,
            description: inc.description,
            severity_score: inc.severity_hint || 8,
            status: "open",
            language: "en",
            needed_resources: ["boats", "medical", "water"],
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Supabase simulate insert skipped:", e);
        }
      }

      // 2. Sentinel AI Triage
      const triage = await assessIncidentWithGroq({
        title: `${inc.type.toUpperCase()} Alert`,
        description: inc.description,
        category: inc.type,
        estimated_people_count: inc.severity_hint && inc.severity_hint >= 9 ? 35 : 12,
        latitude: inc.location_lat,
        longitude: inc.location_lng,
      });

      // Insert Sentinel Audit Log
      if (isConfigured) {
        try {
          await supabase.from("audit_logs").insert({
            agent_name: "Sentinel Agent (Groq LLaMA 3)",
            action: `Triaged incident #${incidentId.slice(-6)} → SEV ${triage.severity_score}/10 (${triage.severity_level})`,
            details_json: {
              severity_score: triage.severity_score,
              urgency: triage.urgency_priority,
              needed_resources: Object.keys(triage.extracted_needs),
              is_duplicate: triage.is_duplicate,
            },
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn("Supabase audit log insert skipped:", e);
        }
      }

      // 3. Strategist AI Allocation (if not duplicate)
      let allocationResult: any = null;
      if (!triage.is_duplicate) {
        allocationResult = await allocateResourcesWithGemini({
          incident_id: incidentId,
          incident_severity: triage.severity_score,
          incident_type: inc.type,
          urgency: triage.urgency_priority === 1 ? "critical" : "high",
          required_resources: triage.extracted_needs,
          demanded_quantities: {
            boats: triage.extracted_needs.rescue_boats || 3,
            medical: triage.extracted_needs.medical_kits || 15,
            water: triage.extracted_needs.drinking_water_liters || 500,
          },
        });

        // Insert Strategist Audit Log
        if (isConfigured) {
          try {
            await supabase.from("audit_logs").insert({
              agent_name: "Strategist Agent (Google Gemini)",
              action: `Allocated tactical resources to incident #${incidentId.slice(-6)}`,
              details_json: allocationResult,
              created_at: new Date().toISOString(),
            });
          } catch (e) {
            console.warn("Supabase audit log insert skipped:", e);
          }
        }
      }

      processedResults.push({
        id: incidentId,
        type: inc.type,
        description: inc.description,
        location_lat: inc.location_lat,
        location_lng: inc.location_lng,
        latitude: inc.location_lat,
        longitude: inc.location_lng,
        severity_score: triage.severity_score,
        severity: triage.severity_level,
        triage,
        allocation: allocationResult,
        success: true,
      });
    }

    // 4. Dispatch emergency notification and CAP protocol for the top critical incident
    if (processedResults.length > 0) {
      const topCritical = processedResults[0];
      await dispatchMultiChannelNotification({
        headline: `CRITICAL ALERT: ${topCritical.type.toUpperCase()} in Tactical Sector`,
        message: topCritical.description,
        incidentType: topCritical.type,
        severity: "Extreme",
        urgency: "critical",
        areaDesc: "Disaster Crisis Sector",
        coordinates: [topCritical.location_lat, topCritical.location_lng],
        radiusKm: 5.0,
      });
    }

    return NextResponse.json(
      {
        success: true,
        scenario,
        processed_count: processedResults.length,
        incidents: processedResults,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Simulation API execution error:", error);
    return NextResponse.json(
      { error: "Simulation failed", details: error.message },
      { status: 500 }
    );
  }
}
