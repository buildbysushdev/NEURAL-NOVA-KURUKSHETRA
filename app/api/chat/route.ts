import { NextRequest, NextResponse } from "next/server";

// =========================================================================
// KURUKSHETRA PS20: AGENTIC DISASTER RELIEF
// High-Accuracy Sentinel AI Chatbot with Multi-Model Redundancy & Disaster-Only Guardrails
// FILE: app/api/chat/route.ts
// =========================================================================

const SYSTEM_PROMPT = `You are Sentinel AI, the official Autonomous Emergency & Disaster Relief Assistant for PS20 (operating in Chennai & Tamil Nadu, India).

CRITICAL DOMAIN DIRECTIVE:
You MUST ONLY provide answers strictly related to DISASTERS, EMERGENCIES, CITIZEN SAFETY, SURVIVAL, FIRST AID, AND RESCUE OPERATIONS.
If the user asks about non-emergency, casual, or off-topic subjects (e.g. movies, video games, jokes, coding, sports), FIRMLY YET POLITELY DEFLECT:
"🛡️ Sentinel AI is strictly dedicated to Disaster Relief & Life Safety. Please ask questions related to disaster locations, evacuation shelters, emergency safety measures, survival suggestions, or rescue assistance."

REQUIRED RESPONSE STRUCTURE:
Whenever answering disaster queries, provide structured, actionable, and clear guidance using these core pillars:
1. 📍 LOCATION & SHELTERS: Provide specific geographic landmarks, designated safe zones, and evacuation corridors (e.g., Central Relief Station Alpha 800m inland from Marina, Anna Salai Westbound Highway, Royapettah Relief Post).
2. 🛡️ SAFETY MEASURES: Clear, numbered life-safety steps (disconnect power, avoid flood waters, drop-cover-hold, stay below smoke layer).
3. 💡 SUGGESTIONS & SURVIVAL TIPS: Practical guidance (clean water purification, treating wounds, 72-hour Go-Bag contents, signaling rescue drones/helicopters with 3 flashes or whistle blasts, battery saving).
4. 📞 CRITICAL HELPLINES: National Emergency: 112 | Ambulance: 108 | TN SDMA Control: 1070 | Fire: 101.

Keep responses concise, urgent, authoritative, and easy to read on mobile devices during a disaster.`;

// =========================================================================
// Comprehensive Context-Aware Offline Semantic Engine
// =========================================================================
function getSemanticFallbackReply(message: string): string {
  const msg = message.toLowerCase().trim();

  // Guardrail: Non-disaster casual / off-topic filter
  if (
    msg.includes("movie") ||
    msg.includes("song") ||
    msg.includes("cricket") ||
    msg.includes("football") ||
    msg.includes("game") ||
    msg.includes("joke") ||
    msg.includes("bitcoin") ||
    msg.includes("crypto") ||
    msg.includes("dating")
  ) {
    return "🛡️ **Sentinel Disaster Guardrail Active:**\nSentinel AI is strictly dedicated to **Disaster Relief & Citizen Life Safety**. For non-emergency queries, please use a standard search engine. If you are experiencing a weather hazard, structural emergency, or flood, please ask about shelter locations, safety measures, or rescue assistance.";
  }

  // 1. Locations, Shelters & Evacuation Corridors
  if (
    msg.includes("shelter") ||
    msg.includes("camp") ||
    msg.includes("where") ||
    msg.includes("location") ||
    msg.includes("safe place") ||
    msg.includes("zone") ||
    msg.includes("corridor") ||
    msg.includes("evacuat") ||
    msg.includes("route")
  ) {
    return `📍 **Emergency Shelters & Safe Locations (Chennai):**
1. **Central Relief Station Alpha**: 800m inland from Marina Beach (Anna Salai Junction) — Full medical triage, drinking water, and hot rations.
2. **Royapettah Relief Post**: 1.2km inland (Near Government Hospital) — Inpatient stabilization.
3. **Saidapet Community Relief Hub**: 2.1km inland — Bedding & family evacuation center.

🚶 **Designated Safe Corridor:**
Evacuate inland westward along **Anna Salai High Ridge**. Avoid Marina Promenade (Kamaraj Salai) due to 1.4m standing water and low-lying coastal underpasses.

📞 **Emergency Transport Dispatch:** Dial **112** or **1070**.`;
  }

  // 2. Flood & Severe Waterlogging
  if (
    msg.includes("flood") ||
    msg.includes("water") ||
    msg.includes("rain") ||
    msg.includes("submerg") ||
    msg.includes("drown") ||
    msg.includes("flow")
  ) {
    return `🌊 **Flood & Waterlogging Emergency Protocols:**

🛡️ **Immediate Safety Measures:**
1. **Move to Higher Ground:** Immediately move to the 2nd floor or roof if water enters your home.
2. **Kill Main Breaker:** Shut off main electrical switch. Electrocution from submerged wiring is a leading hazard.
3. **Do Not Walk in Moving Water:** Just 15 cm (6 inches) of moving water can knock an adult down.
4. **Never Drive Through Flooded Roads:** 30 cm (1 foot) of water can float small vehicles.

💡 **Survival Suggestions:**
- Fill bathtubs and clean bottles with tap water before municipal supply is compromised.
- Pack medication, IDs, power bank, and flashlight in a waterproof plastic bag.
- If trapped, signal from the roof using a bright cloth or whistle (3 short blasts for SOS).

📞 **Immediate Boat / Helicopter Extraction:** Call **112** or **1070**.`;
  }

  // 3. General Safety Measures & Precautions
  if (
    msg.includes("safety") ||
    msg.includes("measure") ||
    msg.includes("precaution") ||
    msg.includes("protect") ||
    msg.includes("rule") ||
    msg.includes("protocol")
  ) {
    return `🛡️ **Critical Disaster Safety Checklist:**

1. **Power & Gas Isolation:** Turn off mains switch and LPG cylinder valves before evacuating.
2. **Hydration & Food Safety:** Drink only boiled or bottled water. Discard any food that came into contact with floodwater.
3. **Emergency Signaling:** Keep a whistle and torch nearby. In emergency: 3 blasts or 3 light flashes signal **SOS**.
4. **Structural Caution:** Stay clear of cracked masonry, downed power lines, and saturated canal banks.
5. **Battery Conservation:** Switch smartphone to "Ultra Battery Saver Mode" and communicate via SMS/offline mesh radio instead of high-bandwidth video/voice.

📞 **All-India Disaster Helpline:** **112** | **State Disaster Control:** **1070**`;
  }

  // 4. Survival Suggestions, Go-Bag & Preparation
  if (
    msg.includes("suggest") ||
    msg.includes("tip") ||
    msg.includes("advice") ||
    msg.includes("kit") ||
    msg.includes("bag") ||
    msg.includes("pack") ||
    msg.includes("prepare")
  ) {
    return `💡 **Essential Disaster Survival Suggestions (72-Hour Go-Bag):**

🎒 **What to Pack Immediately:**
- **Water:** 2 liters per person per day.
- **Ready Food:** High-calorie energy bars, nuts, dry fruit, biscuits.
- **First Aid:** Antiseptic wipes, sterile gauze, band-aids, ORS packets, personal prescription drugs.
- **Tools:** Flashlight + spare batteries, loud whistle, multi-tool knife, power bank + cable.
- **Documents:** Aadhaar / ID card, insurance papers in sealed ziplock bags.

💧 **Water Purification Suggestion:**
If tap water is questionable, boil for at least 3 minutes, or add 2 drops of unscented household bleach per liter and wait 30 minutes before drinking.

📞 **Emergency Relief Distribution Center:** Central Relief Station Alpha (Marina Sector).`;
  }

  // 5. Fire, Chemical Leak & Smoke
  if (
    msg.includes("fire") ||
    msg.includes("smoke") ||
    msg.includes("gas") ||
    msg.includes("chemical") ||
    msg.includes("explosion") ||
    msg.includes("leak")
  ) {
    return `🔥 **Fire & Chemical Toxic Plume Safety Protocol:**

🛡️ **Immediate Safety Measures:**
1. **Stay Low Under Smoke:** Toxic smoke rises; crawl with nose 30–60 cm above floor where air is cleanest.
2. **Cover Airway:** Place a wet cotton cloth over mouth and nose to filter soot and solvent particulates.
3. **Evacuate Crosswind/Upwind:** If chemical or solvent fumes are detected, move perpendicular to the wind direction.
4. **Check Doors Before Opening:** Touch doorknobs with back of hand. If hot, DO NOT OPEN; seek alternative window or balcony.
5. **Never Use Elevators:** Always use emergency fire stairwells.

📞 **Fire & Rescue Emergency:** Dial **101** or **112** immediately.`;
  }

  // 6. Cyclone, Typhoon & High Winds
  if (
    msg.includes("cyclone") ||
    msg.includes("storm") ||
    msg.includes("wind") ||
    msg.includes("hurricane") ||
    msg.includes("typhoon")
  ) {
    return `🌀 **Severe Cyclone & Storm Surge Protocol:**

🛡️ **Immediate Safety Measures:**
1. **Secure Indoors:** Stay inside away from windows, skylights, and glass doors.
2. **Tape / Board Windows:** Protect against flying debris, which causes 70% of cyclone casualties.
3. **Beware the Eye of the Storm:** If winds suddenly calm, DO NOT go outside. The second half of the storm wall will follow with reversed winds.
4. **Unplug Appliances:** Disconnect all electronics to protect against severe power surges and lightning strikes.

📍 **Safe Evacuation Ridge:** Move inland toward Anna Salai / Guindy high grounds.

📞 **National Disaster Response Force (NDRF):** Dial **112** or **1070**.`;
  }

  // 7. Medical First Aid & Injuries
  if (
    msg.includes("medic") ||
    msg.includes("doctor") ||
    msg.includes("hospital") ||
    msg.includes("injur") ||
    msg.includes("bleed") ||
    msg.includes("burn") ||
    msg.includes("cpr")
  ) {
    return `🏥 **Emergency Medical First Aid Protocol:**

1. **Severe Bleeding:** Apply continuous firm direct pressure with clean cloth for 10 full minutes. Keep injured limb elevated above heart level.
2. **Burn Wounds:** Flush with cool clean water for 15 minutes. DO NOT apply ice, oil, or toothpaste. Cover loosely with sterile cloth.
3. **Hypothermia / Cold Shock:** Remove wet clothing, wrap patient in dry blankets, and elevate legs 30 cm.
4. **Fractures:** Immobilize joint above and below fracture using a rolled magazine or stick secured with cloth.

📍 **Emergency Medical Stations:**
- On-site Field Paramedics: Central Relief Station Alpha (Marina Sector).
- Nearest Trauma Center: Government General Hospital (GGH) Park Town (044-25309500).

📞 **Ambulance Emergency:** Dial **108** or **112**.`;
  }

  // 8. Rescue ETA & How to Coordinate
  if (
    msg.includes("how long") ||
    msg.includes("arrive") ||
    msg.includes("when will") ||
    msg.includes("eta") ||
    msg.includes("time") ||
    msg.includes("response")
  ) {
    return `⏱️ **Rescue Response Time & Dispatch Protocols:**

- **Average Urban Response Time:** 5 to 15 minutes for NDRF, SDRF, and 108 Emergency Medical units.
- **In Severe Waterlogging (>1.2m):** Amphibious craft (Zodiac boats) are deployed with transit windows of 12–25 minutes.

💡 **What You Must Do While Waiting:**
1. Dial **112** or **108** to confirm your exact Building number, Floor, and Landmark.
2. Hang a bright sheet or cloth out of the highest accessible window.
3. Keep your phone charged in power-saver mode for callback verification.
4. Do NOT attempt to wade into swift water on your own.`;
  }

  // 9. Emergency Helpline Numbers
  if (
    msg.includes("number") ||
    msg.includes("call") ||
    msg.includes("phone") ||
    msg.includes("contact") ||
    msg.includes("helpline")
  ) {
    return `📞 **Official Emergency Response Helplines:**

- **National Emergency Unified Service:** **112**
- **Medical Ambulance Service:** **108**
- **Tamil Nadu State Disaster Management (TNSDMA):** **1070**
- **District Disaster Emergency Operation Center:** **1077**
- **Fire & Rescue Services:** **101**
- **Greater Chennai Corporation Flood Control:** **1913**
- **Police Emergency:** **100**`;
  }

  // Default Sentinel Disaster Briefing
  return `🛡️ **Sentinel Emergency Disaster Guidance:**

📍 **Nearest Safe Haven:** Central Relief Station Alpha (800m inland from Marina Beach).
🚶 **Evacuation Route:** Westward inland corridor via Anna Salai high ground.
🌊 **Water Depth Alert:** Coastal Marina promenade is submerged (1.4m depth); avoid low-lying underpasses.
💡 **Key Safety Measure:** Disconnect mains electricity and stay on upper floors.

📞 **Immediate Life-Threatening Emergency:** Dial **112** or **108**.
Ask me about specific shelter locations, evacuation corridors, flood precautions, or first aid!`;
}

// =========================================================================
// POST Handler: Multi-Model AI Waterfall (Groq -> Gemini -> Semantic Engine)
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body.message || "";
    const language = body.language || "en";
    const role = body.role || "citizen";

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({
        reply: getSemanticFallbackReply(""),
        source: "fallback",
        status: "ready",
      });
    }

    const groqKey = process.env.GROQ_API_KEY?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    // List of reliable, verified models on Groq to attempt in sequence
    const groqCandidateModels = [
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "qwen/qwen3.6-27b",
      "groq/compound-mini",
    ];

    // -------------------------------------------------------------
    // Tier 1: Try Groq Ultra-Fast AI (Multi-Model Waterfall)
    // -------------------------------------------------------------
    if (groqKey && groqKey.startsWith("gsk_")) {
      for (const model of groqCandidateModels) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              max_tokens: 350,
              temperature: 0.3, // Lower temperature for factual, calm safety advice
              messages: [
                {
                  role: "system",
                  content: `${SYSTEM_PROMPT}\n${
                    role === "rescue"
                      ? "The user is an NDRF Search & Rescue responder. Provide tactical, concise, step-by-step SOPs, coordinates, and hazard standoff rules."
                      : "The user is a civilian. Provide calm, reassuring, highly practical life-saving steps, shelter coordinates, and survival suggestions."
                  }\n${
                    language === "hi"
                      ? "Respond in clear, natural Hindi."
                      : language === "ta"
                      ? "Respond in clear, natural Tamil."
                      : "Respond in clear, formatted English."
                  }`,
                },
                { role: "user", content: message },
              ],
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (groqRes.ok) {
            const data = await groqRes.json();
            const reply = data.choices?.[0]?.message?.content?.trim();
            if (reply && reply.length > 10) {
              return NextResponse.json({
                reply,
                source: "groq",
                model,
                status: "success",
              });
            }
          } else {
            const errText = await groqRes.text();
            console.warn(`[Chat API] Groq model ${model} failed (${groqRes.status}):`, errText);
          }
        } catch (groqErr: any) {
          console.warn(`[Chat API] Groq attempt ${model} error:`, groqErr?.message || groqErr);
        }
      }
    }

    // -------------------------------------------------------------
    // Tier 2: Try Google Gemini AI (Secondary Backup)
    // -------------------------------------------------------------
    if (geminiKey) {
      const geminiCandidateModels = ["gemini-3.6-flash", "gemini-flash-latest"];

      for (const gemModel of geminiCandidateModels) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6500);

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `${SYSTEM_PROMPT}\n\nUser Question: ${message}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  maxOutputTokens: 350,
                  temperature: 0.3,
                },
              }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (reply && reply.length > 10) {
              return NextResponse.json({
                reply,
                source: "gemini",
                model: gemModel,
                status: "success",
              });
            }
          } else {
            const errText = await geminiRes.text();
            console.warn(`[Chat API] Gemini model ${gemModel} failed (${geminiRes.status}):`, errText);
          }
        } catch (geminiErr: any) {
          console.warn(`[Chat API] Gemini attempt ${gemModel} error:`, geminiErr?.message || geminiErr);
        }
      }
    }

    // -------------------------------------------------------------
    // Tier 3: Context-Aware Offline Semantic Engine (Always Available)
    // -------------------------------------------------------------
    return NextResponse.json({
      reply: getSemanticFallbackReply(message),
      source: "fallback",
      offline: true,
      status: "fallback",
    });
  } catch (err: any) {
    console.error("[Chat API] Uncaught handler error:", err);
    return NextResponse.json({
      reply: getSemanticFallbackReply(""),
      source: "fallback",
      error: true,
    });
  }
}
