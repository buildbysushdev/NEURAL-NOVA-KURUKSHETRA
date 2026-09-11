import { NextRequest, NextResponse } from "next/server";
import { disasterStore } from "@/lib/supabase/mock-data";
import { planDynamicReallocation } from "@/lib/ai/allocation-agent";
import { logDisasterAuditEvent } from "@/lib/audit/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { critical_incident_id, execute_now = false } = body;

    if (!critical_incident_id) {
      return NextResponse.json({ success: false, error: "Missing critical_incident_id" }, { status: 400 });
    }

    const criticalIncident = disasterStore.getIncidentById(critical_incident_id);
    if (!criticalIncident) {
      return NextResponse.json({ success: false, error: "Critical incident not found" }, { status: 404 });
    }

    const allIncidents = disasterStore.getIncidents();
    const depots = disasterStore.getDepots();
    const resources = disasterStore.getResources();

    // Run dynamic re-allocation reasoning
    const reallocations = await planDynamicReallocation(criticalIncident, allIncidents, depots, resources);

    if (execute_now && reallocations.length > 0) {
      for (const event of reallocations) {
        // Audit log each dynamic diversion
        await logDisasterAuditEvent({
          action: "DYNAMIC_REALLOCATION_TRIGGERED",
          actor_role: "authority",
          actor_id: "gemini-dynamic-triage-officer",
          incident_id: criticalIncident.id,
          details: {
            diverted_from_incident: event.preempted_incident_id,
            from_title: event.preempted_incident_title,
            to_title: event.trigger_incident_title,
            resource: event.resource_name,
            quantity: event.diverted_quantity,
            justification: event.justification,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: reallocations.length,
      reallocations,
      executed: execute_now,
    });
  } catch (error: any) {
    console.error("Error in dynamic reallocation route:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
