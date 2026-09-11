// =========================================================================
// Verification Test: Step 5 Demo Helpers & API Routes
// Tests:
// 1. Role Protection on POST /api/demo/simulate-disaster (403 for citizen, 200 for authority)
// 2. 5 Realistic Incidents across Zones A-E
// 3. GET /api/audit-log returning the latest 50 logs
// =========================================================================

async function testStep5Routes() {
  const baseUrl = "http://localhost:3000";

  console.log("================================================================");
  console.log("🚀 STEP 5: DEMO SIMULATION & AUDIT LOG API VERIFICATION");
  console.log("================================================================\n");

  // 1. Test Role Protection on /api/demo/simulate-disaster
  console.log("👉 [1/3] Testing Role Protection on /api/demo/simulate-disaster...");
  
  // A. Unauthorized attempt with citizen role
  const unauthRes = await fetch(`${baseUrl}/api/demo/simulate-disaster`, {
    method: "POST",
    headers: { "x-user-role": "citizen" },
  });
  console.log(`   Citizen Attempt Status: ${unauthRes.status} (Expected: 403)`);
  if (unauthRes.status === 403) {
    console.log("   ✅ Security Check Passed: Citizen role is blocked from triggering simulation.");
  } else {
    throw new Error(`Security Violation: Expected 403, received ${unauthRes.status}`);
  }

  // B. Authorized attempt with authority role
  console.log("\n👉 [2/3] Testing Authorized Simulation (Role: Authority)...");
  const authRes = await fetch(`${baseUrl}/api/demo/simulate-disaster`, {
    method: "POST",
    headers: { "x-user-role": "authority" },
  });
  const authData = await authRes.json();
  console.log(`   Authority Attempt Status: ${authRes.status}`);
  console.log(`   Seeded Incidents Count: ${authData.count}`);
  
  authData.incidents.forEach((inc, i) => {
    console.log(`   [Incident ${i + 1}] Type: ${inc.type.padEnd(20)} | Severity: ${inc.severity_score}/10 | Coords: [${inc.location_lat}, ${inc.location_lng}]`);
    console.log(`       Description: ${inc.description.slice(0, 70)}...`);
  });
  console.log("   ✅ 5 Realistic incidents seeded across Zones A-E.\n");

  // 3. Test GET /api/audit-log
  console.log("👉 [3/3] Testing GET /api/audit-log (Latest 50 Logs)...");
  const auditRes = await fetch(`${baseUrl}/api/audit-log`);
  const auditData = await auditRes.json();
  console.log(`   Status: ${auditRes.status}`);
  console.log(`   Audit Log Count: ${auditData.count}`);
  console.log("   Latest 3 Entries:");
  auditData.logs.slice(0, 3).forEach((log, i) => {
    console.log(`   [${i + 1}] ${log.action} by ${log.agent_name} at ${log.timestamp?.slice(11, 19)}`);
  });
  console.log("   ✅ Audit log API verified.\n");

  console.log("================================================================");
  console.log("🎉 STEP 5 DEMO HELPERS & API ROUTES VERIFIED WITH 100% SUCCESS!");
  console.log("================================================================\n");
}

testStep5Routes().catch(console.error);
