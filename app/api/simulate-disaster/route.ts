import { NextRequest, NextResponse } from "next/server";
import { disasterStore } from "@/lib/supabase/mock-data";
import { assessIncidentWithGroq } from "@/lib/ai/needs-assessment";
import { optimizeAllocationWithGemini } from "@/lib/ai/allocation-agent";
import { logDisasterAuditEvent } from "@/lib/audit/audit-logger";
import { Incident } from "@/types/disaster";
import { generateUUID } from "@/lib/utils";

// 5 Realistic disaster incidents with varying severities and types
const SIMULATED_INCIDENTS = [
  {
    title: "Hospital ICU Power Grid Failure & Flood Inundation",
    description: "Hospital basement generator completely submerged in 6ft water. 45 patients in ICU require immediate boat transport and portable oxygen ventilators.",
    category: "medical_emergency" as const,
    type: "medical",
    estimated_people_count: 45,
    latitude: 13.0315,
    longitude: 80.2520,
    address: "St. Thomas Road, Santhome Sector",
    targetSeverity: 10,
    needed: ["boats", "medical", "generators", "personnel"],
  },
  {
    title: "Apartment Perimeter Wall Collapse with Trapped Families",
    description: "Torrential currents undermined foundation of 4-story tenement. Ground floor stairwell blocked by debris. 28 residents trapped on 2nd floor.",
    category: "building_collapse" as const,
    type: "building_collapse",
    estimated_people_count: 28,
    latitude: 13.0827,
    longitude: 80.2707,
    address: "Vyasarpadi Canal Edge, North Sector",
    targetSeverity: 8,
    needed: ["boats", "personnel", "medical", "food"],
  },
  {
    title: "Community Center Flash Flood Stranding",
    description: "Water reached 4.5ft inside school compound where 70 flood refugees had gathered. Drinking water supply contaminated. Infant formula needed.",
    category: "flood" as const,
    type: "flood",
    estimated_people_count: 70,
    latitude: 13.0488,
    longitude: 80.2415,
    address: "Mylapore High Road Relief Post",
    targetSeverity: 7,
    needed: ["water", "food", "boats"],
  },
  {
    title: "Electrical Transformer Fire & Submerged Street",
    description: "Short circuit triggered transformer explosion. Thick smoke drifting over residential block with knee-deep water on roads.",
    category: "fire" as const,
    type: "fire",
    estimated_people_count: 15,
    latitude: 13.0112,
    longitude: 80.2185,
    address: "Guindy Industrial Area, Phase II",
    targetSeverity: 6,
    needed: ["personnel", "medical"],
  },
  {
    title: "Road Access Cut Off by Fallen Banyan Tree & Minor Waterlogging",
    description: "Ancient tree fell across residential lane. Water level is 1.5ft. Residents are safe on 1st floors but vehicular access blocked.",
    category: "flood" as const,
    type: "flood",
    estimated_people_count: 8,
    latitude: 13.0600,
    longitude: 80.2400,
    address: "T. Nagar 3rd Cross Street",
    targetSeverity: 3,
    needed: ["water", "food"],
  },
];

export async function POST(req: NextRequest) {
  try {
    const existingIncidents = disasterStore.getIncidents();
    const createdIncidents: Incident[] = [];

    for (const sim of SIMULATED_INCIDENTS) {
      // 1. Run AI Needs-Assessment Agent (Groq API Llama 3)
      const triage = await assessIncidentWithGroq(
        {
          title: sim.title,
          description: sim.description,
          category: sim.category,
          estimated_people_count: sim.estimated_people_count,
          latitude: sim.latitude,
          longitude: sim.longitude,
        },
        existingIncidents
      );

      // Scale severity score to 1-10
      const severity1to10 = Math.max(1, Math.min(10, Math.round(triage.severity_score / 10)));

      const incident: Incident = {
        id: generateUUID(),
        citizen_id: "demo-simulator",
        title: sim.title,
        description: sim.description,
        category: sim.category,
        estimated_people_count: sim.estimated_people_count,
        latitude: sim.latitude,
        longitude: sim.longitude,
        address: sim.address,
        severity_level: triage.severity_level,
        severity_score: triage.severity_score,
        extracted_needs: triage.extracted_needs,
        ai_triage_notes: `Groq Llama 3 Triage: Severity ${severity1to10}/10. Extracted: ${Object.keys(triage.extracted_needs).join(", ")}.`,
        is_duplicate: triage.is_duplicate,
        duplicate_of_id: triage.duplicate_of_id,
        duplicate_confidence: triage.duplicate_confidence,
        duplicate_reason: triage.duplicate_rationale,
        status: "open" as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      disasterStore.addIncident(incident);
      createdIncidents.push(incident);

      // 2. Audit Log: Groq Needs-Assessment
      await logDisasterAuditEvent({
        action: "INCIDENT_REPORTED",
        actor_role: "citizen",
        actor_id: "demo-simulator",
        incident_id: incident.id,
        details: { title: incident.title, people: incident.estimated_people_count },
      });

      await logDisasterAuditEvent({
        action: "AI_TRIAGE_COMPLETED",
        agent_name: "groq-needs-assessment",
        actor_role: "ai_agent",
        actor_id: "groq-llama-3",
        incident_id: incident.id,
        details: {
          severity_1_to_10: severity1to10,
          severity_score_100: triage.severity_score,
          needed_resources: triage.extracted_needs,
          model: "llama-3.3-70b-versatile",
        },
      } as any);

      // 3. Run Gemini Allocation on High/Critical Incidents
      if (severity1to10 >= 7) {
        const depots = disasterStore.getDepots();
        const resources = disasterStore.getResources();
        const plan = await optimizeAllocationWithGemini(incident, depots, resources);

        await logDisasterAuditEvent({
          action: "AI_ALLOCATION_GENERATED",
          agent_name: "gemini-allocation-agent",
          actor_role: "ai_agent",
          actor_id: "gemini-1.5-flash",
          incident_id: incident.id,
          details: {
            severity_1_to_10: severity1to10,
            suggestions_count: plan.suggestions.length,
            rationale: plan.ai_rationale,
          },
        } as any);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully simulated 5 disaster incidents with AI triage and resource allocation.",
      count: createdIncidents.length,
      incidents: createdIncidents,
    });
  } catch (err: any) {
    console.error("Error in simulate-disaster route:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
