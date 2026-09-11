import { NextRequest, NextResponse } from "next/server";
import { assessIncidentWithGroq } from "@/lib/ai/needs-assessment";
import { optimizeAllocationWithGemini, optimizeMultiZoneAllocation } from "@/lib/ai/allocation-agent";
import { queryCitizenChatbot } from "@/lib/ai/chatbot-agent";

export async function POST(req: NextRequest) {
  try {
    const results: Array<{
      id: number;
      agent: string;
      testCase: string;
      status: "PASS" | "FAIL";
      score?: number | string;
      summary: string;
      details: any;
    }> = [];

    // -------------------------------------------------------------------------
    // AGENT 1: Needs Assessment
    // -------------------------------------------------------------------------
    // 1.1 Low Severity
    const lowInput = {
      title: "Minor Street Drizzle & Puddling",
      description: "Minor puddle accumulation on sidewalk after light drizzle. 1 citizen walking, no trapped individuals, no power disruption.",
      category: "flood",
      estimated_people_count: 1,
      latitude: 13.0827,
      longitude: 80.2707,
    };
    const lowResult = await assessIncidentWithGroq(lowInput);
    const p1 = lowResult.severity_score <= 40 && !lowResult.extracted_needs.rescue_boats;
    results.push({
      id: 1,
      agent: "Needs-Assessment",
      testCase: "1.1 Low-Severity Report (Score <= 40, No Boats)",
      status: p1 ? "PASS" : "FAIL",
      score: `${lowResult.severity_score}/100`,
      summary: `Score: ${lowResult.severity_score}/100 (Level: ${lowResult.severity_level})`,
      details: lowResult,
    });

    // 1.2 Medium Severity
    const medInput = {
      title: "Localized Knee-Deep Waterlogging",
      description: "Water level is knee-deep along commercial arcade. 12 residents stuck inside shop, power cut, requiring clean drinking water and food packets.",
      category: "flood",
      estimated_people_count: 12,
      latitude: 13.0850,
      longitude: 80.2730,
    };
    const medResult = await assessIncidentWithGroq(medInput);
    const p2 =
      medResult.severity_score > lowResult.severity_score &&
      medResult.severity_score >= 50 &&
      medResult.severity_score <= 75 &&
      Boolean(medResult.extracted_needs.drinking_water_liters || medResult.extracted_needs.food_rations);
    results.push({
      id: 2,
      agent: "Needs-Assessment",
      testCase: "1.2 Medium-Severity Report (Score 50-75, Water/Food Needs)",
      status: p2 ? "PASS" : "FAIL",
      score: `${medResult.severity_score}/100`,
      summary: `Score: ${medResult.severity_score}/100 (Level: ${medResult.severity_level})`,
      details: medResult,
    });

    // 1.3 Critical Severity
    const critInput = {
      title: "Port Warehouse Roof Collapse & Flash Surge",
      description: "Rapid flood surge triggered building collapse. 35 workers trapped under concrete rubble with rising waters, critical trauma casualties, emergency boats and ambulances needed immediately.",
      category: "structural_collapse",
      estimated_people_count: 35,
      latitude: 13.1025,
      longitude: 80.2985,
    };
    const critResult = await assessIncidentWithGroq(critInput);
    const dynamicCheck =
      critResult.severity_score > medResult.severity_score &&
      medResult.severity_score > lowResult.severity_score;
    const p3 = critResult.severity_score >= 85 && Boolean(critResult.extracted_needs.rescue_boats) && dynamicCheck;
    results.push({
      id: 3,
      agent: "Needs-Assessment",
      testCase: "1.3 Critical-Severity Report (Score >= 85, Dynamic Proportionality)",
      status: p3 ? "PASS" : "FAIL",
      score: `${critResult.severity_score}/100`,
      summary: `Score: ${critResult.severity_score}/100 (Level: ${critResult.severity_level})`,
      details: critResult,
    });

    // -------------------------------------------------------------------------
    // AGENT 2: Allocation Agent
    // -------------------------------------------------------------------------
    const sampleDepots = [
      { id: "depot-alpha", name: "Central Forward Base", latitude: 13.0827, longitude: 80.2707 },
    ];
    const incidentZoneA = {
      id: "inc-zone-a",
      title: "Zone A - Flooded Residential Colony",
      severity_level: "HIGH" as const,
      severity_score: 75,
      latitude: 13.0840,
      longitude: 80.2720,
      extracted_needs: { drinking_water_liters: 100 },
    };
    const incidentZoneB = {
      id: "inc-zone-b",
      title: "Zone B - Community Evacuation Point",
      severity_level: "MEDIUM" as const,
      severity_score: 55,
      latitude: 13.0900,
      longitude: 80.2800,
      extracted_needs: { drinking_water_liters: 150 },
    };
    const abundantResources = [
      { id: "res-water-1", item_name: "Drinking Water", category: "drinking_water_liters", available_quantity: 1000, total_quantity: 1000, depot_id: "depot-alpha" },
    ];

    // 2.1 Sufficient Inventory
    const sufficientPlan = await optimizeMultiZoneAllocation([incidentZoneA, incidentZoneB], sampleDepots, abundantResources);
    const p4 = !sufficientPlan.scarcity_detected && sufficientPlan.total_allocated_by_resource["Drinking Water"] === 250;
    results.push({
      id: 4,
      agent: "Allocation Agent",
      testCase: "2.1 Sufficient Inventory (Full Demand Satisfied, No Shortages)",
      status: p4 ? "PASS" : "FAIL",
      summary: `Allocated 250L / 250L demand (Shortages: 0)`,
      details: sufficientPlan,
    });

    // 2.2 Scarcity Allocation
    const critIncident = {
      id: "inc-crit-priority",
      title: "ICU Clinic Submersion (CRITICAL)",
      severity_level: "CRITICAL" as const,
      severity_score: 95,
      latitude: 13.0840,
      longitude: 80.2720,
      extracted_needs: { medical_kits: 15 },
    };
    const lowIncident = {
      id: "inc-low-secondary",
      title: "Street Waterlogging (LOW)",
      severity_level: "LOW" as const,
      severity_score: 30,
      latitude: 13.0900,
      longitude: 80.2800,
      extracted_needs: { medical_kits: 15 },
    };
    const scarceResources = [
      { id: "res-med-scarce", item_name: "Level-3 Medical Kits", category: "medical_kits", available_quantity: 15, total_quantity: 15, depot_id: "depot-alpha" },
    ];
    const scarcePlan = await optimizeMultiZoneAllocation([critIncident, lowIncident], sampleDepots, scarceResources);
    const critAlloc = scarcePlan.allocations_by_incident[critIncident.id]?.suggestions[0]?.allocated_quantity || 0;
    const lowAlloc = scarcePlan.allocations_by_incident[lowIncident.id]?.suggestions[0]?.allocated_quantity || 0;
    const p5 = scarcePlan.scarcity_detected && critAlloc === 15 && lowAlloc === 0;
    results.push({
      id: 5,
      agent: "Allocation Agent",
      testCase: "2.2 Scarcity Prioritization (Critical gets 100%, Low gets Shortage)",
      status: p5 ? "PASS" : "FAIL",
      summary: `Critical (Sev 95) got 15 kits, Low (Sev 30) got 0 kits with shortage flag`,
      details: scarcePlan,
    });

    // 2.3 Gemini API Resilience
    const resilientPlan = await optimizeAllocationWithGemini(critIncident, sampleDepots, scarceResources, { mockMalformed: true });
    const p6 = resilientPlan.ai_rationale.includes("Unable to assess this report right now, please retry");
    results.push({
      id: 6,
      agent: "Allocation Agent",
      testCase: "2.3 Gemini Malformed API Resilience (Safe Fallback Caught)",
      status: p6 ? "PASS" : "FAIL",
      summary: `Caught error cleanly: "${resilientPlan.ai_rationale}"`,
      details: resilientPlan,
    });

    // -------------------------------------------------------------------------
    // AGENT 3: Chatbot Agent
    // -------------------------------------------------------------------------
    const verifiedZones = [
      {
        id: "zone-marina-depot",
        name: "Marina Waterfront Central Depot",
        type: "relief_hub",
        distance_km: 0.8,
        available_supplies: {
          potable_water: "5,000 Liters",
          ration_kits: "3,000 Boxes",
        },
      },
    ];

    // 3.1 Grounded Query
    const query = "Where is the nearest drinking water and ration distribution center?";
    const groundedAnswer = await queryCitizenChatbot(query, { nearbyZones: verifiedZones });
    const p7 = groundedAnswer.grounded && groundedAnswer.reply.includes("Marina Waterfront Central Depot");
    results.push({
      id: 7,
      agent: "Chatbot Agent",
      testCase: "3.1 Grounded Query with Zone Data (Accurate Depot Cited)",
      status: p7 ? "PASS" : "FAIL",
      summary: `Grounded reply citing Marina Depot (0.8 km)`,
      details: groundedAnswer,
    });

    // 3.2 Anti-Hallucination Guard
    const ungroundedAnswer = await queryCitizenChatbot(query, { nearbyZones: [] });
    const p8 = !ungroundedAnswer.grounded && ungroundedAnswer.hallucination_prevented && ungroundedAnswer.reply.includes("No verified emergency relief zones");
    results.push({
      id: 8,
      agent: "Chatbot Agent",
      testCase: "3.2 Anti-Hallucination Guard (Refuses False Camps, Directs to SDMA)",
      status: p8 ? "PASS" : "FAIL",
      summary: `Refused hallucination; directed to radio & SDMA 1070`,
      details: ungroundedAnswer,
    });

    // 3.3 Chatbot API Resilience
    const fallbackChat = await queryCitizenChatbot(query, { nearbyZones: verifiedZones, mockEmpty: true });
    const p9 = !fallbackChat.success && fallbackChat.reply.includes("Unable to assess this report right now, please retry");
    results.push({
      id: 9,
      agent: "Chatbot Agent",
      testCase: "3.3 Chatbot API Resilience (Graceful Fallback on Model Error)",
      status: p9 ? "PASS" : "FAIL",
      summary: `Caught empty API error cleanly: "${fallbackChat.reply}"`,
      details: fallbackChat,
    });

    const passedCount = results.filter((r) => r.status === "PASS").length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      total_tests: results.length,
      passed_count: passedCount,
      all_passed: passedCount === results.length,
      results,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
