import { NextResponse } from "next/server";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { Incident, AuditLogRecord } from "@/types/backend";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - BACKEND API CONTRACT
 * API Route: /api/demo/simulate-disaster (POST)
 * ==============================================================================
 * 
 * Seeds 5 realistic disaster incidents across Chennai zones (Zone A to Zone E)
 * into Supabase 'incidents' and 'audit_logs' tables matching the Backend Contract.
 */

export async function POST() {
  try {
    const timestamp = new Date().toISOString();

    // 5 realistic incidents across Chennai Zones A through E
    const simulated_incidents: Incident[] = [
      {
        id: "018f4a12-70b1-7299-8854-1b1160a7d901",
        zone: "Zone A - North Harbor",
        type: "structural_collapse",
        description: "Port warehouse roof collapsed after torrential rainfall; multiple workers trapped under debris.",
        severity_score: 9,
        status: "open",
        location_lat: 13.1025,
        location_lng: 80.2985,
        is_duplicate: false,
        duplicate_of_id: null,
        needed_resources: ["medical", "tent", "boats"],
        ai_analysis_json: {
          analyzed_at: timestamp,
          model: "Sentinel AI Agent",
          severity_score: 9,
          needed_resources: ["medical", "tent", "boats"],
          is_duplicate: false,
          rationale: "Heavy structural failure with critical life risk. Rapid evacuation required."
        },
        reported_by: null,
        created_at: timestamp
      },
      {
        id: "018f4a12-70b1-7299-8854-1b1160a7d902",
        zone: "Zone B - Marina Waterfront",
        type: "flood",
        description: "Storm surge breached coastal seawall along Marina Beach. Water entered lower residential communities.",
        severity_score: 8,
        status: "open",
        location_lat: 13.0544,
        location_lng: 80.2818,
        is_duplicate: false,
        duplicate_of_id: null,
        needed_resources: ["boats", "water"],
        ai_analysis_json: {
          analyzed_at: timestamp,
          model: "Strategist Agent",
          severity_score: 8,
          needed_resources: ["boats", "water"],
          is_duplicate: false,
          rationale: "Rising water levels require aquatic extraction and potable drinking supplies."
        },
        reported_by: null,
        created_at: timestamp
      },
      {
        id: "018f4a12-70b1-7299-8854-1b1160a7d903",
        zone: "Zone C - Central Metro Corridor",
        type: "fire",
        description: "Electrical substation explosion following floodwater infiltration. Thick smoke spreading toward hospital.",
        severity_score: 9,
        status: "open",
        location_lat: 13.0827,
        location_lng: 80.2707,
        is_duplicate: false,
        duplicate_of_id: null,
        needed_resources: ["medical", "water"],
        ai_analysis_json: {
          analyzed_at: timestamp,
          model: "Sentinel AI Agent",
          severity_score: 9,
          needed_resources: ["medical", "water"],
          is_duplicate: false,
          rationale: "High hospital proximity demands priority fire containment and burn triage."
        },
        reported_by: null,
        created_at: timestamp
      },
      {
        id: "018f4a12-70b1-7299-8854-1b1160a7d904",
        zone: "Zone D - Industrial South Sector",
        type: "chemical_spill",
        description: "Industrial chlorine storage tank valve ruptured. Toxic vapor drifting toward highway bypass.",
        severity_score: 7,
        status: "open",
        location_lat: 12.9815,
        location_lng: 80.2180,
        is_duplicate: false,
        duplicate_of_id: null,
        needed_resources: ["medical", "tent"],
        ai_analysis_json: {
          analyzed_at: timestamp,
          model: "Strategist Agent",
          severity_score: 7,
          needed_resources: ["medical", "tent"],
          is_duplicate: false,
          rationale: "Wind telemetry suggests immediate downwind perimeter isolation."
        },
        reported_by: null,
        created_at: timestamp
      },
      {
        id: "018f4a12-70b1-7299-8854-1b1160a7d905",
        zone: "Zone E - Western Basin",
        type: "landslide",
        description: "Slope instability caused mudflow onto access expressway, halting supply vehicle convoy.",
        severity_score: 6,
        status: "open",
        location_lat: 13.0312,
        location_lng: 80.1824,
        is_duplicate: false,
        duplicate_of_id: null,
        needed_resources: ["food", "tent"],
        ai_analysis_json: {
          analyzed_at: timestamp,
          model: "Strategist Agent",
          severity_score: 6,
          needed_resources: ["food", "tent"],
          is_duplicate: false,
          rationale: "Route clearance in progress; temporary relief camp established."
        },
        reported_by: null,
        created_at: timestamp
      }
    ];

    // Correlated Audit Logs matching the backend contract
    const simulated_audit_logs: AuditLogRecord[] = [
      {
        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        agent_name: "Strategist Agent",
        action: "Strategist Agent allocated Resource res-01 to Incident 018f4a12-70b1-7299-8854-1b1160a7d901",
        details_json: {
          event: "RESOURCE_ALLOCATION",
          resource_type: "water",
          quantity: 500,
          zone: "Zone A - North Harbor"
        },
        timestamp
      },
      {
        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e",
        agent_name: "Sentinel Agent",
        action: "Sentinel Agent classified Marina Surge as Priority 8 Critical",
        details_json: {
          event: "SEVERITY_ASSESSMENT",
          severity_score: 8,
          needed_resources: ["boats", "water"]
        },
        timestamp
      }
    ];

    // Write to Supabase if credentials are active
    if (isConfigured && supabase) {
      // Map to db column names: location_lat, location_lng, needed_resources, severity_score, etc.
      const dbPayload = simulated_incidents.map((inc) => ({
        id: inc.id,
        location_lat: inc.location_lat,
        location_lng: inc.location_lng,
        type: inc.type,
        description: inc.description,
        severity_score: inc.severity_score,
        status: inc.status,
        is_duplicate: inc.is_duplicate,
        duplicate_of_id: inc.duplicate_of_id,
        needed_resources: inc.needed_resources,
        ai_analysis_json: inc.ai_analysis_json,
        created_at: inc.created_at
      }));

      await supabase.from("incidents").upsert(dbPayload);
      await supabase.from("audit_logs").insert(simulated_audit_logs);
    }

    return NextResponse.json({
      success: true,
      message: "Simulated 5 disaster incidents across Chennai zones.",
      count: 5,
      simulated_incidents: simulated_incidents
    });
  } catch (error: any) {
    console.error("Simulation API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to simulate disaster" },
      { status: 500 }
    );
  }
}
