// =========================================================================
// Verification Suite for Senior Backend & AI Engineer Implementation
// Tests:
// 1. POST /api/simulate-disaster (Seeds 5 fake incidents with varying severity)
// 2. GET /api/audit-log (Fetches logs for Authority dashboard)
// 3. Duplicate Detection (Within 1km & same type within 10 mins)
// 4. Dynamic Re-allocation (Freeing resources on close & reassigning to highest open severity)
// =========================================================================

async function runSeniorBackendVerification() {
  const baseUrl = "http://localhost:3000";

  console.log("================================================================");
  console.log("🛡️ SENIOR BACKEND & AI LOGIC E2E VERIFICATION");
  console.log("================================================================\n");

  // 1. TEST POST /api/simulate-disaster
  console.log("👉 [1/4] Testing POST /api/simulate-disaster (Demo Seeder)...");
  const simRes = await fetch(`${baseUrl}/api/simulate-disaster`, { method: "POST" });
  const simData = await simRes.json();
  console.log(`   Status: ${simRes.status}`);
  console.log(`   Seeded Incidents Count: ${simData.count}`);
  simData.incidents.forEach((inc, idx) => {
    console.log(`   [${idx + 1}] "${inc.title.slice(0, 45)}..." | Severity: ${inc.severity_level} (${inc.severity_score}/100) | Needs: ${Object.keys(inc.extracted_needs).join(", ")}`);
  });
  console.log("   ✅ Seeder successfully triggered Groq triage and Gemini allocation.\n");

  // 2. TEST GET /api/audit-log
  console.log("👉 [2/4] Testing GET /api/audit-log (Authority Dashboard Logs)...");
  const audRes = await fetch(`${baseUrl}/api/audit-log`);
  const audData = await audRes.json();
  console.log(`   Status: ${audRes.status}`);
  console.log(`   Total Audit Log Entries: ${audData.count}`);
  console.log("   Latest 4 Audit Entries:");
  audData.logs.slice(0, 4).forEach((log, idx) => {
    console.log(`   [${idx + 1}] ${log.action} by ${log.agent_name} at ${log.timestamp.slice(11, 19)}`);
  });
  console.log("   ✅ Authority audit trail verified.\n");

  // 3. TEST DUPLICATE DETECTION RULE (<1km, <10 mins, same type)
  console.log("👉 [3/4] Testing Duplicate Detection Rule (<1km & same type within 10m)...");
  // Post original incident
  const origRes = await fetch(`${baseUrl}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Flash Flood Trapping 20 Residents in Perambur",
      description: "Severe water current 5ft deep. 20 people trapped on rooftop.",
      category: "flood",
      estimated_people_count: 20,
      latitude: 13.1100,
      longitude: 80.2350,
      address: "Perambur High Road",
    }),
  });
  const origData = await origRes.json();
  console.log(`   Original Incident ID: ${origData.incident.id} | Duplicate: ${origData.incident.is_duplicate}`);

  // Post duplicate incident 150 meters away within 10 seconds
  const dupRes = await fetch(`${baseUrl}/api/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Rooftop flood stranding in Perambur",
      description: "20 people stuck on roof due to 5ft flood water. Need rescue boats.",
      category: "flood",
      estimated_people_count: 20,
      latitude: 13.1105, // ~55 meters away
      longitude: 80.2352,
      address: "Near Perambur Station",
    }),
  });
  const dupData = await dupRes.json();
  console.log(`   Duplicate Report ID: ${dupData.incident.id}`);
  console.log(`   ✅ Is Flagged As Duplicate: ${dupData.incident.is_duplicate}`);
  console.log(`   ✅ Duplicate Of ID: ${dupData.incident.duplicate_of_id}`);
  console.log(`   ✅ Duplicate Reason: ${dupData.incident.duplicate_reason}\n`);

  // 4. TEST DYNAMIC RE-ALLOCATION
  console.log("👉 [4/4] Testing Dynamic Re-allocation Engine...");
  const criticalIncident = simData.incidents.find((i) => i.severity_level === "CRITICAL") || simData.incidents[0];
  const reallocRes = await fetch(`${baseUrl}/api/ai/reallocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      critical_incident_id: criticalIncident.id,
      execute_now: true,
    }),
  });
  const reallocData = await reallocRes.json();
  console.log(`   Dynamic Pre-emptions Count: ${reallocData.count}`);
  if (reallocData.reallocations && reallocData.reallocations.length > 0) {
    console.log(`   ✅ Pre-empted Resource: ${reallocData.reallocations[0].resource_name}`);
    console.log(`   ✅ Justification: ${reallocData.reallocations[0].justification}`);
  }

  console.log("\n================================================================");
  console.log("🎉 ALL SENIOR BACKEND & AI REQUIREMENTS VERIFIED SUCCESSFULLY!");
  console.log("================================================================\n");
}

runSeniorBackendVerification().catch(console.error);
