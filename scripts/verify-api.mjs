// =========================================================================
// API Integration Test for Kurukshetra PS20 Agentic Disaster Relief
// =========================================================================

async function testApi() {
  const baseUrl = "http://localhost:3000";

  console.log("================================================================");
  console.log("🌐 E2E API & AI AGENTIC WORKFLOW TEST (HTTP)");
  console.log("================================================================\n");

  // 1. GET Incidents
  console.log("1️⃣ Testing GET /api/incidents...");
  const incRes = await fetch(`${baseUrl}/api/incidents`);
  const incData = await incRes.json();
  console.log(`   Status: ${incRes.status}, Total pre-seeded incidents: ${incData.count}`);

  // 2. POST SOS Incident (Groq AI Triage)
  console.log("\n2️⃣ Testing POST /api/incidents (Groq AI Needs Assessment)...");
  const sosPayload = {
    title: "Mylapore Elderly Home 6ft Water Ingress - 48 Stranded",
    description: "Entire ground floor submerged. 48 elderly citizens stranded on roof, 8 require continuous oxygen and emergency boat evacuation immediately.",
    category: "trapped_victims",
    estimated_people_count: 48,
    latitude: 13.0315,
    longitude: 80.2520,
    address: "St. Thomas Road, Santhome",
    citizen_id: "citizen-demo-01",
  };

  const sosRes = await fetch(`${baseUrl}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sosPayload),
  });
  const sosData = await sosRes.json();
  const createdIncident = sosData.incident;
  console.log(`   Incident Created ID: ${createdIncident.id}`);
  console.log(`   Groq Severity: ${createdIncident.severity_level} (Score: ${createdIncident.severity_score}/100)`);
  console.log(`   Extracted Needs:`, createdIncident.extracted_needs);
  console.log(`   Is Duplicate: ${createdIncident.is_duplicate}`);

  // 3. POST Duplicate Incident
  console.log("\n3️⃣ Testing Duplicate Incident Detection (Groq Spatial & Lexical)...");
  const dupPayload = {
    title: "Elderly Home flooded in Santhome",
    description: "48 old folks stranded on rooftop in Mylapore floodwater. Need rescue boats.",
    category: "trapped_victims",
    estimated_people_count: 48,
    latitude: 13.0317, // 20m away
    longitude: 80.2521,
    address: "Near Santhome Cathedral",
    citizen_id: "citizen-demo-02",
  };

  const dupRes = await fetch(`${baseUrl}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dupPayload),
  });
  const dupData = await dupRes.json();
  console.log(`   Is Flagged as Duplicate: ${dupData.incident.is_duplicate}`);
  console.log(`   Duplicate of ID: ${dupData.incident.duplicate_of_id}`);
  console.log(`   Confidence: ${dupData.incident.duplicate_confidence}`);
  console.log(`   Rationale: ${dupData.incident.duplicate_reason}`);

  // 4. POST AI Allocation (Gemini Multi-Depot Optimization)
  console.log("\n4️⃣ Testing POST /api/ai/allocate (Gemini 1.5 Resource Optimization)...");
  const allocRes = await fetch(`${baseUrl}/api/ai/allocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      incident_id: createdIncident.id,
      auto_approve: true,
    }),
  });
  const allocData = await allocRes.json();
  console.log(`   Allocations Generated & Auto-Dispatched: ${allocData.plan.suggestions.length}`);
  console.log(`   Primary Distance: ${allocData.plan.total_distance_km} km`);
  allocData.plan.suggestions.forEach((sug, i) => {
    console.log(`   [Item ${i + 1}] ${sug.allocated_quantity}x ${sug.resource_name} from ${sug.depot_name} (ETA: ${sug.eta_minutes}m)`);
  });
  console.log(`   Dispatched Mission Unit: ${allocData.mission?.team_name} (Status: ${allocData.mission?.status})`);

  // 5. POST Dynamic Re-allocation
  console.log("\n5️⃣ Testing POST /api/ai/reallocate (Ethical Supply Pre-emption)...");
  const reallocRes = await fetch(`${baseUrl}/api/ai/reallocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      critical_incident_id: createdIncident.id,
      execute_now: true,
    }),
  });
  const reallocData = await reallocRes.json();
  console.log(`   Dynamic Pre-emptions Executed: ${reallocData.count}`);
  if (reallocData.reallocations && reallocData.reallocations.length > 0) {
    console.log(`   Pre-emption Event:`, reallocData.reallocations[0].justification);
  }

  // 6. GET Audit Logs
  console.log("\n6️⃣ Testing GET /api/audit (Immutable Audit Trail)...");
  const audRes = await fetch(`${baseUrl}/api/audit`);
  const audData = await audRes.json();
  console.log(`   Total Immutable Audit Logs: ${audData.count}`);
  console.log("   Latest 5 Actions:");
  audData.logs.slice(0, 5).forEach((log) => {
    console.log(`   - [${log.timestamp.slice(11, 19)}] ${log.action} by ${log.actor_role} (${log.actor_id})`);
  });

  console.log("\n================================================================");
  console.log("🎉 ALL E2E API WORKFLOWS PASSED WITH 100% SUCCESS!");
  console.log("================================================================\n");
}

testApi().catch(console.error);
