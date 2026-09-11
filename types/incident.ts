// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 3: AI Agent 1 (Sentinel Agent)
// FILE: types/incident.ts
// ROLE: Senior Backend Architect
// DESCRIPTION: Shared TypeScript interfaces for Incidents and AI Sentinel Agent
//              to be consumed by Aditya (Frontend) and Backend API routes.
// =========================================================================

export type IncidentStatus = "open" | "resolved";

export type NeededResource = "water" | "food" | "medical" | "tent" | "boats" | "personnel";

/**
 * Detailed telemetry and rationale produced by the Sentinel AI Agent.
 */
export interface AIAnalysisMetadata {
  analyzed_at: string;
  model: string;
  severity_score: number;
  needed_resources: NeededResource[] | string[];
  is_duplicate: boolean;
  duplicate_of_id: string | null;
  rationale?: string;
}

/**
 * Emergency Incident schema matching `public.incidents`.
 */
export interface Incident {
  id: string; // UUID
  location_lat: number;
  location_lng: number;
  type: string; // 'flood' | 'fire' | 'medical' | 'structural_collapse' | etc.
  description: string;
  severity_score: number; // 0 to 10
  status: IncidentStatus; // 'open' | 'resolved'
  is_duplicate: boolean;
  duplicate_of_id: string | null;
  needed_resources: string[];
  language?: "en" | "hi";
  ai_analysis_json: AIAnalysisMetadata | Record<string, any>;
  reported_by: string | null; // UUID referencing profiles.id
  created_at: string;
}

/**
 * Response payload returned by the Sentinel Edge Function (/analyze-incident).
 */
export interface AnalyzeIncidentResponse {
  success: boolean;
  message: string;
  incident_id: string;
  severity_score: number;
  needed_resources: string[];
  is_duplicate: boolean;
  duplicate_of_id: string | null;
}
