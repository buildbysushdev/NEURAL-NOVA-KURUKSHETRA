// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 5: Demo Helpers & API Routes
// FILE: app/api/demo/simulate-disaster/route.ts
// ROLE: Senior Backend Architect & Frontend Integration
// DESCRIPTION: Seeds realistic disaster incidents across all portals with
//              full multi-table sync (incidents, allocations, notifications, audit_logs).
// =========================================================================

import { NextRequest, NextResponse } from "next/server";
import { POST as simulatePOST } from "@/app/api/simulate/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const scenario = body.scenario || "blue-flood";

    // Forward to full multi-portal synchronization engine in app/api/simulate/route.ts
    const simulatedReq = new NextRequest(new URL("/api/simulate", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario }),
    });

    const response = await simulatePOST(simulatedReq);
    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Successfully seeded multi-portal disaster incidents with realtime synchronization.",
      ...data,
      count: data.incidents || data.data?.incidents?.length || 2,
      simulated_incidents: data.data?.incidents || [],
      incidents: data.data?.incidents || [],
    });
  } catch (error: any) {
    console.error("[simulate-disaster] Error:", error.message || error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error triggering disaster simulation." },
      { status: 500 }
    );
  }
}

