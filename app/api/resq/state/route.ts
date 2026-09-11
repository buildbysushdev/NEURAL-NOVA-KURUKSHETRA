import { NextResponse } from "next/server";
import { resqStore } from "@/lib/resq/store";
import { DemoScenario } from "@/lib/resq/types";

export async function GET() {
  try {
    const state = resqStore.getState();
    return NextResponse.json({ success: true, data: state });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch RESQNET state" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, scenario, transport, online } = body;

    if (action === "scenario" && scenario) {
      const updated = resqStore.runScenario(scenario as DemoScenario);
      return NextResponse.json({ success: true, scenario, data: updated });
    }

    if (action === "resolve_duplicate") {
      const updated = resqStore.resolveDuplicate();
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === "toggle_transport" && transport) {
      const commMgr = resqStore.getCommManager();
      if (transport === "cellular") commMgr.setCellular(Boolean(online));
      if (transport === "internet") commMgr.setInternet(Boolean(online));
      if (transport === "p2p_mesh") commMgr.setP2P(Boolean(online));
      if (transport === "lora") commMgr.setLoRaGateway(Boolean(online));
      if (transport === "satellite") commMgr.setSatelliteSimulated(Boolean(online));

      resqStore.getAuditLogger().logEvent(
        "CELLULAR_LOST",
        `Transport ${transport.toUpperCase()} switched to ${online ? "ONLINE" : "OFFLINE"}.`,
        "COMM_MANAGER"
      );

      return NextResponse.json({ success: true, data: resqStore.getState() });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Action failed" },
      { status: 500 }
    );
  }
}
