// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 4: AI Agent 2 (Strategist Agent)
// FILE: types/resource.ts
// ROLE: Senior Backend Architect
// DESCRIPTION: Shared TypeScript interfaces for Resources and Strategist AI Agent
//              to be consumed by Aditya (Frontend) and Backend API routes.
// =========================================================================

export type ResourceType = "water" | "food" | "medical" | "tent";

/**
 * Relief Resource representation corresponding to `public.resources`.
 */
export interface Resource {
  id: string; // UUID
  type: ResourceType;
  quantity: number;
  location_hub: string; // e.g., 'Marina Central Depot'
  assigned_to_incident_id: string | null; // UUID referencing public.incidents(id)
  created_at: string;
}

/**
 * Payload returned by the Strategist Edge Function (/allocate-resources).
 */
export interface AllocateResourcesResponse {
  success: boolean;
  incident_id?: string;
  severity_score?: number;
  allocated_count?: number;
  allocated_resources?: Resource[];
  action?: "DYNAMIC_REALLOCATION" | "RESOURCES_RETURNED_TO_POOL";
  freed_from?: string;
  reassigned_to?: string;
  target_severity?: number;
  reassigned_resources_count?: number;
  message?: string;
}
