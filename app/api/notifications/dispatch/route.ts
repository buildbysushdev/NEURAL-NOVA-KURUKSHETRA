import { NextRequest, NextResponse } from "next/server";
import { dispatchMultiChannelNotification, getRecentDispatches } from "@/lib/notifications/dispatcher";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      headline,
      message,
      incidentType,
      severity,
      urgency,
      areaDesc,
      recipientPhone,
      coordinates,
      radiusKm,
    } = body;

    const result = await dispatchMultiChannelNotification({
      headline: headline || "Immediate Emergency Warning",
      message: message || "Rising water levels detected in sector. Move to designated safe shelters.",
      incidentType: incidentType || "Flash Flood",
      severity: severity || "Extreme",
      urgency: urgency || "critical",
      areaDesc: areaDesc || "Marina Waterfront Sector B, Chennai",
      recipientPhone: recipientPhone || "+91-98400-99882",
      coordinates: coordinates || [13.0827, 80.2707],
      radiusKm: radiusKm || 5.0,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error in notification dispatch API:", error);
    return NextResponse.json(
      { error: "Notification dispatch failed", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const history = getRecentDispatches();
  return NextResponse.json({ dispatches: history }, { status: 200 });
}
