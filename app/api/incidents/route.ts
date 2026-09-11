import { NextRequest, NextResponse } from "next/server";
import { disasterStore } from "@/lib/supabase/mock-data";
import { assessIncidentWithGroq } from "@/lib/ai/needs-assessment";
import { logDisasterAuditEvent } from "@/lib/audit/audit-logger";
import { Incident } from "@/types/disaster";
import { generateUUID } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    let incidents = disasterStore.getIncidents();

    if (status && status !== "all") {
      incidents = incidents.filter((i) => i.status === status);
    }
    if (severity && severity !== "all") {
      incidents = incidents.filter((i) => i.severity_level === severity);
    }

    return NextResponse.json({ success: true, count: incidents.length, incidents });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      estimated_people_count = 1,
      latitude = 13.0827,
      longitude = 80.2707,
      address,
      citizen_id,
      image_url,
    } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, description, category." },
        { status: 400 }
      );
    }

    const existingIncidents = disasterStore.getIncidents();

    // 1. Run AI Needs-Assessment & Duplicate Detection (Groq)
    const triage = await assessIncidentWithGroq(
      {
        title,
        description,
        category,
        estimated_people_count: Number(estimated_people_count),
        latitude: Number(latitude),
        longitude: Number(longitude),
      },
      existingIncidents
    );

    const newIncident: Incident = {
      id: generateUUID(),
      citizen_id: citizen_id || "citizen-anonymous",
      title,
      description,
      category,
      estimated_people_count: Number(estimated_people_count),
      latitude: Number(latitude),
      longitude: Number(longitude),
      address: address || "Disaster Zone Geo-Tagged",
      image_url,
      severity_level: triage.severity_level,
      severity_score: triage.severity_score,
      extracted_needs: triage.extracted_needs,
      ai_triage_notes: triage.triage_summary,
      is_duplicate: triage.is_duplicate,
      duplicate_of_id: triage.duplicate_of_id,
      duplicate_confidence: triage.duplicate_confidence,
      duplicate_reason: triage.duplicate_rationale,
      status: triage.is_duplicate ? "duplicate" : "triaged",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to store
    disasterStore.addIncident(newIncident);

    // Audit log: Report received
    await logDisasterAuditEvent({
      action: "INCIDENT_REPORTED",
      actor_role: "citizen",
      actor_id: citizen_id || "citizen",
      incident_id: newIncident.id,
      details: {
        title: newIncident.title,
        people: newIncident.estimated_people_count,
        coords: [latitude, longitude],
      },
    });

    // Audit log: AI Triage
    await logDisasterAuditEvent({
      action: "AI_TRIAGE_COMPLETED",
      actor_role: "ai_agent",
      actor_id: "groq-llama-3.3-70b",
      incident_id: newIncident.id,
      details: {
        severity: triage.severity_level,
        score: triage.severity_score,
        needs: triage.extracted_needs,
        triage_summary: triage.triage_summary,
      },
    });

    if (triage.is_duplicate && triage.duplicate_of_id) {
      await logDisasterAuditEvent({
        action: "DUPLICATE_FLAGGED",
        actor_role: "ai_agent",
        actor_id: "groq-duplicate-detector",
        incident_id: newIncident.id,
        details: {
          duplicate_of_id: triage.duplicate_of_id,
          confidence: triage.duplicate_confidence,
          rationale: triage.duplicate_rationale,
        },
      });
    }

    return NextResponse.json({
      success: true,
      incident: newIncident,
      triage,
    });
  } catch (error: any) {
    console.error("Error creating incident:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
