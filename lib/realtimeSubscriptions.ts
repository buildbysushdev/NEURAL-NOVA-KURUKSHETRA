/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Utility: lib/realtimeSubscriptions.ts (Supabase Realtime Channel Manager)
 * ==============================================================================
 * 
 * Centralized Realtime subscription hooks & helpers for all 3 dashboards:
 * - Citizen View: Listens for newly broadcasted critical incidents & proximity alerts
 * - Rescue Squad View: Listens for mission assignments and triage updates
 * - Authority View: Listens for incidents, resource inventory shifts, and AI audit events
 */

import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isConfigured } from "@/lib/supabaseClient";

export type RealtimeCallback<T = any> = (payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE" | "*";
  new: T;
  old: Partial<T>;
}) => void;

/**
 * 1. Subscribe to changes on the 'incidents' table
 * Useful for Citizen map updates, Rescue squad task dispatches, and Authority master overview.
 */
export function subscribeToIncidents(
  callback: RealtimeCallback,
  channelName: string = `incidents-stream-${Date.now()}`
): () => void {
  if (!isConfigured || !supabase) {
    console.warn("[Realtime] Supabase not fully configured. Realtime fallback mode active.");
    return () => {};
  }

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "incidents"
      },
      (payload) => {
        console.log(`[Realtime: Incidents] Event: ${payload.eventType}`, payload);
        callback({
          eventType: payload.eventType as any,
          new: payload.new,
          old: payload.old
        });
      }
    )
    .subscribe((status) => {
      console.log(`[Realtime: Incidents] Channel '${channelName}' status:`, status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 2. Subscribe to changes on the 'resources' table
 * Updates Authority inventory stockpiles instantly when AI allocates or replenishes items.
 */
export function subscribeToResources(
  callback: RealtimeCallback,
  channelName: string = `resources-stream-${Date.now()}`
): () => void {
  if (!isConfigured || !supabase) return () => {};

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "resources"
      },
      (payload) => {
        console.log(`[Realtime: Resources] Event: ${payload.eventType}`, payload);
        callback({
          eventType: payload.eventType as any,
          new: payload.new,
          old: payload.old
        });
      }
    )
    .subscribe((status) => {
      console.log(`[Realtime: Resources] Channel '${channelName}' status:`, status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 3. Subscribe to changes on the 'audit_logs' table
 * Streams AI autonomous allocations and decision traces live into the Authority panel.
 */
export function subscribeToAuditLogs(
  callback: RealtimeCallback,
  channelName: string = `audit-logs-stream-${Date.now()}`
): () => void {
  if (!isConfigured || !supabase) return () => {};

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "audit_logs"
      },
      (payload) => {
        console.log(`[Realtime: AuditLogs] New AI trace detected`, payload);
        callback({
          eventType: "INSERT",
          new: payload.new,
          old: payload.old
        });
      }
    )
    .subscribe((status) => {
      console.log(`[Realtime: AuditLogs] Channel '${channelName}' status:`, status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * 4. Master Hub: Combined Multi-Table Realtime Listener
 * Ideal for Authority Master Control desk.
 */
export function subscribeToMasterHub(callbacks: {
  onIncidentChange?: RealtimeCallback;
  onResourceChange?: RealtimeCallback;
  onAuditLogChange?: RealtimeCallback;
}): () => void {
  if (!isConfigured || !supabase) return () => {};

  const channel = supabase.channel(`master-hub-${Date.now()}`);

  if (callbacks.onIncidentChange) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "incidents" },
      (payload) => {
        callbacks.onIncidentChange!({
          eventType: payload.eventType as any,
          new: payload.new,
          old: payload.old
        });
      }
    );
  }

  if (callbacks.onResourceChange) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "resources" },
      (payload) => {
        callbacks.onResourceChange!({
          eventType: payload.eventType as any,
          new: payload.new,
          old: payload.old
        });
      }
    );
  }

  if (callbacks.onAuditLogChange) {
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "audit_logs" },
      (payload) => {
        callbacks.onAuditLogChange!({
          eventType: "INSERT",
          new: payload.new,
          old: payload.old
        });
      }
    );
  }

  channel.subscribe((status) => {
    console.log("[Realtime: MasterHub] Synchronized state:", status);
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
