// =========================================================================
// KURUKSHETRA PS20: AGENTIC DISASTER RELIEF
// In-Memory Fallback Store & Seed Data
// FILE: lib/supabase/mock-data.ts
// =========================================================================

import {
  Incident,
  Depot,
  ResourceItem,
  RescueMission,
  Allocation,
  AuditLog,
} from "@/types/disaster";
import { generateUUID } from "@/lib/utils";

// Seed Depots across Chennai Zones
const INITIAL_DEPOTS: Depot[] = [
  {
    id: "depot-01",
    name: "Central Logistics Command (Zone A)",
    address: "Chennai Port Trust, Rajaji Salai",
    latitude: 13.085,
    longitude: 80.292,
    contact_phone: "+91 44 2536 1234",
    depot_lead_name: "Col. R. Sundaram",
    operational_status: "operational",
    created_at: new Date().toISOString(),
  },
  {
    id: "depot-02",
    name: "Marina Waterfront Relief Depot (Zone B)",
    address: "Kamarajar Promenade, Triplicane",
    latitude: 13.054,
    longitude: 80.281,
    contact_phone: "+91 44 2844 5678",
    depot_lead_name: "Capt. Meera Nair",
    operational_status: "operational",
    created_at: new Date().toISOString(),
  },
  {
    id: "depot-03",
    name: "West Metropolitan Supply Hub (Zone C)",
    address: "Anna Nagar Western Extension",
    latitude: 13.087,
    longitude: 80.21,
    contact_phone: "+91 44 2621 9012",
    depot_lead_name: "Maj. Vikramaditya",
    operational_status: "operational",
    created_at: new Date().toISOString(),
  },
];

// Seed Resources
const INITIAL_RESOURCES: ResourceItem[] = [
  {
    id: "res-01",
    depot_id: "depot-01",
    category: "drinking_water_liters",
    item_name: "Potable Water Pouches (5L)",
    total_quantity: 10000,
    allocated_quantity: 2500,
    available_quantity: 7500,
    unit: "liters",
    status: "ready",
    updated_at: new Date().toISOString(),
  },
  {
    id: "res-02",
    depot_id: "depot-01",
    category: "rescue_boats",
    item_name: "Inflatable Zodiac Boats (8-person)",
    total_quantity: 25,
    allocated_quantity: 12,
    available_quantity: 13,
    unit: "boats",
    status: "ready",
    updated_at: new Date().toISOString(),
  },
  {
    id: "res-03",
    depot_id: "depot-02",
    category: "medical_kits",
    item_name: "Level-3 Emergency Trauma Kits",
    total_quantity: 500,
    allocated_quantity: 150,
    available_quantity: 350,
    unit: "kits",
    status: "ready",
    updated_at: new Date().toISOString(),
  },
  {
    id: "res-04",
    depot_id: "depot-03",
    category: "food_rations",
    item_name: "Emergency MRE Ration Packs (48-hr)",
    total_quantity: 8000,
    allocated_quantity: 3000,
    available_quantity: 5000,
    unit: "packs",
    status: "ready",
    updated_at: new Date().toISOString(),
  },
  {
    id: "res-05",
    depot_id: "depot-03",
    category: "power_generators",
    item_name: "Industrial 25kVA Diesel Generators",
    total_quantity: 15,
    allocated_quantity: 6,
    available_quantity: 9,
    unit: "units",
    status: "ready",
    updated_at: new Date().toISOString(),
  },
];

// Initial Incidents
const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d901",
    title: "Port Warehouse Structural Collapse",
    description: "Port warehouse roof collapsed after torrential rainfall; multiple workers trapped under debris.",
    category: "building_collapse",
    estimated_people_count: 45,
    latitude: 13.1025,
    longitude: 80.2985,
    address: "Zone A - North Harbor",
    severity_level: "CRITICAL",
    severity_score: 90,
    extracted_needs: { medical_kits: 30, rescue_personnel_units: 15 },
    is_duplicate: false,
    status: "triaged",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "018f4a12-70b1-7299-8854-1b1160a7d902",
    title: "Marina Coastal Seawall Breach & Surge",
    description: "Storm surge breached coastal seawall along Marina Beach. Water entered lower residential communities.",
    category: "flood",
    estimated_people_count: 80,
    latitude: 13.0544,
    longitude: 80.2818,
    address: "Zone B - Marina Waterfront",
    severity_level: "HIGH",
    severity_score: 80,
    extracted_needs: { rescue_boats: 4, drinking_water_liters: 500 },
    is_duplicate: false,
    status: "dispatched",
    created_at: new Date(Date.now() - 2400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Initial Missions
const INITIAL_MISSIONS: RescueMission[] = [
  {
    id: "mission-01",
    incident_id: "018f4a12-70b1-7299-8854-1b1160a7d902",
    team_name: "NDRF Bravo Alpha Strike Unit",
    status: "en_route",
    route_eta_mins: 14,
    team_latitude: 13.045,
    team_longitude: 80.275,
    field_notes: "Convoy en route with 2 high-capacity inflatable craft. Arterial clearance requested.",
    casualties_treated: 3,
    people_evacuated: 18,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Initial Audit Logs
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "audit-01",
    action: "AI_ALLOCATION_GENERATED",
    actor_role: "ai_agent",
    actor_id: "gemini-1.5-flash",
    incident_id: "018f4a12-70b1-7299-8854-1b1160a7d902",
    details: {
      resource: "rescue_boats",
      quantity: 4,
      depot: "Marina Waterfront Relief Depot (Zone B)",
      eta_minutes: 12,
    },
    timestamp: new Date(Date.now() - 2200000).toISOString(),
  },
  {
    id: "audit-02",
    action: "ALLOCATION_APPROVED",
    actor_role: "authority",
    actor_id: "State Disaster Authority Commander",
    incident_id: "018f4a12-70b1-7299-8854-1b1160a7d902",
    details: { status: "dispatched", team: "NDRF Bravo Alpha Strike Unit" },
    timestamp: new Date(Date.now() - 2000000).toISOString(),
  },
];

class DisasterDataStore {
  private incidents: Incident[] = [...INITIAL_INCIDENTS];
  private depots: Depot[] = [...INITIAL_DEPOTS];
  private resources: ResourceItem[] = [...INITIAL_RESOURCES];
  private missions: RescueMission[] = [...INITIAL_MISSIONS];
  private allocations: Allocation[] = [];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

  getIncidents(): Incident[] {
    return [...this.incidents];
  }

  getIncidentById(id: string): Incident | undefined {
    return this.incidents.find((i) => i.id === id);
  }

  addIncident(incident: Incident): void {
    const existingIndex = this.incidents.findIndex((i) => i.id === incident.id);
    if (existingIndex >= 0) {
      this.incidents[existingIndex] = incident;
    } else {
      this.incidents.unshift(incident);
    }
  }

  updateIncident(id: string, updates: Partial<Incident>): Incident | undefined {
    const item = this.incidents.find((i) => i.id === id);
    if (item) {
      Object.assign(item, updates, { updated_at: new Date().toISOString() });
    }
    return item;
  }

  getDepots(): Depot[] {
    return [...this.depots];
  }

  getResources(): ResourceItem[] {
    return [...this.resources];
  }

  updateResourceAllocation(resource_id: string, delta: number): ResourceItem | undefined {
    const res = this.resources.find((r) => r.id === resource_id);
    if (res) {
      res.allocated_quantity = Math.max(0, res.allocated_quantity + delta);
      res.available_quantity = Math.max(0, res.total_quantity - res.allocated_quantity);
      res.status = res.available_quantity === 0 ? "depleted" : res.available_quantity < res.total_quantity * 0.2 ? "low" : "ready";
      res.updated_at = new Date().toISOString();
    }
    return res;
  }

  getMissions(): RescueMission[] {
    return [...this.missions];
  }

  addMission(mission: RescueMission): void {
    this.missions.unshift(mission);
  }

  updateMission(id: string, updates: Partial<RescueMission>): RescueMission | undefined {
    const item = this.missions.find((m) => m.id === id);
    if (item) {
      Object.assign(item, updates, { updated_at: new Date().toISOString() });
    }
    return item;
  }

  getAllocations(): Allocation[] {
    return [...this.allocations];
  }

  addAllocation(allocation: Allocation): void {
    this.allocations.unshift(allocation);
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  addAuditLog(log: Omit<AuditLog, "id" | "timestamp"> & { id?: string; timestamp?: string }): AuditLog {
    const newLog: AuditLog = {
      id: log.id || generateUUID(),
      action: log.action,
      actor_role: log.actor_role,
      actor_id: log.actor_id || "system",
      incident_id: log.incident_id,
      details: log.details || {},
      timestamp: log.timestamp || new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }
}

// Global singleton instance across Next.js API requests
const globalStoreKey = Symbol.for("kurukshetra.disasterStore");
const globalAny = global as any;

export const disasterStore: DisasterDataStore =
  globalAny[globalStoreKey] || (globalAny[globalStoreKey] = new DisasterDataStore());
