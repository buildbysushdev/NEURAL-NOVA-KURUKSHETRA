import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { updateSyncState, type SyncIncident, type SyncAllocation, type SyncNotification } from '@/lib/syncStore';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const sb = supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const scenario = body.scenario || 'blue-flood';

    const incidentSeed =
      scenario === 'red-inferno'
        ? [
            {
              type: 'fire',
              description: 'Industrial blaze with toxic plume near hospital corridor',
              location_lat: 13.05,
              location_lng: 80.25,
              location_name: 'SIDCO Industrial Zone',
              severity_score: 9,
              status: 'open',
              needed_resources: ['fire_tender', 'hazmat', 'medical'],
            },
            {
              type: 'fire',
              description: 'Secondary transformer fire risk near metro access',
              location_lat: 13.0827,
              location_lng: 80.2707,
              location_name: 'Central Metro',
              severity_score: 7,
              status: 'open',
              needed_resources: ['fire_tender', 'medical'],
            },
          ]
        : [
            {
              type: 'flood',
              description: 'Storm surge 2.4m breached seawall, residents stranded',
              location_lat: 13.0544,
              location_lng: 80.2818,
              location_name: 'Marina Waterfront Sector B',
              severity_score: 9,
              status: 'open',
              needed_resources: ['boats', 'water', 'medical'],
            },
            {
              type: 'structural_collapse',
              description: 'Port warehouse roof collapse, workers trapped',
              location_lat: 13.1025,
              location_lng: 80.2985,
              location_name: 'North Harbor',
              severity_score: 10,
              status: 'open',
              needed_resources: ['heavy_machinery', 'medical', 'tent'],
            },
          ];

    // Generate valid UUIDs for all rows
    const incidentRows: any[] = incidentSeed.map((item) => ({
      id: crypto.randomUUID(),
      type: item.type,
      description: `[${item.location_name}] ${item.description}`,
      location_lat: item.location_lat,
      location_lng: item.location_lng,
      severity_score: item.severity_score,
      status: 'open',
      language: 'en',
      created_at: new Date().toISOString(),
    }));

    // 1) Write to Supabase `incidents` table
    let insertedIncidents: any[] = incidentRows;
    if (sb) {
      try {
        const { data, error } = await sb.from('incidents').insert(incidentRows).select();
        if (error) {
          console.warn('[Simulate] Supabase incidents insert warning:', error.message);
        } else if (data && data.length > 0) {
          insertedIncidents = data;
        }
      } catch (err: any) {
        console.warn('[Simulate] Supabase incident error:', err.message);
      }
    }

    // 2) Allocations (so Rescue has tasks)
    const allocationRows: any[] = insertedIncidents.map((inc: any, idx: number) => ({
      id: crypto.randomUUID(),
      incident_id: inc.id,
      quantity_allocated: idx === 0 ? 4 : 2,
      status: 'approved', // ready for rescue squad
      ai_reasoning:
        scenario === 'red-inferno'
          ? 'Fire/medical package prioritized due to toxic plume trajectory'
          : 'Boat + medical package prioritized due to water depth and trapped residents',
      eta_minutes: 12 + idx * 3,
      created_at: new Date().toISOString(),
      incident: {
        id: inc.id,
        type: inc.type,
        description: inc.description,
        location_lat: inc.location_lat,
        location_lng: inc.location_lng,
        severity_score: inc.severity_score,
        status: inc.status || 'open',
        location_name: incidentSeed[idx]?.location_name || 'Assigned Sector',
      },
    }));

    if (sb) {
      try {
        await sb.from('allocations').insert(allocationRows);
      } catch (allocErr) {
        // Table may not exist yet in custom schema
        console.warn('[Simulate] allocation insert handled:', allocErr);
      }
    }

    // 3) Citizen notifications (THIS IS WHAT CITIZEN MUST READ)
    const notificationRows: any[] = insertedIncidents.map((inc: any, idx: number) => {
      const locName = incidentSeed[idx]?.location_name || 'Your Sector';
      return {
        id: crypto.randomUUID(),
        channel: 'in_app',
        urgency: inc.severity_score >= 8 ? 'critical' : 'warning',
        title:
          inc.severity_score >= 8
            ? `CRITICAL ALERT: ${String(inc.type).replace('_', ' ').toUpperCase()}`
            : `WARNING: ${String(inc.type).replace('_', ' ').toUpperCase()}`,
        message: `${locName}: ${inc.description.replace(/^\[.*?\]\s*/, '')}`,
        incident_id: inc.id,
        is_read: false,
        is_simulated: true,
        created_at: new Date().toISOString(),
      };
    });

    if (sb) {
      try {
        await sb.from('notifications').insert(notificationRows);
      } catch (notifErr) {
        console.warn('[Simulate] notification insert handled:', notifErr);
      }
    }

    // 4) Audit trail in Supabase
    const auditRows = [
      {
        id: crypto.randomUUID(),
        agent_name: 'Sentinel Agent (Groq LLaMA 3.1)',
        action: `Triaged ${insertedIncidents.length} incidents for ${scenario}`,
        details_json: { scenario, count: insertedIncidents.length, high_severity: true },
        timestamp: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        agent_name: 'Strategist Agent (Google Gemini 1.5)',
        action: `Generated ${allocationRows.length} dispatch packages for Rescue Squad Alpha`,
        details_json: { scenario, packages: allocationRows.length },
        timestamp: new Date(Date.now() + 500).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        agent_name: 'CAP Dispatch Agent',
        action: `Citizen emergency broadcast queued: ${notificationRows.length} high-priority advisories`,
        details_json: { notifications: notificationRows.length },
        timestamp: new Date(Date.now() + 1000).toISOString(),
      },
    ];

    if (sb) {
      try {
        await sb.from('audit_logs').insert(auditRows);
      } catch (auditErr) {
        console.warn('[Simulate] audit_logs insert warning:', auditErr);
      }
    }

    // 5) Update shared synchronized cache
    const formattedIncidents: SyncIncident[] = insertedIncidents.map((inc: any, i: number) => ({
      id: inc.id,
      type: inc.type,
      description: inc.description,
      location_lat: inc.location_lat,
      location_lng: inc.location_lng,
      location_name: incidentSeed[i]?.location_name || 'Emergency Sector',
      severity_score: inc.severity_score,
      severity: inc.severity_score >= 8 ? 'CRITICAL' : 'HIGH',
      status: 'open',
      needed_resources: incidentSeed[i]?.needed_resources || ['medical', 'boats'],
      created_at: inc.created_at || new Date().toISOString(),
    }));

    updateSyncState((prev) => ({
      incidents: [...formattedIncidents, ...prev.incidents.filter((p) => !formattedIncidents.some((n) => n.id === p.id))],
      allocations: [...allocationRows, ...prev.allocations.filter((p) => !allocationRows.some((n) => n.id === p.id))],
      notifications: [...notificationRows, ...prev.notifications],
      auditLogs: [...auditRows, ...prev.auditLogs],
    }));

    // 6) Broadcast to all open portal windows via Supabase Realtime channel
    if (sb) {
      try {
        const channel = sb.channel('kurukshetra-realtime-sync');
        await channel.send({
          type: 'broadcast',
          event: 'scenario_simulated',
          payload: {
            scenario,
            incidents: formattedIncidents,
            allocations: allocationRows,
            notifications: notificationRows,
            auditLogs: auditRows,
          },
        });
      } catch (bErr) {
        console.warn('[Simulate] Broadcast handled:', bErr);
      }
    }

    return NextResponse.json({
      success: true,
      scenario,
      incidents: formattedIncidents.length,
      allocations: allocationRows.length,
      notifications: notificationRows.length,
      data: {
        incidents: formattedIncidents,
        allocations: allocationRows,
        notifications: notificationRows,
      },
    });
  } catch (e: any) {
    console.error('[Simulate] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
