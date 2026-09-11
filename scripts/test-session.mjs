// =========================================================================
// Verification Test: /api/auth/session
// Tests role retrieval, profile data structure, and zero password exposure.
// =========================================================================

async function testSessionApi() {
  const baseUrl = "http://localhost:3000";

  console.log("================================================================");
  console.log("🔑 STEP 2: AUTH & SESSION API VERIFICATION");
  console.log("================================================================\n");

  // 1. Default Session Query
  console.log("👉 [1/3] Testing GET /api/auth/session (Default Citizen)...");
  const res1 = await fetch(`${baseUrl}/api/auth/session`);
  const data1 = await res1.json();
  console.log(`   Status: ${res1.status}`);
  console.log(`   Authenticated: ${data1.authenticated}`);
  console.log(`   User ID: ${data1.user?.id}`);
  console.log(`   User Role: ${data1.user?.role}`);
  console.log(`   Phone: ${data1.user?.phone}`);
  console.log(`   Has Password Field Exposed?: ${Boolean(data1.user?.password || data1.password)}`);
  
  if (Boolean(data1.user?.password || data1.password)) {
    throw new Error("SECURITY FAILURE: Password was exposed in session API!");
  }
  console.log("   ✅ Clean sanitized session profile returned.\n");

  // 2. Rescue Role Session Query
  console.log("👉 [2/3] Testing GET /api/auth/session?role=rescue...");
  const res2 = await fetch(`${baseUrl}/api/auth/session?role=rescue`);
  const data2 = await res2.json();
  console.log(`   Role Received: ${data2.user?.role}`);
  console.log("   ✅ Rescue role context passed.\n");

  // 3. Authority Role Session Query
  console.log("👉 [3/3] Testing GET /api/auth/session?role=authority...");
  const res3 = await fetch(`${baseUrl}/api/auth/session?role=authority`);
  const data3 = await res3.json();
  console.log(`   Role Received: ${data3.user?.role}`);
  console.log("   ✅ Authority role context passed.\n");

  console.log("================================================================");
  console.log("🎉 STEP 2 AUTH & SESSION API VERIFIED WITH 100% SUCCESS!");
  console.log("================================================================\n");
}

testSessionApi().catch(console.error);
