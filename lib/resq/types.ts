/**
 * ==============================================================================
 * RESQNET: Resilient Emergency Communication & Resource Coordination Network
 * Core TypeScript Definitions & Domain Models (PS20 Hackathon MVP)
 * ==============================================================================
 */

export type ZoneId = "ZONE-A" | "ZONE-B" | "ZONE-C" | "ZONE-D";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export interface ResqZone {
  id: ZoneId;
  name: string;
  type: string; // "Urban residential", "Hospital area", "Flooded low-lying", "Industrial / fire"
  severity: SeverityLevel;
  status: "ACTIVE" | "CONTAINED" | "MONITORING";
  commStatus: "CONNECTED" | "DEGRADED" | "DISCONNECTED";
  lat: number;
  lng: number;
  activeIncidentsCount: number;
  criticalCiviliansCount: number;
  deployedResourcesCount: number;
}

export type IncidentType =
  | "FIRE"
  | "BUILDING_EMERGENCY"
  | "FLOOD_EVACUATION"
  | "MEDICAL_TRAUMA"
  | "STRUCTURAL_COLLAPSE";

export interface EmergencyPacket {
  packet_id: string; // e.g. "SOS-001"
  incident_type: IncidentType;
  priority: "P0_CRITICAL" | "P1_HIGH" | "P2_MODERATE";
  people: number;
  injured: number;
  vulnerable: string[]; // e.g. ["2 children", "1 elderly"]
  location: {
    zone_id: ZoneId;
    name: string; // "Building B17"
    floor?: string; // "3"
    lat: number;
    lng: number;
  };
  hazards: string[]; // ["Heavy smoke", "Rising flood water 1.8m"]
  resources_required: string[]; // ["Fire rescue team", "Ambulance", "Medical assistance"]
  message: string;
  timestamp: string;
  size_bytes: number; // e.g. 84
  delivered_transport: CommTransportType | "STORED_LOCALLY";
  hops: string[];
}

export interface IncidentCluster {
  id: string; // e.g. "CLUSTER-B17"
  title: string;
  location: string;
  zone_id: ZoneId;
  estimated_civilians: number;
  injured_count: number;
  evidence_count: number; // e.g. 4 citizen reports
  status: SeverityLevel;
  reports: {
    citizen: string;
    text: string;
    time: string;
  }[];
}

export type ResourceType =
  | "fire_team"
  | "ambulance"
  | "rescue_vehicle"
  | "boat_unit"
  | "medical_kit"
  | "oxygen_unit"
  | "food_water";

export interface ResqResource {
  id: string; // e.g. "FIRE-01", "AMB-01"
  name: string;
  type: ResourceType;
  status: "AVAILABLE" | "DISPATCHED" | "EN_ROUTE" | "BUSY" | "DEPLETED";
  location_lat: number;
  location_lng: number;
  assigned_incident_id?: string;
  assigned_zone_id?: ZoneId;
  capacity_or_stock: number;
}

export interface ResourceAllocation {
  id: string;
  incident_id: string;
  resource_id: string;
  resource_name: string;
  resource_type: ResourceType;
  assigned_at: string;
  justification: string;
  score: number;
  is_preempted?: boolean;
  preempted_for_incident_id?: string;
  preemption_reason?: string;
}

export type CommTransportType =
  | "CELLULAR"
  | "P2P_MESH"
  | "LORA"
  | "STORE_FORWARD"
  | "SATELLITE";

export interface TransportState {
  type: CommTransportType;
  label: string;
  is_available: boolean;
  is_external_hardware: boolean;
  hardware_disclosure: string;
  bandwidth: string;
  typical_range: string;
  active_route_count: number;
  status_text: "ONLINE" | "OFFLINE" | "ACTIVE_BUFFER" | "AVAILABLE_SIMULATED";
}

export interface NetworkHealth {
  cellular: boolean;
  internet: boolean;
  p2p_mesh: boolean;
  lora_gateway: boolean;
  store_forward_active: boolean;
  satellite_simulated: boolean;
  active_transport: CommTransportType | "NONE";
  pending_packets_count: number;
  buffered_packets: EmergencyPacket[];
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  time_display: string; // e.g. "10:42:13"
  event_type:
    | "SOS_CREATED"
    | "AI_TRIAGE_COMPLETE"
    | "CELLULAR_LOST"
    | "PACKET_STORED_LOCALLY"
    | "LORA_GATEWAY_DETECTED"
    | "SOS_FORWARDED_LORA"
    | "RESOURCE_ASSIGNED"
    | "NEW_INCIDENT_ESCALATION"
    | "RESOURCE_CONFLICT_DETECTED"
    | "RESOURCE_PLAN_REALLOCATED"
    | "DUPLICATE_DEPLOYMENT_DETECTED"
    | "SURPLUS_RESOURCE_REDIRECTED"
    | "SATELLITE_LINK_SIMULATED"
    | "DEMO_RESET";
  packet_id?: string;
  incident_id?: string;
  details: string;
  actor: "CITIZEN" | "LOCAL_AI" | "CLOUD_AI" | "COMM_MANAGER" | "ALLOC_AGENT" | "COORD_AGENT" | "DUP_AGENT";
}

export type DemoScenario =
  | "scenario_1_normal"
  | "scenario_2_cellular_down"
  | "scenario_3_total_blackout"
  | "scenario_4_lora_recovery"
  | "scenario_5_resource_shortage"
  | "scenario_6_dynamic_reallocation"
  | "scenario_7_duplicate_deployment"
  | "reset";
