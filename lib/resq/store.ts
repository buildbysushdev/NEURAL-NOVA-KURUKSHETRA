/**
 * ==============================================================================
 * RESQNET: Master In-Memory State Store & Demo Simulation Engine
 * ==============================================================================
 */

import {
  ResqZone,
  ResqResource,
  EmergencyPacket,
  IncidentCluster,
  ResourceAllocation,
  DemoScenario,
  AuditEvent,
  NetworkHealth,
  TransportState,
} from "./types";
import { CommunicationManager, CommRouteResolution } from "./communication-manager";
import { AuditLogger } from "./audit-logger";
import { createEmergencyPacket, parseEmergencyTextDeterministic } from "./local-ai-engine";
import {
  allocateResourcesForIncident,
  evaluateDynamicReallocationConflict,
  detectDuplicateDeployment,
  ConflictResolutionResult,
  DuplicateDetectionResult,
} from "./allocation-engine";

// 1. Initial 4 Disaster Zones (Fictional)
const INITIAL_ZONES: ResqZone[] = [
  {
    id: "ZONE-A",
    name: "Zone A — Urban Residential Sector",
    type: "Dense High-Rise & Housing",
    severity: "HIGH",
    status: "ACTIVE",
    commStatus: "CONNECTED",
    lat: 18.5204,
    lng: 73.8567,
    activeIncidentsCount: 2,
    criticalCiviliansCount: 3,
    deployedResourcesCount: 2,
  },
  {
    id: "ZONE-B",
    name: "Zone B — Hospital Corridor",
    type: "Critical Healthcare Infrastructure",
    severity: "CRITICAL",
    status: "ACTIVE",
    commStatus: "CONNECTED",
    lat: 18.5314,
    lng: 73.8446,
    activeIncidentsCount: 1,
    criticalCiviliansCount: 6,
    deployedResourcesCount: 3,
  },
  {
    id: "ZONE-C",
    name: "Zone C — Flooded Low-Lying Basin",
    type: "Riverbank & Flash Inundation",
    severity: "HIGH",
    status: "ACTIVE",
    commStatus: "DEGRADED",
    lat: 18.5089,
    lng: 73.8325,
    activeIncidentsCount: 3,
    criticalCiviliansCount: 8,
    deployedResourcesCount: 1,
  },
  {
    id: "ZONE-D",
    name: "Zone D — Industrial Chemical Plant",
    type: "Hazardous Chemical & Structural Fire",
    severity: "CRITICAL",
    status: "ACTIVE",
    commStatus: "DISCONNECTED",
    lat: 18.5422,
    lng: 73.8689,
    activeIncidentsCount: 2,
    criticalCiviliansCount: 4,
    deployedResourcesCount: 0,
  },
];

// 2. Initial Fleet & Resource Inventory
const INITIAL_RESOURCES: ResqResource[] = [
  {
    id: "FIRE-01",
    name: "Fire Team 01 (Structural Extrication)",
    type: "fire_team",
    status: "AVAILABLE",
    location_lat: 18.522,
    location_lng: 73.858,
    capacity_or_stock: 1,
    assigned_zone_id: "ZONE-A",
  },
  {
    id: "FIRE-02",
    name: "Fire Team 02 (Chemical Foam Engine)",
    type: "fire_team",
    status: "AVAILABLE",
    location_lat: 18.538,
    location_lng: 73.862,
    capacity_or_stock: 1,
    assigned_zone_id: "ZONE-D",
  },
  {
    id: "AMB-01",
    name: "Ambulance 01 (Advanced Life Support)",
    type: "ambulance",
    status: "AVAILABLE",
    location_lat: 18.525,
    location_lng: 73.852,
    capacity_or_stock: 1,
    assigned_zone_id: "ZONE-A",
  },
  {
    id: "AMB-02",
    name: "Ambulance 02 (Basic Life Support)",
    type: "ambulance",
    status: "BUSY",
    location_lat: 18.532,
    location_lng: 73.846,
    capacity_or_stock: 1,
    assigned_zone_id: "ZONE-B",
  },
  {
    id: "RESCUE-02",
    name: "Rescue Vehicle 02 (High-Clearance 4x4)",
    type: "rescue_vehicle",
    status: "AVAILABLE",
    location_lat: 18.515,
    location_lng: 73.84,
    capacity_or_stock: 1,
    assigned_zone_id: "ZONE-C",
  },
  {
    id: "MED-KIT-01",
    name: "Major Trauma Medical Kits",
    type: "medical_kit",
    status: "AVAILABLE",
    location_lat: 18.53,
    location_lng: 73.845,
    capacity_or_stock: 8,
    assigned_zone_id: "ZONE-B",
  },
  {
    id: "O2-UNITS-01",
    name: "Medical Grade Oxygen Cylinders (10L)",
    type: "oxygen_unit",
    status: "AVAILABLE",
    location_lat: 18.53,
    location_lng: 73.845,
    capacity_or_stock: 5,
    assigned_zone_id: "ZONE-B",
  },
];

// 3. Cluster #B17 (Aggregated from 4 citizen reports)
const INITIAL_CLUSTERS: IncidentCluster[] = [
  {
    id: "CLUSTER-B17",
    title: "Incident Cluster #B17 — Residential Fire & Smoke Trap",
    location: "Building B17, Zone A Urban Sector",
    zone_id: "ZONE-A",
    estimated_civilians: 3,
    injured_count: 2,
    evidence_count: 4,
    status: "CRITICAL",
    reports: [
      { citizen: "Citizen 1", text: "Smoke everywhere in B17.", time: "10:41:20" },
      { citizen: "Citizen 2", text: "People trapped on third floor.", time: "10:41:45" },
      { citizen: "Citizen 3", text: "Fire engines are needed urgently.", time: "10:42:01" },
      { citizen: "Citizen 4", text: "My neighbor is injured, can't breathe.", time: "10:42:10" },
    ],
  },
];

class ResqStore {
  private zones: ResqZone[] = [...INITIAL_ZONES];
  private resources: ResqResource[] = [...INITIAL_RESOURCES];
  private packets: EmergencyPacket[] = [];
  private clusters: IncidentCluster[] = [...INITIAL_CLUSTERS];
  private allocations: ResourceAllocation[] = [];
  private commManager: CommunicationManager = new CommunicationManager();
  private auditLogger: AuditLogger = new AuditLogger();
  private activeScenario: DemoScenario = "scenario_1_normal";

  // Conflict & Duplicate States
  private activeConflict: ConflictResolutionResult | null = null;
  private activeDuplicate: DuplicateDetectionResult | null = null;
  private lastDeliveryRoute: CommRouteResolution | null = null;

  constructor() {
    this.resetToScenario1();
  }

  public getState() {
    return {
      zones: this.zones,
      resources: this.resources,
      packets: this.packets,
      clusters: this.clusters,
      allocations: this.allocations,
      network: this.commManager.getNetworkHealth(),
      transports: this.commManager.getTransportStates(),
      audit_events: this.auditLogger.getEvents(),
      active_scenario: this.activeScenario,
      active_conflict: this.activeConflict,
      active_duplicate: this.activeDuplicate,
      last_delivery_route: this.lastDeliveryRoute,
    };
  }

  public getCommManager(): CommunicationManager {
    return this.commManager;
  }

  public getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  // --- SCENARIO EXECUTION ENGINE ---

  public resetToScenario1(): void {
    this.activeScenario = "scenario_1_normal";
    this.zones = JSON.parse(JSON.stringify(INITIAL_ZONES));
    this.resources = JSON.parse(JSON.stringify(INITIAL_RESOURCES));
    this.clusters = JSON.parse(JSON.stringify(INITIAL_CLUSTERS));
    this.allocations = [];
    this.activeConflict = null;
    this.activeDuplicate = null;
    this.commManager.resetNetworkState();
    this.auditLogger.reset();

    // Ingest default Building B17 packet
    const b17Packet = createEmergencyPacket(
      "SOS-001",
      "I am trapped on the third floor of Building B17. There is heavy smoke and two people are injured. We cannot safely exit.",
      "CELLULAR",
      ["CITIZEN", "CELLULAR", "INTERNET", "RESCUE COMMAND"]
    );
    this.packets = [b17Packet];

    this.lastDeliveryRoute = {
      transport: "CELLULAR",
      status: "DELIVERED",
      status_text: "Message delivered successfully via Cellular / Internet.",
      path_diagram: ["CITIZEN", "CELLULAR", "INTERNET", "RESCUE COMMAND"],
      delivered: true,
      packet_id: "SOS-001",
    };

    this.auditLogger.logEvent(
      "SOS_CREATED",
      "SOS-001 created by citizen: Trapped on 3rd floor Building B17 with heavy smoke.",
      "CITIZEN",
      "SOS-001"
    );
    this.auditLogger.logEvent(
      "AI_TRIAGE_COMPLETE",
      "AI Incident Processor classified SOS-001 as P0 CRITICAL (84 B packet).",
      "CLOUD_AI",
      "SOS-001"
    );
  }

  public runScenario(scenario: DemoScenario) {
    this.activeScenario = scenario;

    switch (scenario) {
      case "scenario_1_normal":
        this.resetToScenario1();
        break;

      case "scenario_2_cellular_down":
        this.commManager.setCellular(false);
        this.commManager.setP2P(true);

        this.lastDeliveryRoute = {
          transport: "P2P_MESH",
          status: "DELIVERED",
          status_text: "Cellular OFFLINE. Forwarded via nearby P2P / Mesh peer hop.",
          path_diagram: ["CITIZEN", "P2P / MESH", "RESCUE NODE", "COMMAND CENTER"],
          delivered: true,
          packet_id: "SOS-001",
        };

        this.auditLogger.logEvent(
          "CELLULAR_LOST",
          "Cellular infrastructure down in Zone A. CommunicationManager initiated mesh discovery.",
          "COMM_MANAGER"
        );
        break;

      case "scenario_3_total_blackout":
        this.commManager.setCellular(false);
        this.commManager.setInternet(false);
        this.commManager.setP2P(false);
        this.commManager.setLoRaGateway(false);

        // Buffer SOS-001
        if (this.packets[0]) {
          this.commManager.transmitPacket(this.packets[0]);
        }

        this.lastDeliveryRoute = {
          transport: "STORE_FORWARD",
          status: "STORED_LOCALLY",
          status_text: "NO DIRECT CONNECTION. Message stored locally — waiting for relay.",
          path_diagram: [
            "Citizen Device",
            "Local Storage Queue (Packet: SOS-001)",
            "Waiting for Relay / LoRa Node",
          ],
          delivered: false,
          packet_id: "SOS-001",
        };

        this.auditLogger.logEvent(
          "PACKET_STORED_LOCALLY",
          "Complete network failure. Packet SOS-001 stored in local non-volatile storage.",
          "COMM_MANAGER",
          "SOS-001"
        );
        break;

      case "scenario_4_lora_recovery":
        this.commManager.setLoRaGateway(true);

        const flushed = this.commManager.flushBufferedPackets();
        const deliveredPacket = this.packets[0] || createEmergencyPacket(
          "SOS-001",
          "Trapped on 3rd floor Building B17. Smoke and 2 injured.",
          "LORA"
        );
        deliveredPacket.delivered_transport = "LORA";
        deliveredPacket.hops = [
          "Citizen Device",
          "Local Emergency Packet",
          "External LoRa Gateway",
          "Rescue Command Center",
        ];

        this.lastDeliveryRoute = {
          transport: "LORA",
          status: "FORWARDED_LORA",
          status_text: "SOS-001 TRANSMITTED VIA: LoRa (868 MHz) -> DELIVERED to Command Center.",
          path_diagram: [
            "Citizen Device",
            "Local Emergency Packet",
            "External LoRa Gateway (868 MHz)",
            "Rescue Command Center",
          ],
          delivered: true,
          packet_id: "SOS-001",
        };

        this.auditLogger.logEvent(
          "LORA_GATEWAY_DETECTED",
          "External LoRa Gateway #04 came online in 5 km radius.",
          "COMM_MANAGER"
        );
        this.auditLogger.logEvent(
          "SOS_FORWARDED_LORA",
          "SOS-001 forwarded via External LoRa Gateway to Rescue Command.",
          "COMM_MANAGER",
          "SOS-001"
        );

        // Trigger Step 8 Resource Allocation
        const allocRes = allocateResourcesForIncident(deliveredPacket, this.resources);
        this.allocations = allocRes.allocations;

        // Update resources status
        allocRes.allocated_resources.forEach((ar) => {
          const idx = this.resources.findIndex((r) => r.id === ar.id);
          if (idx >= 0) this.resources[idx].status = "DISPATCHED";
        });

        this.auditLogger.logEvent(
          "RESOURCE_ASSIGNED",
          `Deterministic allocation: Fire Team 01 + Ambulance 01 + Med Kit + 2 Oxygen Units assigned to B17.`,
          "ALLOC_AGENT",
          "SOS-001"
        );
        break;

      case "scenario_5_resource_shortage":
        // Add second incident: Zone C Flood
        const zoneCPacket = createEmergencyPacket(
          "SOS-002",
          "Flood water has risen rapidly in Zone C. 8 civilians require evacuation, including 2 children.",
          "CELLULAR"
        );
        if (!this.packets.some((p) => p.packet_id === "SOS-002")) {
          this.packets.push(zoneCPacket);
        }

        const conflict = evaluateDynamicReallocationConflict(
          this.packets[0],
          zoneCPacket,
          this.resources
        );
        this.activeConflict = conflict;

        this.auditLogger.logEvent(
          "NEW_INCIDENT_ESCALATION",
          "Zone C reported critical flood escalation: 8 civilians including 2 children.",
          "CITIZEN",
          "SOS-002"
        );
        this.auditLogger.logEvent(
          "RESOURCE_CONFLICT_DETECTED",
          "High-Clearance Rescue Vehicle scarcity: 2 critical incidents competing.",
          "COORD_AGENT"
        );
        break;

      case "scenario_6_dynamic_reallocation":
        if (this.activeConflict) {
          // Preempt and reallocate
          this.allocations.push(...this.activeConflict.action_plan);
          const r2 = this.resources.find((r) => r.id === "RESCUE-02");
          if (r2) {
            r2.status = "DISPATCHED";
            r2.assigned_incident_id = "SOS-002";
            r2.assigned_zone_id = "ZONE-C";
          }
        }

        this.auditLogger.logEvent(
          "RESOURCE_PLAN_REALLOCATED",
          "Rescue Vehicle 02 dynamically assigned to Zone C based on child vulnerability index.",
          "COORD_AGENT",
          "SOS-002"
        );
        break;

      case "scenario_7_duplicate_deployment":
        // Ensure Fire 01 is present on B17
        if (!this.allocations.some((a) => a.resource_id === "FIRE-01")) {
          this.allocations.push({
            id: `alloc-fire-01-${Date.now()}`,
            incident_id: "SOS-001",
            resource_id: "FIRE-01",
            resource_name: "Fire Team 01 (Structural Extrication)",
            resource_type: "fire_team",
            assigned_at: new Date().toISOString(),
            justification: "Primary unit assigned to Building B17.",
            score: 0.94,
          });
        }

        // Intentionally dispatch Fire 02 to Building B17 as well
        const f2 = this.resources.find((r) => r.id === "FIRE-02");
        if (f2) f2.status = "DISPATCHED";

        const dupAlloc: ResourceAllocation = {
          id: `alloc-fire-dup-${Date.now()}`,
          incident_id: "SOS-001",
          resource_id: "FIRE-02",
          resource_name: "Fire Team 02 (Chemical Foam Engine)",
          resource_type: "fire_team",
          assigned_at: new Date().toISOString(),
          justification: "Secondary fire team dispatched in error to Building B17.",
          score: 0.75,
        };

        if (!this.allocations.some((a) => a.resource_id === "FIRE-02")) {
          this.allocations.push(dupAlloc);
        }

        const dupResult = detectDuplicateDeployment(this.allocations);
        this.activeDuplicate = dupResult;

        this.auditLogger.logEvent(
          "DUPLICATE_DEPLOYMENT_DETECTED",
          "Fire Team 01 & Fire Team 02 both deployed to Building B17. Redundancy flagged.",
          "DUP_AGENT",
          "SOS-001"
        );
        break;

      case "reset":
        this.resetToScenario1();
        this.auditLogger.logEvent("DEMO_RESET", "Demo environment reset to initial state.", "COORD_AGENT");
        break;
    }

    return this.getState();
  }

  public resolveDuplicate() {
    if (this.activeDuplicate && this.activeDuplicate.has_duplicate) {
      // Redirect Fire Team 02 to Zone D
      this.allocations = this.allocations.filter((a) => a.resource_id !== "FIRE-02");
      this.allocations.push({
        id: `alloc-fire-redirect-${Date.now()}`,
        incident_id: "INC-ZONE-D-FIRE",
        resource_id: "FIRE-02",
        resource_name: "Fire Team 02 (Chemical Foam Engine)",
        resource_type: "fire_team",
        assigned_at: new Date().toISOString(),
        justification: "Redirected from B17 to Zone D Industrial Plant (unserved chemical fire).",
        score: 0.99,
      });

      const f2 = this.resources.find((r) => r.id === "FIRE-02");
      if (f2) {
        f2.assigned_zone_id = "ZONE-D";
        f2.assigned_incident_id = "INC-ZONE-D-FIRE";
      }

      this.activeDuplicate = {
        has_duplicate: false,
        duplicate_units: [],
        recommendation: "Resolved: Fire Team 02 successfully redirected to Zone D.",
        explanation: "Redundancy eliminated. All critical fire sectors now covered.",
      };

      this.auditLogger.logEvent(
        "SURPLUS_RESOURCE_REDIRECTED",
        "Fire Team 02 redirected from B17 to Zone D Industrial Fire.",
        "DUP_AGENT",
        "INC-ZONE-D-FIRE"
      );
    }
    return this.getState();
  }

  public submitCitizenSos(rawText: string): {
    packet: EmergencyPacket;
    route: CommRouteResolution;
  } {
    const packetId = `SOS-00${this.packets.length + 1}`;
    const packet = createEmergencyPacket(packetId, rawText, "CELLULAR");
    const route = this.commManager.transmitPacket(packet);

    packet.delivered_transport = route.transport;
    packet.hops = route.path_diagram;

    this.packets.unshift(packet);
    this.lastDeliveryRoute = route;

    this.auditLogger.logEvent(
      "SOS_CREATED",
      `New SOS received (${packet.incident_type}): ${packet.location.name} - ${packet.people} people.`,
      "CITIZEN",
      packetId
    );

    return { packet, route };
  }
}

// Global Singleton Instance
export const resqStore = new ResqStore();
