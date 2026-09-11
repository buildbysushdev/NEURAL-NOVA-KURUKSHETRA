import { NextRequest, NextResponse } from "next/server";

// In-memory demo store for walkie-talkie mesh transmissions
interface StoredTransmission {
  id: string;
  role: "citizen" | "rescue";
  channel: string;
  sector: string;
  audioUrl?: string;
  durationMs: number;
  timestamp: string;
  receivedAt: string;
}

const transmissions: StoredTransmission[] = [
  {
    id: "tx-init-1",
    role: "citizen",
    channel: "CH 7 • 462.7125 MHz",
    sector: "Marina Waterfront Sector B",
    durationMs: 3200,
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    receivedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "tx-init-2",
    role: "rescue",
    channel: "CH 7 • 462.7125 MHz",
    sector: "Marina Waterfront Sector B",
    durationMs: 2400,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    receivedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newTx: StoredTransmission = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: body.role || "citizen",
      channel: body.channel || "CH 7 • 462.7125 MHz",
      sector: body.sector || "Immediate Sector",
      audioUrl: body.audioUrl || "",
      durationMs: body.durationMs || 0,
      timestamp: body.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      receivedAt: new Date().toISOString(),
    };

    transmissions.unshift(newTx);
    if (transmissions.length > 30) transmissions.pop();

    return NextResponse.json({ ok: true, item: newTx });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: transmissions.slice(0, 15),
    active_channel: "CH 7 • 462.7125 MHz",
    mesh_protocol: "LoRa 868MHz / WebRTC Offline Fallback",
  });
}
