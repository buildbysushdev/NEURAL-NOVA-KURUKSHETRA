import { NextRequest, NextResponse } from "next/server";
import { disasterStore } from "@/lib/supabase/mock-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const action = searchParams.get("action");

    let logs = disasterStore.getAuditLogs();

    if (role && role !== "all") {
      logs = logs.filter((l) => l.actor_role === role);
    }
    if (action && action !== "all") {
      logs = logs.filter((l) => l.action === action);
    }

    return NextResponse.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
