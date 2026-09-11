import { NextRequest, NextResponse } from "next/server";

export interface MeshSOSPacket {
  id: string;
  clusterId: string;
  rawText: string;
  incidentType: string;
  location: string;
  building: string;
  floor: string;
  civiliansAtRisk: number;
  injuredCount: number;
  childrenCount: number;
  severity: "CRITICAL" | "HIGH" | "MODERATE";
  severityScore: number;
  hazards: string[];
  requiredResources: string[];
  packetSizeBytes: number;
  hopPath: string[];
  timestamp: string;
  status: "dispatched" | "acknowledged" | "en_route" | "resolved";
}

// In-memory demo store for LoRa mesh packets
const meshPackets: MeshSOSPacket[] = [
  {
    id: "pkt-lora-8812",
    clusterId: "CLUSTER-#17",
    rawText: "Bhai building mein dhua aa raha hai aur hum third floor pe phas gaye hain, oxygen bhi kam lag raha hai.",
    incidentType: "Fire / Toxic Smoke & Structural Trap",
    location: "Marina Waterfront Zone B",
    building: "Building B-17 (Residential Complex)",
    floor: "Floor 3",
    civiliansAtRisk: 11,
    injuredCount: 3,
    childrenCount: 2,
    severity: "CRITICAL",
    severityScore: 9.8,
    hazards: ["Toxic Smoke Inhalation", "Oxygen Depletion", "Stairwell Blocked by Debris"],
    requiredResources: ["Fire Rescue Tender", "Paramedic Unit", "4x Oxygen Cylinders"],
    packetSizeBytes: 84,
    hopPath: [
      "Phone 1 (Citizen SOS)",
      "Phone 2 (BLE/Wi-Fi Direct Relay)",
      "LoRa Field Gateway #04 (868 MHz)",
      "NDRF Rescue Command Console"
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    status: "dispatched"
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    count: meshPackets.length,
    clusters: [
      {
        clusterId: "CLUSTER-#17",
        title: "Building B-17 Multi-Unit Fire & Trap Cluster",
        location: "Building B-17, Marina Waterfront Zone B",
        totalCivilians: 11,
        injured: 3,
        children: 2,
        priority: "CRITICAL",
        reportsCount: 50,
        aggregatedHazards: ["Active structural fire", "Dense toxic smoke", "Oxygen depletion concern"],
        recommendedDispatch: ["Fire Rescue Tender (Depot Alpha)", "Paramedic Unit (Saidapet Hub)", "4x Emergency Oxygen Kits"],
        commPath: "Citizen Mesh (Phone 1) ➔ BLE Relay (Phone 2) ➔ LoRa Gateway #04 ➔ Rescue Console",
        packets: meshPackets
      }
    ],
    packets: meshPackets
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newPacket: MeshSOSPacket = {
      id: `pkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clusterId: body.clusterId || "CLUSTER-#17",
      rawText: body.rawText || "Emergency SOS broadcast",
      incidentType: body.incidentType || "Emergency Hazard",
      location: body.location || "Sector B Complex",
      building: body.building || "Building B-17",
      floor: body.floor || "Floor 3",
      civiliansAtRisk: body.civiliansAtRisk || 3,
      injuredCount: body.injuredCount || 1,
      childrenCount: body.childrenCount || 0,
      severity: body.severity || "CRITICAL",
      severityScore: body.severityScore || 9.5,
      hazards: body.hazards || ["Emergency Trap"],
      requiredResources: body.requiredResources || ["Fire Rescue Tender", "Medical Team"],
      packetSizeBytes: body.packetSizeBytes || 84,
      hopPath: body.hopPath || [
        "Phone 1 (Citizen SOS)",
        "Phone 2 (BLE Relay)",
        "LoRa Field Gateway #04 (868 MHz)",
        "NDRF Rescue Command Console"
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "dispatched"
    };

    meshPackets.unshift(newPacket);
    if (meshPackets.length > 25) meshPackets.pop();

    return NextResponse.json({ success: true, packet: newPacket });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 });
  }
}
