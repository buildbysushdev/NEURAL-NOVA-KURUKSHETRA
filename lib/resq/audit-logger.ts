/**
 * ==============================================================================
 * RESQNET: Cryptographic & Chronological Audit Logger
 * ==============================================================================
 */

import { AuditEvent } from "./types";

export class AuditLogger {
  private events: AuditEvent[] = [];

  constructor() {
    this.initDefaultTimeline();
  }

  public initDefaultTimeline(): void {
    const baseDate = new Date();
    const formatTime = (offsetSec: number) => {
      const d = new Date(baseDate.getTime() + offsetSec * 1000);
      return d.toTimeString().split(" ")[0]; // "10:42:13"
    };

    this.events = [
      {
        id: "evt-01",
        timestamp: new Date().toISOString(),
        time_display: formatTime(0),
        event_type: "SOS_CREATED",
        packet_id: "SOS-001",
        actor: "CITIZEN",
        details: "Citizen reported fire & casualties in Building B17 (Floor 3).",
      },
      {
        id: "evt-02",
        timestamp: new Date().toISOString(),
        time_display: formatTime(2),
        event_type: "AI_TRIAGE_COMPLETE",
        packet_id: "SOS-001",
        actor: "LOCAL_AI",
        details: "Local AI classified incident as P0 CRITICAL (84-byte packet).",
      },
    ];
  }

  public logEvent(
    eventType: AuditEvent["event_type"],
    details: string,
    actor: AuditEvent["actor"] = "SYSTEM_AGENT" as any,
    packetId?: string,
    incidentId?: string
  ): AuditEvent {
    const now = new Date();
    const timeDisplay = now.toTimeString().split(" ")[0];

    const event: AuditEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now.toISOString(),
      time_display: timeDisplay,
      event_type: eventType,
      packet_id: packetId,
      incident_id: incidentId,
      details,
      actor,
    };

    this.events.unshift(event); // newest first
    return event;
  }

  public getEvents(): AuditEvent[] {
    return [...this.events];
  }

  public reset(): void {
    this.events = [];
    this.initDefaultTimeline();
  }
}
