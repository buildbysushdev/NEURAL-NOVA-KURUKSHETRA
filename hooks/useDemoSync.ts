'use client';

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Unified Cross-Portal Realtime Synchronization Hook (hooks/useDemoSync.ts)
 * ==============================================================================
 * 
 * Provides live subscriptions across:
 * - Supabase PostgreSQL realtime replication (`postgres_changes`)
 * - Supabase Realtime WebSocket broadcast channel (`kurukshetra-realtime-sync`)
 * - Cross-window storage & custom DOM events for instant sub-millisecond local sync
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface LiveIncident {
  id: string;
  type: string;
  description: string;
  location_lat: number;
  location_lng: number;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  severity_score: number;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | string;
  status: 'open' | 'in_progress' | 'resolved' | string;
  needed_resources?: string[];
  created_at: string;
}

export interface LiveNotification {
  id: string;
  channel: 'in_app' | 'sms' | 'broadcast';
  urgency: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  incident_id?: string;
  is_read: boolean;
  is_simulated: boolean;
  created_at: string;
}

export interface LiveAllocation {
  id: string;
  incident_id: string;
  quantity_allocated: number;
  status: 'pending' | 'approved' | 'in_progress' | 'resolved' | string;
  ai_reasoning: string;
  eta_minutes: number;
  created_at: string;
  incident?: LiveIncident;
}

export interface LiveAuditLog {
  id: string;
  agent_name: string;
  action: string;
  details_json: Record<string, any>;
  timestamp: string;
}

// -----------------------------------------------------------------------------
// 1. LIVE INCIDENTS HOOK (Reads from Supabase + Broadcast + Sync API)
// -----------------------------------------------------------------------------
export function useIncidentsLive() {
  const [incidents, setIncidents] = useState<LiveIncident[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // 1. Try Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: LiveIncident[] = data.map((d: any) => ({
            id: d.id?.toString(),
            type: d.type || 'Emergency Incident',
            description: d.description || '',
            location_lat: Number(d.location_lat ?? d.latitude) || 13.0827,
            location_lng: Number(d.location_lng ?? d.longitude) || 80.2707,
            latitude: Number(d.location_lat ?? d.latitude) || 13.0827,
            longitude: Number(d.location_lng ?? d.longitude) || 80.2707,
            severity_score: d.severity_score !== undefined ? Number(d.severity_score) : 8,
            severity:
              d.severity_score >= 8
                ? 'CRITICAL'
                : d.severity_score >= 6
                ? 'HIGH'
                : d.severity || 'HIGH',
            status: d.status || 'open',
            needed_resources: d.needed_resources || [],
            created_at: d.created_at || new Date().toISOString(),
          }));
          setIncidents(mapped);
          setLoading(false);
          return;
        }
      }

      // 2. Fallback to /api/sync
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.incidents && json.incidents.length > 0) {
          setIncidents(json.incidents);
        }
      }
    } catch (e) {
      console.warn('[useIncidentsLive] Load error, keeping current state:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Channel 1: Supabase Postgres Replication
    const pgChannel = supabase
      ?.channel('incidents-postgres-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        load();
      })
      .subscribe();

    // Channel 2: Supabase Realtime Broadcast (Zero latency across portals)
    const broadcastChannel = supabase
      ?.channel('kurukshetra-realtime-sync')
      .on('broadcast', { event: 'scenario_simulated' }, (payload: any) => {
        if (payload?.payload?.incidents) {
          setIncidents((prev) => {
            const incoming: LiveIncident[] = payload.payload.incidents;
            const existingIds = new Set(incoming.map((i) => i.id));
            return [...incoming, ...prev.filter((p) => !existingIds.has(p.id))];
          });
        } else {
          load();
        }
      })
      .on('broadcast', { event: 'rescue_status_updated' }, (payload: any) => {
        const p = payload?.payload;
        if (p?.incidentId && p?.status) {
          setIncidents((prev) =>
            prev.map((i) => (i.id === p.incidentId ? { ...i, status: p.status } : i))
          );
        }
      })
      .subscribe();

    // Channel 3: Window storage & custom events for instant multi-tab sync
    const handleStorage = () => load();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('kurukshetra:sync_refresh', handleStorage);

    return () => {
      if (pgChannel) supabase?.removeChannel(pgChannel);
      if (broadcastChannel) supabase?.removeChannel(broadcastChannel);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kurukshetra:sync_refresh', handleStorage);
    };
  }, [load]);

  const critical = incidents.filter(
    (i) => i.severity_score >= 8 || i.severity === 'CRITICAL'
  );

  return { incidents, loading, critical, refresh: load };
}

// -----------------------------------------------------------------------------
// 2. LIVE NOTIFICATIONS HOOK (Citizen & Responder Alerts)
// -----------------------------------------------------------------------------
export function useNotificationsLive() {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          setNotifications(data);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.notifications) {
          setNotifications(json.notifications);
        }
      }
    } catch (e) {
      console.warn('[useNotificationsLive] error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const pgChannel = supabase
      ?.channel('notifications-postgres-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        load();
      })
      .subscribe();

    const broadcastChannel = supabase
      ?.channel('kurukshetra-realtime-sync')
      .on('broadcast', { event: 'scenario_simulated' }, (payload: any) => {
        if (payload?.payload?.notifications) {
          setNotifications((prev) => [...payload.payload.notifications, ...prev]);
        } else {
          load();
        }
      })
      .on('broadcast', { event: 'rescue_status_updated' }, (payload: any) => {
        if (payload?.payload?.notification) {
          setNotifications((prev) => [payload.payload.notification, ...prev]);
        }
      })
      .subscribe();

    const handleStorage = () => load();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('kurukshetra:sync_refresh', handleStorage);

    return () => {
      if (pgChannel) supabase?.removeChannel(pgChannel);
      if (broadcastChannel) supabase?.removeChannel(broadcastChannel);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kurukshetra:sync_refresh', handleStorage);
    };
  }, [load]);

  const topAlert = notifications[0] || null;

  return { notifications, loading, topAlert, refresh: load };
}

// -----------------------------------------------------------------------------
// 3. LIVE ALLOCATIONS HOOK (Rescue Missions & Dispatch Packages)
// -----------------------------------------------------------------------------
export function useAllocationsLive() {
  const [allocations, setAllocations] = useState<LiveAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('allocations')
          .select('*, incident:incidents(*)')
          .in('status', ['approved', 'dispatched', 'in_progress', 'pending'])
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setAllocations(data);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.allocations) {
          setAllocations(json.allocations);
        }
      }
    } catch (e) {
      console.warn('[useAllocationsLive] error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const pgChannel = supabase
      ?.channel('allocations-postgres-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'allocations' }, () => {
        load();
      })
      .subscribe();

    const broadcastChannel = supabase
      ?.channel('kurukshetra-realtime-sync')
      .on('broadcast', { event: 'scenario_simulated' }, (payload: any) => {
        if (payload?.payload?.allocations) {
          setAllocations((prev) => {
            const incoming: LiveAllocation[] = payload.payload.allocations;
            const ids = new Set(incoming.map((i) => i.id));
            return [...incoming, ...prev.filter((p) => !ids.has(p.id))];
          });
        } else {
          load();
        }
      })
      .on('broadcast', { event: 'rescue_status_updated' }, (payload: any) => {
        const p = payload?.payload;
        if (p?.allocationId && p?.status) {
          setAllocations((prev) =>
            prev.map((a) => (a.id === p.allocationId ? { ...a, status: p.status } : a))
          );
        } else if (p?.incidentId && p?.status) {
          setAllocations((prev) =>
            prev.map((a) => (a.incident_id === p.incidentId ? { ...a, status: p.status } : a))
          );
        }
      })
      .subscribe();

    const handleStorage = () => load();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('kurukshetra:sync_refresh', handleStorage);

    return () => {
      if (pgChannel) supabase?.removeChannel(pgChannel);
      if (broadcastChannel) supabase?.removeChannel(broadcastChannel);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kurukshetra:sync_refresh', handleStorage);
    };
  }, [load]);

  return { allocations, loading, refresh: load };
}

// -----------------------------------------------------------------------------
// 4. LIVE AUDIT LOGS HOOK (Realtime War Room Transparency)
// -----------------------------------------------------------------------------
export function useAuditLogsLive() {
  const [auditLogs, setAuditLogs] = useState<LiveAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(30);

        if (!error && data && data.length > 0) {
          setAuditLogs(data);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.auditLogs) {
          setAuditLogs(json.auditLogs);
        }
      }
    } catch (e) {
      console.warn('[useAuditLogsLive] error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    const pgChannel = supabase
      ?.channel('audit-postgres-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
        load();
      })
      .subscribe();

    const broadcastChannel = supabase
      ?.channel('kurukshetra-realtime-sync')
      .on('broadcast', { event: 'scenario_simulated' }, (payload: any) => {
        if (payload?.payload?.auditLogs) {
          setAuditLogs((prev) => [...payload.payload.auditLogs, ...prev]);
        } else {
          load();
        }
      })
      .on('broadcast', { event: 'rescue_status_updated' }, (payload: any) => {
        if (payload?.payload?.auditLog) {
          setAuditLogs((prev) => [payload.payload.auditLog, ...prev]);
        }
      })
      .subscribe();

    return () => {
      if (pgChannel) supabase?.removeChannel(pgChannel);
      if (broadcastChannel) supabase?.removeChannel(broadcastChannel);
    };
  }, [load]);

  return { auditLogs, loading, refresh: load };
}
