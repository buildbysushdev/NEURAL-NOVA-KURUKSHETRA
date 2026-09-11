// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 5: Demo Helpers & API Routes
// FILE: app/api/demo/simulate-disaster/route.ts
// ROLE: Senior Backend Architect & Frontend Integration
// DESCRIPTION: Protected Next.js 14 API route to seed 5 realistic disaster
//              incidents across Zones A-E with varying severities (1-10).
//              Restricted strictly to the 'authority' role in production,
//              with fallback for demonstration workflows.
// =========================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { disasterStore } from "@/lib/supabase/mock-data";
import { generateUUID } from "@/lib/utils";

export const dynamic = "force-dynamic";

// 5 Realistic disaster incidents across Zones A through E
const ZONE_SIMULATIONS = [
  {
    zone: "Zone A (Central Coastal)",
    type: "flood",
    description: "Water level rose 6.5ft on ground floor of Santhome Care Home. 45 seniors and 6 dialysis patients trapped on terrace without power.",
    location_lat: 13.0315,
    location_lng: 80.2520,
    severity_score: 10,
    needed_resources: ["boats", "medical", "water", "personnel"],
  },
  {
    zone: "Zone B (North Logistics / Canal)",
    type: "structural_collapse",
    description: "Canal retaining wall collapsed under torrential rain. Ground floor of residential tenement washed out; 28 residents stranded on 2nd floor.",
    location_lat: 13.0827,
    location_lng: 80.2707,
    severity_score: 8,
    needed_resources: ["boats", "personnel", "medical", "food"],
  },
  {
    zone: "Zone C (West Urban Hub)",
    type: "medical",
    description: "Primary health clinic generator submerged in 4ft water. Emergency medication and infant vaccinations refrigeration failing. 30 patients inside.",
    location_lat: 13.0488,
    location_lng: 80.2415,
    severity_score: 7,
    needed_resources: ["medical", "generators", "water"],
  },
  {
    zone: "Zone D (South Industrial Belt)",
    type: "fire",
    description: "Transformer explosion caused substation blaze adjacent to waterlogged residential lane. Toxic smoke drifting into housing colony.",
    location_lat: 13.0112,
    location_lng: 80.2185,
    severity_score: 5,
    needed_resources: ["personnel", "medical", "tent"],
  },
  {
    zone: "Zone E (East Suburban Arterial)",
    type: "road_blockage",
    description: "Century-old banyan tree uprooted across arterial evacuation route with minor 1.5ft waterlogging. Ambulances unable to transit.",
    location_lat: 13.0600,
    location_lng: 80.2400,
    severity_score: 3,
    needed_resources: ["personnel", "food"],
  },
];

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // -------------------------------------------------------------------------
    // 1. Role Authorization Check: Only 'authority' can trigger simulation
    // -------------------------------------------------------------------------
    let userRole = "citizen";

    if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project")) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) userRole = profile.role;
      }
    } else {
      // Standalone demo/testing mode: allow authority via header or query param
      userRole =
        req.headers.get("x-user-role") ||
        req.nextUrl.searchParams.get("role") ||
        "authority"; // Default to authority in demo mode
    }

    if (userRole !== "authority") {
      console.warn(`[POST /api/demo/simulate-disaster] Unauthorized attempt by role '${userRole}'`);
      return NextResponse.json(
        {
          error: "Unauthorized. Only incident commanders with the 'authority' role can trigger disaster simulations.",
        },
        { status: 403 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. Insert 5 Fake Incidents (Zones A to E) into Incidents Table
    // -------------------------------------------------------------------------
    const insertedIncidents = [];
    const timestamp = new Date().toISOString();

    for (const item of ZONE_SIMULATIONS) {
      const incidentRecord = {
        id: generateUUID(),
        location_lat: item.location_lat,
        location_lng: item.location_lng,
        type: item.type,
        description: `[${item.zone}] ${item.description}`,
        severity_score: item.severity_score,
        status: "open" as const,
        is_duplicate: false,
        needed_resources: item.needed_resources,
        created_at: timestamp,
      };

      // If Supabase is connected, insert into Supabase DB
      if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes("your-project")) {
        const { createClient } = await import("@supabase/supabase-js");
        const adminClient = createClient(supabaseUrl, serviceRoleKey);

        const { error: dbError } = await adminClient.from("incidents").insert([
          {
            id: incidentRecord.id,
            location_lat: incidentRecord.location_lat,
            location_lng: incidentRecord.location_lng,
            type: incidentRecord.type,
            description: incidentRecord.description,
            severity_score: incidentRecord.severity_score,
            status: incidentRecord.status,
            is_duplicate: incidentRecord.is_duplicate,
            created_at: incidentRecord.created_at,
          },
        ]);

        if (dbError) {
          console.error("[simulate-disaster] Supabase insert error:", dbError.message);
        }
      }

      // Synchronize in-memory store
      try {
        disasterStore.addIncident({
          id: incidentRecord.id,
          citizen_id: "authority-simulator",
          title: `${item.zone}: ${item.type.toUpperCase()}`,
          description: item.description,
          category: item.type as any,
          estimated_people_count: item.severity_score * 5,
          latitude: item.location_lat,
          longitude: item.location_lng,
          address: item.zone,
          severity_level:
            item.severity_score >= 9 ? "CRITICAL" : item.severity_score >= 7 ? "HIGH" : item.severity_score >= 5 ? "MEDIUM" : "LOW",
          severity_score: item.severity_score * 10,
          extracted_needs: {
            water: item.needed_resources.includes("water") ? 100 : undefined,
            food: item.needed_resources.includes("food") ? 60 : undefined,
            medical: item.needed_resources.includes("medical") ? 25 : undefined,
            boats: item.needed_resources.includes("boats") ? 3 : undefined,
          },
          ai_triage_notes: `Simulated scenario in ${item.zone}. Severity: ${item.severity_score}/10.`,
          is_duplicate: false,
          status: "open" as any,
          created_at: timestamp,
          updated_at: timestamp,
        });
      } catch {
        // In-memory store fallback
      }

      insertedIncidents.push(incidentRecord);
    }

    // -------------------------------------------------------------------------
    // 3. Log Simulation Action to Audit Logs
    // -------------------------------------------------------------------------
    const auditEntry = {
      id: generateUUID(),
      agent_name: "authority-commander",
      action: "DEMO_DISASTER_SIMULATED",
      details_json: {
        total_incidents_seeded: insertedIncidents.length,
        zones: ZONE_SIMULATIONS.map((z) => z.zone),
        max_severity: 10,
        min_severity: 3,
      },
      timestamp: timestamp,
    };

    if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes("your-project")) {
      const { createClient } = await import("@supabase/supabase-js");
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      await adminClient.from("audit_logs").insert([auditEntry]);
    }

    try {
      disasterStore.addAuditLog({
        action: "DEMO_DISASTER_SIMULATED" as any,
        actor_role: "authority",
        actor_id: "authority-commander",
        details: auditEntry.details_json,
      });
    } catch {
      // In-memory audit fallback
    }

    console.log(`[simulate-disaster] Successfully seeded 5 realistic disaster incidents across Zones A-E.`);

    return NextResponse.json({
      success: true,
      message: "Successfully seeded 5 realistic disaster incidents across Zones A through E.",
      count: insertedIncidents.length,
      incidents: insertedIncidents,
      simulated_incidents: insertedIncidents,
    });
  } catch (error: any) {
    console.error("[simulate-disaster] Unhandled exception:", error.message || error);
    return NextResponse.json(
      { success: false, error: "Internal server error triggering disaster simulation." },
      { status: 500 }
    );
  }
}
