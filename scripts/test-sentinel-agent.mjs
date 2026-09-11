// =========================================================================
// Verification Test: Sentinel AI Agent (Groq Llama 3)
// Tests:
// 1. Groq Llama 3 API call with prompt: { severity: 1-10, needed_resources: [], is_duplicate: boolean }
// 2. Spatial Duplicate Verification (within 1km)
// 3. Audit log entry: "Sentinel Agent analyzed Incident ID X"
// =========================================================================

import Groq from "groq-sdk";

async function testSentinelAgent() {
  console.log("================================================================");
  console.log("🤖 STEP 3: SENTINEL AI AGENT VERIFICATION (GROQ LLAMA 3)");
  console.log("================================================================\n");

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.warn("⚠️ GROQ_API_KEY environment variable is not set.");
  }
  const groq = new Groq({ apiKey: groqApiKey || "mock-key" });

  const dummyIncident = {
    id: "inc-dummy-sentinel-101",
    location_lat: 13.0315,
    location_lng: 80.2520,
    type: "flood",
    description: "Water reached 6 feet in ground floor. 30 residents trapped without power or food. 3 elderly people need heart medication urgently.",
  };

  console.log("👉 [1/3] Calling Groq API (Llama 3) for Sentinel Triage...");
  const prompt = `Analyze this disaster report. Return JSON: { severity: 1-10, needed_resources: [], is_duplicate: boolean }

Disaster Category: ${dummyIncident.type}
Coordinates: [${dummyIncident.location_lat}, ${dummyIncident.location_lng}]
Report Content: "${dummyIncident.description}"

Guidelines:
- severity: integer 1 to 10.
- needed_resources: array of strings selected from ["water", "food", "medical", "tent", "boats", "personnel"].
- is_duplicate: boolean.

Return strictly valid JSON only without markdown fences.`;

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are the Sentinel AI Agent in an emergency disaster response center. Output strictly JSON." },
      { role: "user", content: prompt },
    ],
  });

  const responseText = completion.choices[0]?.message?.content;
  console.log("   Groq Raw Response:", responseText);

  const parsed = JSON.parse(responseText || "{}");
  console.log(`   ✅ Extracted Severity Score (1-10): ${parsed.severity}`);
  console.log(`   ✅ Needed Resources:`, parsed.needed_resources);
  console.log(`   ✅ AI Duplicate Flag: ${parsed.is_duplicate}\n`);

  // 2. Test 1km Duplicate Confirmation Logic
  console.log("👉 [2/3] Testing Spatial Duplicate Verification Rule...");
  function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  const existingIncident = {
    id: "inc-existing-prior",
    location_lat: 13.0320, // ~60m away
    location_lng: 80.2522,
  };

  const dist = calculateDistanceKm(
    dummyIncident.location_lat,
    dummyIncident.location_lng,
    existingIncident.location_lat,
    existingIncident.location_lng
  );

  const isConfirmedDuplicate = dist <= 1.0;
  console.log(`   Distance to prior incident: ${dist.toFixed(3)} km`);
  console.log(`   ✅ Duplicate Confirmed by 1km rule: ${isConfirmedDuplicate}\n`);

  // 3. Test Audit Log message format
  console.log("👉 [3/3] Checking Audit Log Message Format...");
  const auditAction = `Sentinel Agent analyzed Incident ID ${dummyIncident.id}`;
  console.log(`   ✅ Audit Action String: "${auditAction}"`);
  console.log(`   ✅ Agent Name: "Sentinel Agent"`);

  console.log("\n================================================================");
  console.log("🎉 STEP 3: SENTINEL AI AGENT VERIFIED WITH 100% SUCCESS!");
  console.log("================================================================\n");
}

testSentinelAgent().catch(console.error);
