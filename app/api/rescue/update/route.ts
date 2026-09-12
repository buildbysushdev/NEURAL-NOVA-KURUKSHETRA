import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { updateSyncState } from '@/lib/syncStore';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export async function POST(req: NextRequest) {
  try {
    const { allocationId, incidentId, status } = await req.json().catch(() => ({}));

    if (!status || (!allocationId && !incidentId)) {
      return NextResponse.json(
        { error: 'status and (allocationId or incidentId) are required' },
        { status: 400 }
      );
    }

    const targetIncidentId = incidentId || allocationId;

    // 1) Update Incidents status in Supabase
    if (sb && targetIncidentId) {
      try {
        await sb
          .from('incidents')
          .update({ status: status === 'resolved' ? 'resolved' : 'in_progress' })
          .eq('id', targetIncidentId);
      } catch (incErr) {
        console.warn('[Rescue Update] Incident update warning:', incErr);
      }
    }

    // 2) Update Allocations status in Supabase if table exists
    if (sb && allocationId) {
      try {
        await sb.from('allocations').update({ status }).eq('id', allocationId);
      } catch (allocErr) {
        console.warn('[Rescue Update] Allocation update warning:', allocErr);
      }
    }

    // 3) Create Citizen Notification
    let notifTitle = 'Help is on the way';
    let notifMessage = 'Rescue squad accepted your sector mission and is en route.';
    let notifUrgency: 'warning' | 'info' | 'critical' = 'warning';

    if (status === 'resolved') {
      notifTitle = 'Rescue Update: Mission Resolved';
      notifMessage = 'Field squad has resolved the incident and secured your sector. Stay alert for official advisories.';
      notifUrgency = 'info';
    }

    const newNotification = {
      id: crypto.randomUUID(),
      channel: 'in_app' as const,
      urgency: notifUrgency,
      title: notifTitle,
      message: notifMessage,
      incident_id: targetIncidentId,
      is_read: false,
      is_simulated: true,
      created_at: new Date().toISOString(),
    };

    if (sb) {
      try {
        await sb.from('notifications').insert([newNotification]);
      } catch (notifErr) {
        console.warn('[Rescue Update] Notification insert handled:', notifErr);
      }
    }

    // 4) Insert Audit Log
    const auditEntry = {
      id: crypto.randomUUID(),
      agent_name: 'Rescue Squad Alpha',
      action: status === 'resolved' ? 'Mission RESOLVED' : 'Mission IN PROGRESS (Squad En Route)',
      details_json: { allocationId, incidentId: targetIncidentId, status },
      timestamp: new Date().toISOString(),
    };

    if (sb) {
      try {
        await sb.from('audit_logs').insert([auditEntry]);
      } catch (auditErr) {
        console.warn('[Rescue Update] Audit log insert warning:', auditErr);
      }
    }

    // 5) Update shared sync state
    updateSyncState((prev) => ({
      incidents: prev.incidents.map((i) =>
        i.id === targetIncidentId ? { ...i, status: status === 'resolved' ? 'resolved' : 'in_progress' } : i
      ),
      allocations: prev.allocations.map((a) =>
        a.id === allocationId || a.incident_id === targetIncidentId ? { ...a, status } : a
      ),
      notifications: [newNotification, ...prev.notifications],
      auditLogs: [auditEntry, ...prev.auditLogs],
    }));

    // 6) Realtime broadcast to all browser windows
    if (sb) {
      try {
        const channel = sb.channel('kurukshetra-realtime-sync');
        await channel.send({
          type: 'broadcast',
          event: 'rescue_status_updated',
          payload: {
            allocationId,
            incidentId: targetIncidentId,
            status,
            notification: newNotification,
            auditLog: auditEntry,
          },
        });
      } catch (bErr) {
        console.warn('[Rescue Update] Broadcast warning:', bErr);
      }
    }

    return NextResponse.json({
      success: true,
      status,
      incidentId: targetIncidentId,
      notification: newNotification,
      auditLog: auditEntry,
    });
  } catch (err: any) {
    console.error('[Rescue Update] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
