// =========================================================================
// Supabase Edge Function (Deno Runtime)
// AI Agent 1: Needs-Assessment
// Trigger: On INSERT into incidents
// Logic: Call Groq API (Llama 3), evaluate severity (1-10), extract
//        needed_resources, run spatial duplicate detection, update row,
//        and log into audit_logs.
// =========================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  schema: string;
  record: {
    id: string;
    location: { latitude: number; longitude: number; address?: string };
    type: string;
    description: string;
    severity?: number;
    needed_resources?: string[];
    is_duplicate?: boolean;
    created_at: string;
  };
  old_record?: any;
}

// Calculate Haversine distance in km
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(async (req: Request) => {
  try {
    // 1. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const groqApiKey = Deno.env.get("GROQ_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Parse incoming webhook request
    const body: WebhookPayload = await req.json();
    const incident = body.record || body;

    if (!incident || !incident.id || !incident.description) {
      return new Response(
        JSON.stringify({ error: "Invalid payload, missing incident record." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const incLat = incident.location?.latitude || 13.0827;
    const incLon = incident.location?.longitude || 80.2707;
    const incType = incident.type || "general";
    const incCreatedAt = new Date(incident.created_at || Date.now());

    // 3. Duplicate Detection Logic (Database check within 1km and same type within 10 mins)
    let isDuplicate = false;
    let duplicateOfId: string | null = null;

    const tenMinutesAgo = new Date(incCreatedAt.getTime() - 10 * 60 * 1000).toISOString();
    const tenMinutesAhead = new Date(incCreatedAt.getTime() + 10 * 60 * 1000).toISOString();

    const { data: nearbyCandidates } = await supabase
      .from("incidents")
      .select("id, location, type, created_at")
      .eq("type", incType)
      .neq("id", incident.id)
      .gte("created_at", tenMinutesAgo)
      .lte("created_at", tenMinutesAhead);

    if (nearbyCandidates && nearbyCandidates.length > 0) {
      for (const cand of nearbyCandidates) {
        const cLat = cand.location?.latitude;
        const cLon = cand.location?.longitude;
        if (cLat !== undefined && cLon !== undefined) {
          const dist = calculateDistanceKm(incLat, incLon, cLat, cLon);
          if (dist <= 1.0) {
            isDuplicate = true;
            duplicateOfId = cand.id;
            break;
          }
        }
      }
    }

    // 4. Call Groq API (Llama 3) with Incident Description
    let severityScore = 5;
    let neededResources: string[] = ["water", "food"];

    if (groqApiKey) {
      try {
        const groqResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              temperature: 0.1,
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "system",
                  content: `You are the AI Needs-Assessment Officer in an emergency disaster response center.
Analyze the incident description and disaster type.
Output strictly valid JSON with this format:
{
  "severity_score": <integer from 1 to 10>,
  "needed_resources": <array of strings from ["water", "food", "medical", "boats", "personnel", "generators"]>,
  "is_duplicate": <boolean>
}

Guidelines for severity (1-10):
- 1-3: Low urgency (minor waterlogging, precautionary checks)
- 4-6: Moderate urgency (food/water cut off, property damage)
- 7-8: High urgency (rooftop stranding, urgent medical need, injured people)
- 9-10: Critical emergency (trapped elderly/children, hospital flooded, imminent loss of life, active collapse)`,
                },
                {
                  role: "user",
                  content: `Incident Type: ${incType}\nDescription: ${incident.description}\nDuplicate detected by spatial rule: ${isDuplicate}`,
                },
              ],
            }),
          }
        );

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          const parsed = JSON.parse(groqData.choices[0]?.message?.content || "{}");

          if (parsed.severity_score !== undefined) {
            severityScore = Math.max(1, Math.min(10, Math.round(parsed.severity_score)));
          }
          if (Array.isArray(parsed.needed_resources) && parsed.needed_resources.length > 0) {
            neededResources = parsed.needed_resources;
          }
          if (parsed.is_duplicate !== undefined) {
            isDuplicate = isDuplicate || Boolean(parsed.is_duplicate);
          }
        }
      } catch (groqErr) {
        console.error("Groq API error in edge function:", groqErr);
      }
    } else {
      // Fallback deterministic severity calculation
      const descLower = incident.description.toLowerCase();
      if (descLower.includes("trapped") || descLower.includes("elderly") || descLower.includes("hospital") || descLower.includes("collapsed")) {
        severityScore = 9;
        neededResources = ["boats", "medical", "personnel", "water"];
      } else if (descLower.includes("flood") || descLower.includes("stranded") || descLower.includes("food")) {
        severityScore = 7;
        neededResources = ["boats", "water", "food"];
      }
    }

    // 5. Update the incidents row with severity and needed_resources
    const { error: updateError } = await supabase
      .from("incidents")
      .update({
        severity: severityScore,
        needed_resources: neededResources,
        is_duplicate: isDuplicate,
        duplicate_of_id: duplicateOfId,
        ai_triage_notes: `Groq Llama 3 Triage: Severity ${severityScore}/10. Needed: ${neededResources.join(", ")}.`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", incident.id);

    if (updateError) {
      console.error("Error updating incident row:", updateError);
    }

    // 6. Create an audit_logs entry
    await supabase.from("audit_logs").insert([
      {
        action: "NEEDS_ASSESSMENT_COMPLETED",
        agent_name: "groq-needs-assessment",
        details: {
          incident_id: incident.id,
          severity_score: severityScore,
          needed_resources: neededResources,
          is_duplicate: isDuplicate,
          duplicate_of_id: duplicateOfId,
          model: "llama-3.3-70b-versatile",
        },
        timestamp: new Date().toISOString(),
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        incident_id: incident.id,
        severity_score: severityScore,
        needed_resources: neededResources,
        is_duplicate: isDuplicate,
        duplicate_of_id: duplicateOfId,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
