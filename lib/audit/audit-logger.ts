// =========================================================================
// KURUKSHETRA PS20: AGENTIC DISASTER RELIEF
// Audit Logger Utility
// FILE: lib/audit/audit-logger.ts
// =========================================================================

import { disasterStore } from "@/lib/supabase/mock-data";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { generateUUID } from "@/lib/utils";

export interface LogAuditParams {
  action: string;
  actor_role: "citizen" | "rescue" | "authority" | "ai_agent";
  actor_id?: string;
  incident_id?: string;
  details: Record<string, any>;
  timestamp?: string;
}

/**
 * Logs an immutable audit event to both the Supabase DB and local store.
 */
export async function logDisasterAuditEvent(params: LogAuditParams) {
  const timestamp = params.timestamp || new Date().toISOString();
  const id = generateUUID();

  // 1. Record in local store
  try {
    disasterStore.addAuditLog({
      id,
      action: params.action as any,
      actor_role: params.actor_role,
      actor_id: params.actor_id,
      incident_id: params.incident_id,
      details: params.details,
      timestamp,
    });
  } catch (err) {
    console.error("Local audit log error:", err);
  }

  // 2. Persist to Supabase if live
  if (isConfigured && supabase) {
    try {
      await supabase.from("audit_logs").insert([
        {
          id,
          agent_name: params.actor_id || params.actor_role,
          action: params.action,
          details_json: {
            ...params.details,
            actor_role: params.actor_role,
            incident_id: params.incident_id,
          },
          timestamp,
        },
      ]);
    } catch (err) {
      console.warn("Supabase audit log insert warning:", err);
    }
  }

  return { id, timestamp };
}
