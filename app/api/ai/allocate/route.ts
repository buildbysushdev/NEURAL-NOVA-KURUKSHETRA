import { NextRequest, NextResponse } from "next/server";
import { disasterStore } from "@/lib/supabase/mock-data";
import { optimizeAllocationWithGemini } from "@/lib/ai/allocation-agent";
import { logDisasterAuditEvent } from "@/lib/audit/audit-logger";
import { Allocation, RescueMission } from "@/types/disaster";
import { generateUUID } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { incident_id, auto_approve = false } = body;

    if (!incident_id) {
      return NextResponse.json({ success: false, error: "Missing incident_id" }, { status: 400 });
    }

    const incident = disasterStore.getIncidentById(incident_id);
    if (!incident) {
      return NextResponse.json({ success: false, error: "Incident not found" }, { status: 404 });
    }

    const depots = disasterStore.getDepots();
    const resources = disasterStore.getResources();

    // 1. Run Gemini Allocation Agent
    const plan = await optimizeAllocationWithGemini(incident, depots, resources);

    // Audit log: AI Allocation Generated
    await logDisasterAuditEvent({
      action: "AI_ALLOCATION_GENERATED",
      actor_role: "ai_agent",
      actor_id: "gemini-1.5-flash",
      incident_id: incident.id,
      details: {
        suggestions_count: plan.suggestions.length,
        shortages: plan.shortages_detected,
        rationale: plan.ai_rationale,
      },
    });

    const approvedAllocations: Allocation[] = [];
    let mission: RescueMission | null = null;

    if (auto_approve && plan.suggestions.length > 0) {
      for (const item of plan.suggestions) {
        const allocation: Allocation = {
          id: generateUUID(),
          incident_id: incident.id,
          resource_id: item.resource_id,
          depot_id: item.depot_id,
          quantity: item.allocated_quantity,
          status: "approved",
          allocated_by: "ai_allocation_agent",
          decision_reasoning: item.reasoning,
          dispatched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        disasterStore.addAllocation(allocation);
        approvedAllocations.push(allocation);
      }

      // Update incident status
      disasterStore.updateIncident(incident.id, { status: "dispatched" });

      // Create dispatched Rescue Mission
      mission = {
        id: generateUUID(),
        incident_id: incident.id,
        team_name: `Tactical Relief Strike Team-${Math.floor(Math.random() * 90 + 10)}`,
        status: "assigned",
        route_eta_mins: plan.suggestions[0]?.eta_minutes || 15,
        team_latitude: incident.latitude - 0.015,
        team_longitude: incident.longitude - 0.015,
        field_notes: `Auto-dispatched via AI Commander. Target ETA: ${plan.suggestions[0]?.eta_minutes || 15}m`,
        casualties_treated: 0,
        people_evacuated: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      disasterStore.addMission(mission);

      // Audit log
      await logDisasterAuditEvent({
        action: "ALLOCATION_APPROVED",
        actor_role: "authority",
        actor_id: "auto-dispatch-agent",
        incident_id: incident.id,
        details: {
          allocations_count: approvedAllocations.length,
          mission_id: mission.id,
          team: mission.team_name,
        },
      });

      await logDisasterAuditEvent({
        action: "MISSION_ASSIGNED",
        actor_role: "rescue",
        actor_id: mission.team_name,
        incident_id: incident.id,
        details: { eta_minutes: mission.route_eta_mins },
      });
    }

    return NextResponse.json({
      success: true,
      plan,
      auto_approved: auto_approve,
      allocations: approvedAllocations,
      mission,
    });
  } catch (error: any) {
    console.error("Error in AI allocation route:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
