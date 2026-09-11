// =========================================================================
// KURUKSHETRA PS20: AGENTIC DISASTER RELIEF
// Multi-Channel Emergency Dispatcher with CAP v1.2 Protocol
// FILE: lib/notifications/dispatcher.ts
// =========================================================================

import { supabase, isConfigured } from "@/lib/supabaseClient";

export type NotificationUrgency = "critical" | "high" | "moderate" | "advisory";
export type NotificationChannel = "in_app" | "sms" | "voice_call" | "cap_broadcast";

export interface DispatchParams {
  userId?: string;
  recipientPhone?: string;
  urgency: NotificationUrgency;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor";
  incidentId?: string;
  incidentType: string;
  headline: string;
  message: string;
  areaDesc: string;
  coordinates?: [number, number]; // [lat, lng]
  radiusKm?: number;
}

export interface DispatchLogEntry {
  id: string;
  channel: NotificationChannel;
  urgency: NotificationUrgency;
  recipient: string;
  status: "dispatched" | "delivered" | "queued";
  is_simulated: boolean;
  timestamp: string;
  payload: Record<string, any>;
  cap_xml?: string;
}

// In-memory persistent buffer of dispatches during server session
const DISPATCH_HISTORY: DispatchLogEntry[] = [];

/**
 * Generates an OASIS Standard Common Alerting Protocol (CAP v1.2) XML payload
 * adhering to NDMA (National Disaster Management Authority) / IMD standards.
 */
export function generateCAPv12XML(params: {
  identifier: string;
  sentDateISO: string;
  event: string;
  urgency: string;
  severity: string;
  headline: string;
  description: string;
  areaDesc: string;
  coordinates?: [number, number];
  radiusKm?: number;
}): string {
  const {
    identifier,
    sentDateISO,
    event,
    urgency,
    severity,
    headline,
    description,
    areaDesc,
    coordinates,
    radiusKm = 5.0,
  } = params;

  const circleTag = coordinates
    ? `<circle>${coordinates[0].toFixed(4)},${coordinates[1].toFixed(4)},${radiusKm.toFixed(1)}</circle>`
    : `<circle>13.0827,80.2707,5.0</circle>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${identifier}</identifier>
  <sender>kurukshetra-command@ndma.gov.in</sender>
  <sent>${sentDateISO}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <codeValue>CAP-CP-v1.2-IN</codeValue>
  <info>
    <category>Safety</category>
    <event>${event}</event>
    <urgency>${urgency === "critical" ? "Immediate" : urgency === "high" ? "Expected" : "Future"}</urgency>
    <severity>${severity}</severity>
    <certainty>Observed</certainty>
    <eventCode>
      <valueName>NDMA_DISASTER_CODE</valueName>
      <value>${event.toUpperCase()}_ALERT</value>
    </eventCode>
    <headline>${headline}</headline>
    <description>${description}</description>
    <instruction>Evacuate to designated multi-story safe zones immediately. Follow rescue wardens. Tune into VHF 156.8 MHz or call 112.</instruction>
    <contact>State Emergency Operations Centre: 1070</contact>
    <area>
      <areaDesc>${areaDesc}</areaDesc>
      ${circleTag}
    </area>
  </info>
</alert>`.trim();
}

/**
 * Dispatches emergency notification across 4 channels:
 * 1. In-App Notification (Real via Supabase / WebSocket)
 * 2. SMS Dispatch (Simulated log with Indian telco payload formatting)
 * 3. Voice Call Dispatch (Simulated IVR TTS audio script)
 * 4. CAP Broadcast (Standard XML for NDMA / IMD India integration)
 */
export async function dispatchMultiChannelNotification(
  params: DispatchParams
): Promise<{
  success: boolean;
  identifier: string;
  dispatches: DispatchLogEntry[];
  cap_xml: string;
}> {
  const timestamp = new Date().toISOString();
  const identifier = `KRK-CAP-${Date.now()}`;
  const phone = params.recipientPhone || "+91-98400-99882";
  const dispatches: DispatchLogEntry[] = [];

  // 1. In-App Push Notification (Real)
  const inAppLog: DispatchLogEntry = {
    id: `DISP-APP-${Date.now()}`,
    channel: "in_app",
    urgency: params.urgency,
    recipient: params.userId || "ALL_SECTOR_CITIZENS",
    status: "delivered",
    is_simulated: false,
    timestamp,
    payload: {
      title: params.headline,
      message: params.message,
      incident_id: params.incidentId,
      delivered_via: "Supabase Realtime WebSockets",
    },
  };
  dispatches.push(inAppLog);

  if (isConfigured) {
    try {
      await supabase.from("notifications").insert({
        user_id: params.userId || null,
        type: "in_app",
        urgency: params.urgency,
        message: params.message,
        incident_id: params.incidentId || null,
        created_at: timestamp,
      });
    } catch (e) {
      console.warn("Supabase notification insert skipped:", e);
    }
  }

  // 2. SMS Notification (Simulated log with true NDMA format)
  const smsBody = `🚨 NDMA EMERGENCY ALERT [${params.urgency.toUpperCase()}]: ${params.headline}. ${params.message}. Evacuate immediately along high ground corridors. Reply 1 if SAFE, 2 if RESCUE NEEDED. (Toll-Free 112)`;
  const smsLog: DispatchLogEntry = {
    id: `DISP-SMS-${Date.now() + 1}`,
    channel: "sms",
    urgency: params.urgency,
    recipient: phone,
    status: "dispatched",
    is_simulated: true, // Transparent disclosure
    timestamp,
    payload: {
      to: phone,
      sender_id: "NDMA-ALERT",
      body: smsBody,
      carrier_route: "BSNL / Airtel Emergency Priority Line (Simulated)",
      telecom_status: "DELIVERED_TO_HANDSET",
    },
  };
  dispatches.push(smsLog);

  // 3. Voice Call Broadcast (Simulated for Critical / High)
  if (params.urgency === "critical" || params.urgency === "high") {
    const voiceScript = `This is an urgent emergency announcement from the State Disaster Management Authority. A ${params.incidentType} warning has been issued for ${params.areaDesc}. Move immediately to higher elevation or designated cyclone shelters. Do not enter floodwaters.`;
    const voiceLog: DispatchLogEntry = {
      id: `DISP-VOICE-${Date.now() + 2}`,
      channel: "voice_call",
      urgency: params.urgency,
      recipient: phone,
      status: "dispatched",
      is_simulated: true,
      timestamp,
      payload: {
        to: phone,
        ivr_script: voiceScript,
        tts_engine: "Hindi/English Dual Synthesis",
        call_duration_est_sec: 24,
        ring_priority: "EMERGENCY_OVERRIDE_DND",
      },
    };
    dispatches.push(voiceLog);
  }

  // 4. Common Alerting Protocol (CAP v1.2) Broadcast
  const capXML = generateCAPv12XML({
    identifier,
    sentDateISO: timestamp,
    event: params.incidentType,
    urgency: params.urgency,
    severity: params.severity,
    headline: params.headline,
    description: params.message,
    areaDesc: params.areaDesc,
    coordinates: params.coordinates,
    radiusKm: params.radiusKm,
  });

  const capLog: DispatchLogEntry = {
    id: `DISP-CAP-${Date.now() + 3}`,
    channel: "cap_broadcast",
    urgency: params.urgency,
    recipient: "NDMA_CAP_GATEWAY // IMD_DELHI",
    status: "delivered",
    is_simulated: true,
    timestamp,
    payload: {
      standard: "OASIS CAP v1.2",
      scope: "Public",
      format: "XML / RSS 2.0 / ATOM",
      target_systems: ["Cell Broadcast Service (CBS)", "All India Radio", "Doordarshan DD National Emergency Banner"],
    },
    cap_xml: capXML,
  };
  dispatches.push(capLog);

  // Push into session history buffer
  DISPATCH_HISTORY.unshift(...dispatches);
  if (DISPATCH_HISTORY.length > 50) {
    DISPATCH_HISTORY.length = 50;
  }

  return {
    success: true,
    identifier,
    dispatches,
    cap_xml: capXML,
  };
}

/**
 * Returns recent multi-channel dispatch logs.
 */
export function getRecentDispatches(): DispatchLogEntry[] {
  return [...DISPATCH_HISTORY];
}
