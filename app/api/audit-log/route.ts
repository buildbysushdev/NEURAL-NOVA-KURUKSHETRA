// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 5: Demo Helpers & API Routes
// FILE: app/api/audit-log/route.ts
// ROLE: Senior Backend Architect & Frontend Integration
// DESCRIPTION: Next.js 14 API route to fetch the latest 50 audit logs
//              from the audit_logs table for the Authority War Room dashboard,
//              and handle PATCH for manual officer override.
// =========================================================================

import { NextRequest, NextResponse } from "next/server";
import { disasterStore } from "@/lib/supabase/mock-data";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { AuditLogRecord } from "@/types/backend";

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

    // 2. Local fallback from in-memory store if available
    try {
      const localLogs = disasterStore.getAuditLogs().map((l) => ({
        id: l.id,
        agent_name: (l as any).agent_name || l.actor_id || "Sentinel/Strategist Agent",
        action: l.action,
        details_json: (l as any).details_json || l.details,
        timestamp: l.timestamp,
      }));

      if (localLogs.length > 0) {
        return NextResponse.json({
          success: true,
          count: Math.min(limit, localLogs.length),
          logs: localLogs.slice(0, limit),
        });
      }
    } catch {
      // Proceed to default mock records
    }

    // 3. Fallback audit logs matching the contract
    const defaultLogs: AuditLogRecord[] = [
      {
        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        agent_name: "Strategist Agent",
        action: "Strategist Agent allocated Resource res-01 to Incident inc-01",
        details_json: {
          event: "RESOURCE_ALLOCATION",
          resource_type: "water",
          quantity: 500,
          depot: "Marina Central Depot"
        },
        timestamp: "2026-09-11T10:15:30.000Z"
      },
      {
        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6e",
        agent_name: "Sentinel Agent",
        action: "Sentinel Agent flagged Flood Surge in Zone B as Priority 8 Critical",
        details_json: {
          event: "SEVERITY_ASSESSMENT",
          severity_score: 8,
          needed_resources: ["boats", "water"]
        },
        timestamp: "2026-09-11T10:12:10.000Z"
      },
      {
        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6f",
        agent_name: "Authority",
        action: "Authority Commander approved 120 Trauma Packs dispatch to Central Metro Corridor",
        details_json: {
          event: "MANUAL_APPROVAL",
          officer: "State Disaster Management Authority",
          status: "approved"
        },
        timestamp: "2026-09-11T10:08:45.000Z"
      },
      {
        id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb70",
        agent_name: "Strategist Agent",
        action: "Strategist Agent diverted 4x4 Emergency Convoy away from Zone E Mudslide",
        details_json: {
          event: "ROUTE_OPTIMIZATION",
          alternative_route: "Eastern Ring Bypass",
          delay_mitigated_minutes: 35
        },
        timestamp: "2026-09-11T10:02:15.000Z"
      }
    ];

    return NextResponse.json({
      success: true,
      count: defaultLogs.length,
      logs: defaultLogs
    });
  } catch (error: any) {
    console.error("[GET /api/audit-log] Exception fetching audit logs:", error.message || error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching audit logs." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/audit-log
 * Manual officer override for AI decisions.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: id and status" },
        { status: 400 }
      );
    }

    if (isConfigured && supabase) {
      await supabase
        .from("audit_logs")
        .update({
          details_json: { status, overridden_by: "Authority Commander" }
        })
        .eq("id", id);
    }

    return NextResponse.json({
      success: true,
      message: `Audit log record #${id} updated to ${status}`,
      updated: { id, status }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update audit log" },
      { status: 500 }
    );
  }
}
