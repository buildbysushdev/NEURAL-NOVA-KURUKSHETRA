import { NextRequest, NextResponse } from "next/server";
import { generateTacticalChecklist } from "@/lib/ai/checklist-agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { incident_type, severity, location, incident_id, estimated_affected, details } = body;

    if (!incident_type) {
      return NextResponse.json(
        { error: "Incident type (e.g., flood, cyclone, earthquake, fire) is required." },
        { status: 400 }
      );
    }

    const checklistResponse = await generateTacticalChecklist({
      incident_id: incident_id || `INC-${Date.now()}`,
      incident_type: incident_type || "flood",
      severity: severity || "critical",
      location: location || "Disaster Zone Sector Alpha",
      estimated_affected: estimated_affected ? Number(estimated_affected) : undefined,
      details: details || undefined,
    });

    return NextResponse.json(checklistResponse, { status: 200 });
  } catch (error: any) {
    console.error("API error in historical-checklist:", error);
    return NextResponse.json(
      { error: "Failed to generate tactical checklist", details: error.message },
      { status: 500 }
    );
  }
}
