/**
 * ==============================================================================
 * KURUKSHETRA PS20 - BACKEND API CONTRACT & DATA MODELS
 * types/backend.ts
 * ==============================================================================
 * 
 * Formal TypeScript definitions matching the official Backend Architecture Contract:
 * - Supabase PostgreSQL 15+ with RLS
 * - Tables: profiles, incidents, resources, audit_logs
 */

// 1. User Profile (public.profiles)
export type UserRole = "citizen" | "rescue" | "authority";

export interface LocationJson {
  lat: number;
  lng: number;
  address?: string;
}

export interface UserProfile {
  id: string; // UUID matching auth.users.id
  email: string;
  role: UserRole;
  phone: string | null;
  location_json: LocationJson;
  created_at: string;
}

// 2. Emergency Incident (public.incidents)
export type IncidentStatus = "open" | "resolved";

export interface AIAnalysisPayload {
  analyzed_at?: string;
  model?: string;
  severity_score?: number;
  needed_resources?: string[];
  is_duplicate?: boolean;
  duplicate_of_id?: string | null;
  rationale?: string;
}

export interface Incident {
  id: string; // UUID
  location_lat: number;
  location_lng: number;
  type: string; // 'flood' | 'fire' | 'medical' | 'collapse' | etc.
  description: string;
  severity_score: number; // 0 (unassessed) to 10 (critical)
  status: IncidentStatus; // 'open' | 'resolved'
  is_duplicate: boolean;
  duplicate_of_id: string | null; // UUID referencing master incident
  needed_resources: string[]; // e.g. ['boats', 'medical', 'water']
  ai_analysis_json: AIAnalysisPayload;
  reported_by: string | null; // UUID referencing profiles.id
  created_at: string;
  zone?: string;
}

// 3. Relief Resource (public.resources)
export type ResourceType = "water" | "food" | "medical" | "tent";

export interface Resource {
  id: string; // UUID
  type: ResourceType;
  quantity: number;
  location_hub: string; // e.g. 'Marina Central Depot'
  assigned_to_incident_id: string | null; // UUID referencing incidents.id
  created_at: string;
}

// 4. Immutable Audit Log (public.audit_logs)
export type AgentName = "Sentinel Agent" | "Strategist Agent" | "Authority";

export interface AuditLogRecord {
  id: string; // UUID
  agent_name: AgentName | string;
  action: string;
  details_json: Record<string, any>;
  timestamp: string;
}

/**
 * Normalization helper to map between contract and UI convenience
 */
export function getSeverityTier(score: number): "CRITICAL" | "HIGH" | "MODERATE" | "LOW" {
  if (score >= 8) return "CRITICAL";
  if (score >= 6) return "HIGH";
  if (score >= 4) return "MODERATE";
  return "LOW";
}

export function getCoordinates(item: {
  location_lat?: number;
  location_lng?: number;
  latitude?: number;
  longitude?: number;
}): [number, number] {
  const lat = item.location_lat ?? item.latitude ?? 13.0827;
  const lng = item.location_lng ?? item.longitude ?? 80.2707;
  return [Number(lat), Number(lng)];
}
