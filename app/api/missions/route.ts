import { NextRequest, NextResponse } from "next/server";
import { disasterStore } from "@/lib/supabase/mock-data";
import { logDisasterAuditEvent } from "@/lib/audit/audit-logger";
import { MissionStatus } from "@/types/disaster";

export async function GET(req: NextRequest) {
  try {
    const missions = disasterStore.getMissions();
    const incidents = disasterStore.getIncidents();

    // Attach full incident details
    const populated = missions.map((m) => {
      const inc = incidents.find((i) => i.id === m.incident_id);
      return { ...m, incident: inc };
    });

    return NextResponse.json({ success: true, missions: populated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { mission_id, status, field_notes, casualties_treated, people_evacuated } = body;

    if (!mission_id || !status) {
      return NextResponse.json({ success: false, error: "Missing mission_id or status" }, { status: 400 });
    }

    const updates: any = { status };
    if (field_notes !== undefined) updates.field_notes = field_notes;
    if (casualties_treated !== undefined) updates.casualties_treated = casualties_treated;
    if (people_evacuated !== undefined) updates.people_evacuated = people_evacuated;

    const updated = disasterStore.updateMission(mission_id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Mission not found" }, { status: 404 });
    }

    // Map status to audit action
    let auditAction: any = "MISSION_ACKNOWLEDGED";
    if (status === "en_route") auditAction = "MISSION_EN_ROUTE";
    else if (status === "on_scene") auditAction = "MISSION_ON_SCENE";
    else if (status === "completed") {
      auditAction = "MISSION_RESOLVED";
      // If completed, update the parent incident to resolved
      disasterStore.updateIncident(updated.incident_id, { status: "resolved" });
    } else if (status === "needs_reinforcement") {
      auditAction = "COMMANDER_OVERRIDE";
    }

    await logDisasterAuditEvent({
      action: auditAction,
      actor_role: "rescue",
      actor_id: updated.team_name,
      incident_id: updated.incident_id,
      details: {
        mission_id: updated.id,
        status: updated.status,
        casualties_treated: updated.casualties_treated,
        people_evacuated: updated.people_evacuated,
        notes: updated.field_notes,
      },
    });

    return NextResponse.json({ success: true, mission: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
