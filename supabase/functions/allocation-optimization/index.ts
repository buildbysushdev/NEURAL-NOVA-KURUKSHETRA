// =========================================================================
// Supabase Edge Function (Deno Runtime)
// AI Agent 2: Allocation & Optimization
// Trigger: When severity_score or status is updated
// Logic: Call Gemini API to check resources table vs needed_resources.
//        Dynamic Re-allocation: If incident status becomes 'closed',
//        automatically free its resources and assign them to highest
//        severity 'open' incident.
// =========================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  schema: string;
  record: {
    id: string;
    severity?: number;
    status: "open" | "closed";
    needed_resources?: string[];
    description?: string;
    type?: string;
    location?: { latitude: number; longitude: number };
  };
  old_record?: {
    status?: "open" | "closed";
    severity?: number;
  };
}

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: WebhookPayload = await req.json();
    const incident = body.record || body;
    const oldRecord = body.old_record || {};

    if (!incident || !incident.id) {
      return new Response(
        JSON.stringify({ error: "Missing incident record in payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // -------------------------------------------------------------
    // 1. DYNAMIC RE-ALLOCATION ON INCIDENT 'closed'
    // -------------------------------------------------------------
    if (incident.status === "closed" && oldRecord.status !== "closed") {
      // Find all resources currently assigned to this closed incident
      const { data: assignedResources } = await supabase
        .from("resources")
        .select("id, type, quantity")
        .eq("assigned_to_incident_id", incident.id);

      if (assignedResources && assignedResources.length > 0) {
        // Query the highest severity 'open' incident
        const { data: highestOpenIncidents } = await supabase
          .from("incidents")
          .select("id, severity, type, description, needed_resources")
          .eq("status", "open")
          .eq("is_duplicate", false)
          .neq("id", incident.id)
          .order("severity", { ascending: false })
          .limit(1);

        const targetIncident = highestOpenIncidents?.[0];

        if (targetIncident) {
          // Re-assign all resources from closed incident to highest severity open incident
          const resourceIds = assignedResources.map((r) => r.id);
          await supabase
            .from("resources")
            .update({
              assigned_to_incident_id: targetIncident.id,
              updated_at: new Date().toISOString(),
            })
            .in("id", resourceIds);

          // Write audit log for dynamic re-allocation
          await supabase.from("audit_logs").insert([
            {
              action: "DYNAMIC_REALLOCATION_ON_CLOSE",
              agent_name: "gemini-allocation-agent",
              details: {
                closed_incident_id: incident.id,
                reassigned_to_incident_id: targetIncident.id,
                target_severity: targetIncident.severity,
                reallocated_resources: assignedResources,
              },
              timestamp: new Date().toISOString(),
            },
          ]);

          return new Response(
            JSON.stringify({
              success: true,
              action: "DYNAMIC_REALLOCATION_ON_CLOSE",
              freed_count: assignedResources.length,
              reassigned_to: targetIncident.id,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } else {
          // No open incident; free resources back to unassigned pool
          const resourceIds = assignedResources.map((r) => r.id);
          await supabase
            .from("resources")
            .update({
              assigned_to_incident_id: null,
              updated_at: new Date().toISOString(),
            })
            .in("id", resourceIds);

          await supabase.from("audit_logs").insert([
            {
              action: "RESOURCES_RETURNED_TO_POOL",
              agent_name: "gemini-allocation-agent",
              details: {
                closed_incident_id: incident.id,
                freed_resources: assignedResources,
              },
              timestamp: new Date().toISOString(),
            },
          ]);

          return new Response(
            JSON.stringify({
              success: true,
              action: "RESOURCES_RETURNED_TO_POOL",
              freed_count: assignedResources.length,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // -------------------------------------------------------------
    // 2. RESOURCE ALLOCATION VIA GEMINI API (FOR OPEN INCIDENT)
    // -------------------------------------------------------------
    if (incident.status === "open") {
      // Fetch available unassigned resources
      const { data: availableResources } = await supabase
        .from("resources")
        .select("id, type, quantity, location, assigned_to_incident_id")
        .is("assigned_to_incident_id", null);

      const needed = incident.needed_resources || [];
      const assignedIds: string[] = [];

      if (geminiApiKey && availableResources && availableResources.length > 0) {
        try {
          const prompt = `You are the Disaster Resource Allocation AI.
Analyze the incident needs and match them against available unassigned depot resources.

INCIDENT:
- ID: ${incident.id}
- Severity: ${incident.severity}/10
- Description: ${incident.description}
- Needed Resources: ${JSON.stringify(needed)}

AVAILABLE RESOURCES:
${JSON.stringify(availableResources, null, 2)}

Select resource IDs that best fulfill the needed resources.
Output STRICT valid JSON:
{
  "assigned_resource_ids": ["string"],
  "rationale": "string explanation of matching"
}`;

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.1,
                  responseMimeType: "application/json",
                },
              }),
            }
          );

          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            const textResponse = gData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const parsed = JSON.parse(textResponse);
              if (Array.isArray(parsed.assigned_resource_ids)) {
                assignedIds.push(...parsed.assigned_resource_ids);
              }
            }
          }
        } catch (geminiErr) {
          console.error("Gemini API allocation error:", geminiErr);
        }
      }

      // Fallback matching if Gemini didn't return IDs or key is absent
      if (assignedIds.length === 0 && availableResources && availableResources.length > 0) {
        for (const need of needed) {
          const match = availableResources.find(
            (r) => r.type === need && !assignedIds.includes(r.id)
          );
          if (match) assignedIds.push(match.id);
        }
      }

      // Apply assignments in resources table
      if (assignedIds.length > 0) {
        await supabase
          .from("resources")
          .update({
            assigned_to_incident_id: incident.id,
            updated_at: new Date().toISOString(),
          })
          .in("id", assignedIds);

        // Record in audit_logs
        await supabase.from("audit_logs").insert([
          {
            action: "RESOURCES_ALLOCATED",
            agent_name: "gemini-allocation-agent",
            details: {
              incident_id: incident.id,
              severity: incident.severity,
              assigned_resource_ids: assignedIds,
              matched_count: assignedIds.length,
            },
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      return new Response(
        JSON.stringify({
          success: true,
          incident_id: incident.id,
          assigned_resource_ids: assignedIds,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ status: "noop" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
