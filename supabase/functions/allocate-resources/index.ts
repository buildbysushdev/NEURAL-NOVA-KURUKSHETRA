// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 4: AI Agent 2 (Allocation & Dynamic Re-allocation)
// FILE: supabase/functions/allocate-resources/index.ts
// AGENT: "Strategist" AI Agent
// ROLE: Senior Backend Architect
// TARGET RUNTIME: Deno (Supabase Edge Functions)
// =========================================================================
//
// -------------------------------------------------------------------------
// ARCHITECTURAL & AI DESIGN DECISIONS (FOR JUDGING / Q&A PREPARATION):
// -------------------------------------------------------------------------
// 1. WHY GEMINI FOR THE STRATEGIST AGENT?
//    - Resource allocation is a multi-constraint combinatorial knapsack optimization problem:
//      balancing available inventory counts, travel proximity, incident severity weights,
//      and priority thresholds across multiple emergency hubs simultaneously.
//    - Gemini's massive reasoning context window and analytical prowess enables high-quality
//      multi-hop logistical reasoning and deterministic JSON output.
//
// 2. HOW IS DOUBLE-BOOKING PREVENTED (TRANSACTION SAFETY)?
//    - We employ atomic conditional updates at the PostgreSQL layer:
//      `.is("assigned_to_incident_id", null)` during the assignment update.
//    - If two concurrent triggers evaluate the same free boats or medical kits simultaneously,
//      only the first transaction succeeds; the second receives 0 affected rows,
//      preventing phantom double allocations in high-concurrency disaster surges.
//
// 3. WHY DYNAMIC RE-ALLOCATION?
//    - Real-world catastrophe recovery is fluid. When an incident is marked 'resolved',
//      critical assets (rescue boats, ambulances, mobile ICU units) must not sit idle.
//    - The Strategist automatically traps the status transition and transfers active
//      assets to the next highest-severity open distress call in real time.
// -------------------------------------------------------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface WebhookRecord {
  id: string;
  type?: string;
  description?: string;
  severity_score?: number;
  status: "open" | "resolved";
  location_lat?: number;
  location_lng?: number;
  is_duplicate?: boolean;
  language?: "en" | "hi";
}

interface WebhookPayload {
  type?: "INSERT" | "UPDATE";
  table?: string;
  schema?: string;
  record?: WebhookRecord;
  old_record?: WebhookRecord;
}

interface ResourceRow {
  id: string;
  type: string;
  quantity: number;
  location_hub: string;
  assigned_to_incident_id: string | null;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Initialize Environment & Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
    const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-flash-latest";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[Strategist Agent] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
      return new Response(
        JSON.stringify({ error: "Internal server configuration error." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Parse Webhook Payload
    const body: WebhookPayload = await req.json();
    const incident: WebhookRecord = body.record || (body as any);
    const oldRecord: WebhookRecord | undefined = body.old_record;

    if (!incident || !incident.id) {
      console.warn("[Strategist Agent] Received payload with missing incident id.");
      return new Response(
        JSON.stringify({ error: "Missing incident record in payload." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[Strategist Agent] Triggered for Incident ID: ${incident.id} (Status: ${incident.status}, Severity: ${incident.severity_score})`);

    // =========================================================================
    // CASE A: DYNAMIC RE-ALLOCATION (When Incident Status changes to 'resolved')
    // =========================================================================
    if (incident.status === "resolved") {
      console.log(`[Strategist Agent] Incident ${incident.id} marked RESOLVED. Initiating dynamic resource recovery...`);

      // 1. Find all resources currently assigned to this resolved incident
      const { data: assignedResources, error: resError } = await supabaseAdmin
        .from("resources")
        .select("id, type, quantity, location_hub")
        .eq("assigned_to_incident_id", incident.id);

      if (resError) {
        console.error("[Strategist Agent] Error querying assigned resources:", resError.message);
      }

      if (assignedResources && assignedResources.length > 0) {
        console.log(`[Strategist Agent] Recovering ${assignedResources.length} resources from resolved Incident ${incident.id}`);

        // 2. Query the highest severity 'open' incident (excluding duplicates)
        const { data: highestOpenIncidents, error: incError } = await supabaseAdmin
          .from("incidents")
          .select("id, severity_score, type, description")
          .eq("status", "open")
          .eq("is_duplicate", false)
          .neq("id", incident.id)
          .order("severity_score", { ascending: false })
          .limit(1);

        if (incError) {
          console.error("[Strategist Agent] Error querying highest severity open incident:", incError.message);
        }

        const targetIncident = highestOpenIncidents?.[0];

        if (targetIncident) {
          // Re-assign recovered resources atomically to the highest priority emergency
          const resourceIds = assignedResources.map((r) => r.id);

          const { error: reassignError } = await supabaseAdmin
            .from("resources")
            .update({ assigned_to_incident_id: targetIncident.id })
            .in("id", resourceIds)
            .eq("assigned_to_incident_id", incident.id); // Guard to ensure atomic transfer

          if (reassignError) {
            console.error("[Strategist Agent] Error during resource reallocation:", reassignError.message);
          } else {
            // Log each re-allocation into audit_logs in user's preferred language
            const isHindiRealloc = incident.language === "hi";
            for (const r of assignedResources) {
              const auditMessage = isHindiRealloc
                ? `गतिशील पुनरावंटन: रणनीतिकार एजेंट ने संसाधन ${r.id} को घटना ${targetIncident.id} में आवंटित किया`
                : `Dynamic Re-allocation: Strategist Agent allocated Resource ${r.id} to Incident ${targetIncident.id}`;
              await supabaseAdmin.from("audit_logs").insert([
                {
                  agent_name: "Strategist Agent",
                  action: auditMessage,
                  details_json: {
                    event: "DYNAMIC_REALLOCATION",
                    language: isHindiRealloc ? "hi" : "en",
                    resource_id: r.id,
                    resource_type: r.type,
                    freed_from_incident_id: incident.id,
                    reassigned_to_incident_id: targetIncident.id,
                    target_severity_score: targetIncident.severity_score,
                  },
                  timestamp: new Date().toISOString(),
                },
              ]);
            }

            console.log(`[Strategist Agent] Dynamically reassigned ${assignedResources.length} resources to Priority Incident ${targetIncident.id}`);
          }

          return new Response(
            JSON.stringify({
              success: true,
              action: "DYNAMIC_REALLOCATION",
              freed_from: incident.id,
              reassigned_to: targetIncident.id,
              target_severity: targetIncident.severity_score,
              reassigned_resources_count: assignedResources.length,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } else {
          // No active open incidents; return resources cleanly to unassigned inventory pool
          const resourceIds = assignedResources.map((r) => r.id);
          await supabaseAdmin
            .from("resources")
            .update({ assigned_to_incident_id: null })
            .in("id", resourceIds);

          for (const r of assignedResources) {
            await supabaseAdmin.from("audit_logs").insert([
              {
                agent_name: "Strategist Agent",
                action: `Strategist Agent freed Resource ${r.id} back to pool`,
                details_json: {
                  event: "RESOURCES_RETURNED_TO_POOL",
                  resource_id: r.id,
                  resource_type: r.type,
                  freed_from_incident_id: incident.id,
                },
                timestamp: new Date().toISOString(),
              },
            ]);
          }

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

      return new Response(
        JSON.stringify({ success: true, message: "No resources were assigned to this resolved incident." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // CASE B: STANDARD ALLOCATION (When severity_score is updated & status='open')
    // =========================================================================
    if (incident.status === "open" && (incident.severity_score ?? 0) > 0) {
      console.log(`[Strategist Agent] Running AI optimization for Open Incident ${incident.id} (Severity: ${incident.severity_score})...`);

      // 1. Fetch available unassigned resources (Transaction safety check: assigned_to_incident_id IS NULL)
      const { data: availableResources, error: fetchResError } = await supabaseAdmin
        .from("resources")
        .select("id, type, quantity, location_hub, assigned_to_incident_id")
        .is("assigned_to_incident_id", null);

      if (fetchResError) {
        console.error("[Strategist Agent] Error fetching available resources:", fetchResError.message);
        return new Response(
          JSON.stringify({ error: "Failed to fetch resource inventory." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!availableResources || availableResources.length === 0) {
        console.log("[Strategist Agent] No unassigned resources available in hubs.");
        return new Response(
          JSON.stringify({ success: true, message: "All relief resources are currently deployed." }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Determine needed resources based on severity and incident description
      const descLower = (incident.description || "").toLowerCase();
      const neededList: string[] = [];
      if (descLower.includes("water") || descLower.includes("flood") || (incident.severity_score ?? 0) >= 4) {
        neededList.push("water");
      }
      if (descLower.includes("food") || descLower.includes("stranded") || (incident.severity_score ?? 0) >= 5) {
        neededList.push("food");
      }
      if (descLower.includes("medical") || descLower.includes("injury") || (incident.severity_score ?? 0) >= 7) {
        neededList.push("medical");
      }
      if (descLower.includes("tent") || descLower.includes("shelter") || (incident.severity_score ?? 0) >= 6) {
        neededList.push("tent");
      }

      if (neededList.length === 0) {
        neededList.push("water", "food");
      }

      // 2. Call Gemini API to Optimize Allocation
      let selectedAllocations: Array<{ resource_id: string; quantity: number }> = [];

      if (geminiApiKey) {
        try {
          const geminiPrompt = `You are the Strategist AI Agent for disaster logistics.
We have the following inventory list:
${JSON.stringify(availableResources, null, 2)}

The incident (Severity ${incident.severity_score}/10) needs:
${JSON.stringify(neededList)}

Optimize allocation. Return JSON:
[
  { "resource_id": "X", "quantity": Y }
]
Only select resource IDs that exist in the inventory list and are unassigned. Return strictly JSON array.`;

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: geminiPrompt }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const parsed = JSON.parse(textResponse);
              if (Array.isArray(parsed)) {
                selectedAllocations = parsed;
              } else if (parsed.resource_id) {
                selectedAllocations = [parsed];
              }
            }
          } else {
            const errText = await geminiRes.text();
            console.warn("[Strategist Agent] Gemini API call returned:", geminiRes.status, errText);
          }
        } catch (geminiErr: any) {
          console.error("[Strategist Agent] Exception calling Gemini API:", geminiErr.message || geminiErr);
        }
      }

      // Fallback deterministic allocation: match available inventory to needed types
      if (selectedAllocations.length === 0) {
        for (const need of neededList) {
          const matched = availableResources.find(
            (r) => r.type === need && !selectedAllocations.some((a) => a.resource_id === r.id)
          );
          if (matched) {
            selectedAllocations.push({
              resource_id: matched.id,
              quantity: matched.quantity,
            });
          }
        }
      }

      // 3. Apply Allocations with Transaction Safety (Prevent double-booking)
      const allocatedResourcesSummary: any[] = [];

      for (const item of selectedAllocations) {
        // ATOMIC TRANSACTION CHECK: Only update if assigned_to_incident_id is still NULL
        const { data: updatedResource, error: updateError } = await supabaseAdmin
          .from("resources")
          .update({ assigned_to_incident_id: incident.id })
          .eq("id", item.resource_id)
          .is("assigned_to_incident_id", null) // Crucial: ensures atomic reservation without race conditions
          .select("id, type, quantity, location_hub")
          .single();

        if (!updateError && updatedResource) {
          allocatedResourcesSummary.push(updatedResource);

          // Insert localized audit log format:
          const isHindiAlloc = incident.language === "hi";
          const auditMessage = isHindiAlloc
            ? `संसाधन आवंटित: रणनीतिकार एजेंट ने संसाधन ${updatedResource.id} को घटना ${incident.id} में आवंटित किया`
            : `Resources Allocated: Strategist Agent allocated Resource ${updatedResource.id} to Incident ${incident.id}`;

          await supabaseAdmin.from("audit_logs").insert([
            {
              agent_name: "Strategist Agent",
              action: auditMessage,
              details_json: {
                language: isHindiAlloc ? "hi" : "en",
                resource_id: updatedResource.id,
                resource_type: updatedResource.type,
                quantity: item.quantity || updatedResource.quantity,
                location_hub: updatedResource.location_hub,
                incident_id: incident.id,
                severity_score: incident.severity_score,
              },
              timestamp: new Date().toISOString(),
            },
          ]);

          console.log(`[Strategist Agent] ${auditMessage}`);
        } else {
          console.warn(`[Strategist Agent] Resource ${item.resource_id} could not be reserved (possibly claimed concurrently).`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          incident_id: incident.id,
          severity_score: incident.severity_score,
          allocated_count: allocatedResourcesSummary.length,
          allocated_resources: allocatedResourcesSummary,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "No allocation action required for current incident state." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Strategist Agent] Unhandled error:", err.message || err);
    return new Response(
      JSON.stringify({ error: err.message || "An unexpected error occurred." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
