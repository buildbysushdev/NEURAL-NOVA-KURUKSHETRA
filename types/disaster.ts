// =========================================================================
// KURUKSHETRA PS20: AGENTIC DISASTER RELIEF
// Domain Model & Type Definitions
// =========================================================================

export type UserRole = 'citizen' | 'rescue' | 'authority';

export type IncidentCategory = 
  | 'flood'
  | 'earthquake'
  | 'fire'
  | 'cyclone'
  | 'landslide'
  | 'building_collapse'
  | 'medical_emergency'
  | 'trapped_victims';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus = 
  | 'reported'
  | 'triaged'
  | 'dispatched'
  | 'in_progress'
  | 'resolved'
  | 'duplicate';

export type ResourceCategory =
  | 'medical_kits'
  | 'drinking_water_liters'
  | 'food_rations'
  | 'rescue_boats'
  | 'ambulances'
  | 'fire_engines'
  | 'rescue_personnel_units'
  | 'power_generators';

export type AllocationStatus = 
  | 'suggested'
  | 'approved'
  | 'dispatched'
  | 'delivered'
  | 'reallocated'
  | 'cancelled';

export type MissionStatus = 
  | 'assigned'
  | 'acknowledged'
  | 'en_route'
  | 'on_scene'
  | 'completed'
  | 'needs_reinforcement';

export interface UserProfile {
  id: string;
  user_id?: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  organization?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
}

export interface Depot {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_phone: string;
  depot_lead_name: string;
  operational_status: 'operational' | 'strained' | 'inaccessible';
  created_at?: string;
}

export interface ResourceItem {
  id: string;
  depot_id: string;
  category: ResourceCategory;
  item_name: string;
  total_quantity: number;
  allocated_quantity: number;
  available_quantity: number;
  unit: string;
  status: 'ready' | 'low' | 'depleted';
  updated_at: string;
  depot?: Depot;
}

export interface ExtractedNeeds {
  rescue_boats?: number;
  medical_kits?: number;
  drinking_water_liters?: number;
  food_rations?: number;
  rescue_personnel_units?: number;
  ambulances?: number;
  power_generators?: number;
  [key: string]: number | undefined;
}

export interface Incident {
  id: string;
  citizen_id?: string;
  title: string;
  description: string;
  category: IncidentCategory;
  estimated_people_count: number;
  latitude: number;
  longitude: number;
  address?: string;
  image_url?: string;
  severity_level: SeverityLevel;
  severity_score: number; // 0 to 100
  extracted_needs: ExtractedNeeds;
  ai_triage_notes?: string;
  is_duplicate: boolean;
  duplicate_of_id?: string | null;
  duplicate_confidence?: number;
  duplicate_reason?: string;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
}

export interface Allocation {
  id: string;
  incident_id: string;
  resource_id: string;
  depot_id: string;
  quantity: number;
  status: AllocationStatus;
  allocated_by: 'ai_allocation_agent' | 'commander_manual';
  decision_reasoning: string;
  dispatched_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  incident?: Incident;
  resource?: ResourceItem;
  depot?: Depot;
}

export interface RescueMission {
  id: string;
  incident_id: string;
  team_lead_id?: string;
  team_name: string;
  status: MissionStatus;
  route_eta_mins: number;
  team_latitude?: number;
  team_longitude?: number;
  field_notes?: string;
  casualties_treated: number;
  people_evacuated: number;
  created_at: string;
  updated_at: string;
  incident?: Incident;
}

export interface AuditLog {
  id: string;
  action: 
    | 'INCIDENT_REPORTED'
    | 'AI_TRIAGE_COMPLETED'
    | 'DUPLICATE_FLAGGED'
    | 'AI_ALLOCATION_GENERATED'
    | 'ALLOCATION_APPROVED'
    | 'DYNAMIC_REALLOCATION_TRIGGERED'
    | 'MISSION_ASSIGNED'
    | 'MISSION_ACKNOWLEDGED'
    | 'MISSION_EN_ROUTE'
    | 'MISSION_ON_SCENE'
    | 'MISSION_RESOLVED'
    | 'COMMANDER_OVERRIDE';
  actor_role: 'citizen' | 'rescue' | 'authority' | 'ai_agent';
  actor_id?: string;
  incident_id?: string;
  details: Record<string, any>;
  timestamp: string;
}

// -------------------------------------------------------------
// AI Agent Types
// -------------------------------------------------------------

export interface AITriageResult {
  severity_level: SeverityLevel;
  severity_score: number; // 0-100
  urgency_priority: 1 | 2 | 3 | 4 | 5;
  extracted_needs: ExtractedNeeds;
  triage_summary: string;
  suggested_action: string;
  is_duplicate: boolean;
  duplicate_of_id?: string | null;
  duplicate_confidence: number;
  duplicate_rationale?: string;
}

export interface AllocationSuggestion {
  resource_id: string;
  depot_id: string;
  depot_name: string;
  resource_name: string;
  category: ResourceCategory;
  requested_quantity: number;
  allocated_quantity: number;
  distance_km: number;
  eta_minutes: number;
  reasoning: string;
}

export interface AllocationPlan {
  incident_id: string;
  incident_title: string;
  severity_level: SeverityLevel;
  total_distance_km: number;
  suggestions: AllocationSuggestion[];
  ai_rationale: string;
  shortages_detected: Partial<Record<ResourceCategory, number>>;
  generated_at: string;
}

export interface DynamicReallocationEvent {
  trigger_incident_id: string;
  trigger_incident_title: string;
  preempted_incident_id: string;
  preempted_incident_title: string;
  resource_name: string;
  diverted_quantity: number;
  donor_depot_name: string;
  justification: string;
  audit_approved: boolean;
}
