// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 5: Demo Helpers & API Routes
// FILE: app/api/audit-log/route.ts
// ROLE: Senior Backend Architect
// DESCRIPTION: Next.js 14 API route to fetch the latest 50 audit logs
//              from the audit_logs table for the Authority War Room dashboard.
// =========================================================================

import { NextRequest, NextResponse } from "next/server";
import { disasterStore } from "@/lib/supabase/mock-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit-log
 * Fetches the last 50 audit log entries in reverse-chronological order.
 */
export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const limit = 50;

    // 1. If Supabase DB is connected, fetch live logs from public.audit_logs
    if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes("your-project")) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      const { data: dbLogs, error: dbError } = await supabaseAdmin
        .from("audit_logs")
        .select("id, agent_name, action, details_json, timestamp")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (!dbError && dbLogs && dbLogs.length > 0) {
        return NextResponse.json({
          success: true,
          count: dbLogs.length,
          logs: dbLogs,
        });
      }
    }

    // 2. Local fallback / sync with in-memory store
    const localLogs = disasterStore.getAuditLogs().map((l) => ({
      id: l.id,
      agent_name: (l as any).agent_name || l.actor_id || "Sentinel/Strategist Agent",
      action: l.action,
      details_json: (l as any).details_json || l.details,
      timestamp: l.timestamp,
    }));

    return NextResponse.json({
      success: true,
      count: Math.min(limit, localLogs.length),
      logs: localLogs.slice(0, limit),
    });
  } catch (error: any) {
    console.error("[GET /api/audit-log] Exception fetching audit logs:", error.message || error);
    return NextResponse.json(
      { error: "Internal server error fetching audit logs." },
      { status: 500 }
    );
  }
}
