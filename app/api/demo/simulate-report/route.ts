import { NextRequest, NextResponse } from "next/server";
import { generateUUID } from "@/lib/utils";
import { disasterStore } from "@/lib/supabase/mock-data";

export const dynamic = "force-dynamic";

const DEMO_LOCATIONS = [
  {
    name: "Zone Alpha - Santhome Seawall Breach",
    city: "Chennai Coastal",
    lat: 13.0315,
    lng: 80.2520,
    type: "Storm Surge & Flash Inundation",
    description: "4.5ft storm surge breached coastal defenses. 38 residents isolated on second-story buildings. High medical priority.",
    severity_score: 9,
    severity: "CRITICAL",
    needed_resources: ["rescue_boats", "medical_kits", "drinking_water_liters", "rescue_personnel_units"],
  },
  {
    name: "Zone Bravo - North Harbor Chemical Pipeline Leak",
    city: "Ennore Industrial Corridor",
    lat: 13.1985,
    lng: 80.3120,
    type: "Hazardous Gas Plume",
    description: "Industrial valve fractured under flash flood pressure. Ammonia vapor cloud detected drifting toward Sector 4.",
    severity_score: 8,
    severity: "CRITICAL",
    needed_resources: ["hazmat_units", "evacuation_transports", "medical_kits"],
  },
  {
    name: "Zone Charlie - Western Arterial Causeway Submersion",
    city: "Maduravoyal Basin",
    lat: 13.0650,
    lng: 80.1700,
    type: "Evacuation Route Cutoff",
    description: "River bridge approach inundated by 3ft overflow. 4 ambulances stuck in transit; earthmovers and high-clearance trucks required.",
    severity_score: 7,
    severity: "HIGH",
    needed_resources: ["heavy_machinery", "drinking_water_liters", "rescue_personnel_units"],
  },
  {
    name: "Zone Delta - Velachery Canal Overflow",
    city: "South Chennai Suburbs",
    lat: 12.9750,
    lng: 80.2210,
    type: "Urban Flash Flood",
    description: "Discharge canal reached capacity. Street waterlogging 2.5ft; ground-floor residential homes losing electrical supply.",
    severity_score: 6,
    severity: "HIGH",
    needed_resources: ["dewatering_pumps", "food_rations", "drinking_water_liters"],
  },
  {
    name: "Zone Echo - Central Relief Staging Shelter",
    city: "Kilpauk Sports Complex",
    lat: 13.0780,
    lng: 80.2450,
    type: "Safe Zone Logistics Demand",
    description: "120 evacuees arrived from low-lying wards. Additional potable water and blanket rations requested.",
    severity_score: 3,
    severity: "LOW",
    needed_resources: ["drinking_water_liters", "food_rations"],
  },
];

let roundRobinIndex = 0;

export async function POST(req: NextRequest) {
  try {
    const scenario = DEMO_LOCATIONS[roundRobinIndex % DEMO_LOCATIONS.length];
    roundRobinIndex++;

    const incidentId = generateUUID();
    const timestamp = new Date().toISOString();

    const newReport = {
      id: incidentId,
      location_lat: scenario.lat,
      location_lng: scenario.lng,
      latitude: scenario.lat,
      longitude: scenario.lng,
      type: scenario.type,
      description: `[${scenario.name}] ${scenario.description}`,
      severity_score: scenario.severity_score,
      severity: scenario.severity,
      status: "open",
      needed_resources: scenario.needed_resources,
      zone: scenario.name,
      created_at: timestamp,
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let dbInserted = false;

    if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes("your-project")) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const adminClient = createClient(supabaseUrl, serviceRoleKey);

        const { error } = await adminClient.from("incidents").insert([
          {
            id: newReport.id,
            location_lat: newReport.location_lat,
            location_lng: newReport.location_lng,
            type: newReport.type,
            description: newReport.description,
            severity_score: newReport.severity_score,
            status: "open",
            is_duplicate: false,
            needed_resources: newReport.needed_resources,
            created_at: newReport.created_at,
          },
        ]);

        if (!error) {
          dbInserted = true;
        } else {
          console.warn("[simulate-report] Supabase insertion error:", error.message);
        }
      } catch (dbErr: any) {
        console.warn("[simulate-report] Database connection exception:", dbErr.message);
      }
    }

    // In-memory store sync
    try {
      disasterStore.addIncident({
        id: newReport.id,
        citizen_id: "authority-live-demo-simulator",
        title: scenario.name,
        description: scenario.description,
        category: scenario.type as any,
        estimated_people_count: scenario.severity_score * 4,
        latitude: scenario.lat,
        longitude: scenario.lng,
        address: `${scenario.name}, ${scenario.city}`,
        severity_level: scenario.severity as any,
        severity_score: scenario.severity_score * 10,
        extracted_needs: {
          water: scenario.needed_resources.includes("drinking_water_liters") ? 150 : undefined,
          food: scenario.needed_resources.includes("food_rations") ? 50 : undefined,
          medical: scenario.needed_resources.includes("medical_kits") ? 15 : undefined,
          boats: scenario.needed_resources.includes("rescue_boats") ? 3 : undefined,
        },
        ai_triage_notes: `Stage Demo Trigger: Incident dispatched in ${scenario.name}. Immediate tactical triage initiated.`,
        is_duplicate: false,
        status: "open" as any,
        created_at: timestamp,
        updated_at: timestamp,
      });
    } catch {
      // In-memory fallback
    }

    return NextResponse.json({
      success: true,
      message: `Simulated emergency zone dispatched: ${scenario.name}`,
      db_inserted: dbInserted,
      report: newReport,
    });
  } catch (error: any) {
    console.error("[simulate-report] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to simulate new report" },
      { status: 500 }
    );
  }
}
