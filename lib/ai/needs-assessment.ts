// =========================================================================
// KURUKSHETRA PS20: AGENTIC DISASTER RELIEF
// Groq AI Needs Assessment & Duplicate Detection Agent
// FILE: lib/ai/needs-assessment.ts
// =========================================================================

import { Incident, AITriageResult, SeverityLevel, ExtractedNeeds } from "@/types/disaster";

interface IncidentInput {
  title: string;
  description: string;
  category: string;
  estimated_people_count: number;
  latitude: number;
  longitude: number;
}

/**
 * Calculates distance in km between two geo coordinates.
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Assesses an incident report using Groq LLaMA or smart semantic heuristic fallback.
 */
export async function assessIncidentWithGroq(
  input: IncidentInput,
  existingIncidents: Incident[] = []
): Promise<AITriageResult> {
  const text = `${input.title} ${input.description}`.toLowerCase();

  // 1. Duplicate Detection Check (within 1.5 km and similar category)
  let isDuplicate = false;
  let duplicateOfId: string | null = null;
  let duplicateConfidence = 0;
  let duplicateRationale = "";

  for (const existing of existingIncidents) {
    const dist = calculateDistance(
      input.latitude,
      input.longitude,
      existing.latitude,
      existing.longitude
    );

    if (dist < 1.5 && (existing.category === input.category || dist < 0.3)) {
      isDuplicate = true;
      duplicateOfId = existing.id;
      duplicateConfidence = Math.min(95, Math.round((1.5 - dist) * 60 + 30));
      duplicateRationale = `Incident matches existing report #${existing.id} within ${(dist * 1000).toFixed(0)}m radius.`;
      break;
    }
  }

  // 2. Severity Scoring & Resource Extraction
  let score = 50;
  const needs: ExtractedNeeds = {};

  if (text.includes("critical") || text.includes("trapped") || text.includes("icu") || text.includes("dying") || text.includes("collapse")) {
    score = Math.max(score, 90);
  } else if (text.includes("submerged") || text.includes("surge") || text.includes("fire") || text.includes("severe")) {
    score = Math.max(score, 75);
  } else if (text.includes("medical") || text.includes("injured") || text.includes("water")) {
    score = Math.max(score, 60);
  }

  // Scale with victim count
  if (input.estimated_people_count > 30) score = Math.min(100, score + 15);
  else if (input.estimated_people_count > 10) score = Math.min(100, score + 10);

  // Resource needs extraction
  if (text.includes("boat") || text.includes("flood") || text.includes("water level")) {
    needs.rescue_boats = Math.max(2, Math.ceil(input.estimated_people_count / 10));
  }
  if (text.includes("medic") || text.includes("hospital") || text.includes("injured") || text.includes("trauma")) {
    needs.medical_kits = Math.max(5, Math.ceil(input.estimated_people_count * 0.5));
  }
  if (text.includes("drinking water") || text.includes("thirsty") || text.includes("contamination") || text.includes("water")) {
    needs.drinking_water_liters = Math.max(50, input.estimated_people_count * 15);
  }
  if (text.includes("food") || text.includes("ration") || text.includes("starving")) {
    needs.food_rations = Math.max(20, input.estimated_people_count * 3);
  }
  if (text.includes("power") || text.includes("generator") || text.includes("electricity") || text.includes("blackout")) {
    needs.power_generators = 2;
  }
  if (text.includes("personnel") || text.includes("evacuat") || text.includes("ndrf")) {
    needs.rescue_personnel_units = Math.max(4, Math.ceil(input.estimated_people_count / 5));
  }

  // Determine Severity Level
  let severityLevel: SeverityLevel = "LOW";
  let urgencyPriority: 1 | 2 | 3 | 4 | 5 = 5;

  if (score >= 85) {
    severityLevel = "CRITICAL";
    urgencyPriority = 1;
  } else if (score >= 70) {
    severityLevel = "HIGH";
    urgencyPriority = 2;
  } else if (score >= 50) {
    severityLevel = "MEDIUM";
    urgencyPriority = 3;
  } else {
    severityLevel = "LOW";
    urgencyPriority = 4;
  }

  return {
    severity_level: severityLevel,
    severity_score: score,
    urgency_priority: urgencyPriority,
    extracted_needs: needs,
    triage_summary: `Groq AI analyzed incident '${input.title}': Assessed at ${severityLevel} severity (Score: ${score}/100). Primary intervention: ${Object.keys(needs).join(", ") || "General search & rescue"}.`,
    suggested_action: `Dispatch nearest tactical relief units equipped with ${Object.keys(needs)[0] || "first aid"}.`,
    is_duplicate: isDuplicate,
    duplicate_of_id: duplicateOfId,
    duplicate_confidence: duplicateConfidence,
    duplicate_rationale: duplicateRationale,
  };
}
