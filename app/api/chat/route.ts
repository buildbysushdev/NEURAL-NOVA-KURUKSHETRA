import { NextRequest, NextResponse } from "next/server";

// =========================================================================
// KURUKSHETRA PS20: AGENTIC DISASTER RELIEF
// High-Accuracy Sentinel AI Chatbot with Groq + Gemini + Offline Redundancy
// FILE: app/api/chat/route.ts
// =========================================================================

const SYSTEM_PROMPT = `You are Sentinel, an AI emergency disaster relief and citizen safety assistant operating in Chennai and Tamil Nadu, India.
Your mission is to provide accurate, calm, life-saving, and helpful guidance to citizens during crises.

Guidelines:
1. If the user asks general, casual, or cooking questions (e.g., "how to make maggi", jokes, casual chat):
   - Give a brief, friendly, helpful 1-2 sentence response.
   - Gently remind them to stay safe and that you are here to assist with disaster relief and emergency guidance.
2. If the user asks about emergency response times (e.g., "how long will authorities take to arrive"):
   - Explain that response times typically range from 5 to 15 minutes in urban areas for SDRF, NDRF, and 108 Ambulance teams.
   - Urgently advise them to dial 112 or 108 immediately to provide their exact GPS location and landmark.
   - Provide safe precautions to take while waiting (staying on high ground, keeping phone battery saved).
3. Specific Chennai disaster relief ground facts:
   - Nearest Relief Shelter: Central Relief Station Alpha (800m inland from Marina Beach), Royapettah Relief Post (1.2km), Saidapet Community Hall (2.1km).
   - Safe Evacuation Route: Move west inland via Anna Salai corridor. Avoid low-lying coastal paths and waterlogged underpasses.
   - Critical Emergency Numbers: National Emergency: 112 | Ambulance: 108 | TN SDMA Disaster Control: 1070 | Fire: 101 | Police: 100.
   - Relief Supplies: Ration kits, clean drinking water, and medical aid are distributed at Central Relief Station Alpha.

Keep responses concise, clear, and easy to read on mobile screens (2 to 4 sentences or bullet points).`;

// Context-aware offline fallback if all AI APIs are unreachable
function getSemanticFallbackReply(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes("maggi") || msg.includes("cook") || msg.includes("recipe") || msg.includes("food to make")) {
    return "🍜 Quick recipe: Boil 1.5 cups water, add Maggi noodles & tastemaker, cook for 2 minutes while stirring! Keep kitchen areas safe during severe weather. For emergency food rations, visit Central Relief Station Alpha (800m from Marina).";
  }

  if (msg.includes("how long") || msg.includes("arrive") || msg.includes("when will") || msg.includes("eta") || msg.includes("time")) {
    return "⏱️ Emergency responders (NDRF / SDRF / 108 Ambulance) typically reach urban locations within 5–15 minutes. Call **112** or **108** right away with your exact address or GPS pin. Stay on high ground with your phone charged while help is en route.";
  }

  if (msg.includes("shelter") || msg.includes("camp") || msg.includes("safe place") || msg.includes("refuge") || msg.includes("stay")) {
    return "🏠 **Nearest Shelters in Chennai:**\n1. Central Relief Station Alpha (800m inland from Marina Beach)\n2. Royapettah Relief Post (1.2km)\n3. Saidapet Community Hall (2.1km)\nAll locations have clean drinking water, hot rations, and paramedic medical aid.";
  }

  if (msg.includes("flood") || msg.includes("water") || msg.includes("rain") || msg.includes("drown") || msg.includes("submerged")) {
    return "🌊 **Flood Safety Protocol:**\n- Move to an upper floor or elevated structure immediately.\n- Never walk or drive through moving water (just 15cm can sweep you off your feet).\n- Switch off main electrical breakers.\n- If trapped, call **112** or **1070** and signal with a flashlight or bright cloth.";
  }

  if (msg.includes("evacuat") || msg.includes("route") || msg.includes("leave") || msg.includes("escape") || msg.includes("exit")) {
    return "🚶 **Safe Evacuation Corridor:**\nHead inland westward via **Anna Salai**. Dedicated evacuation transit shuttles depart every 20 minutes from Marina Central Station. Carry government ID, essential medicines, and emergency supply kit.";
  }

  if (msg.includes("doctor") || msg.includes("medic") || msg.includes("hospital") || msg.includes("injur") || msg.includes("bleed") || msg.includes("hurt")) {
    return "🏥 **Medical Emergency Assistance:**\n- For life-threatening injuries, call **108** or **112** for ambulance dispatch.\n- On-site NDRF medical team is stationed at Marina Central Station.\n- Government General Hospital emergency line: 044-25309500.";
  }

  if (msg.includes("food") || msg.includes("water") || msg.includes("ration") || msg.includes("hunger") || msg.includes("eat")) {
    return "🍱 **Relief Supply Distribution:**\n3,000+ hot meal and ration packs are actively distributed at Central Relief Station Alpha (7:00 AM – 8:00 PM daily). Safe bottled water is available at all relief camps.";
  }

  if (msg.includes("number") || msg.includes("call") || msg.includes("phone") || msg.includes("contact") || msg.includes("helpline")) {
    return "📞 **Essential Emergency Helplines:**\n- National Emergency: **112**\n- Ambulance: **108**\n- TN SDMA Disaster Control: **1070**\n- Fire & Rescue: **101**\n- Police: **100**\n- Chennai Corp Flood Control: **1913**";
  }

  return "🛡️ **Sentinel Safety Guide:**\nFor immediate emergency assistance, dial **112** or **108**.\n- Nearest Shelter: Central Relief Station Alpha (800m inland from Marina).\n- Safe Corridor: Anna Salai inland route.\nYou can ask me about shelter locations, evacuation routes, flood precautions, or medical help!";
}

export async function POST(req: NextRequest) {
  try {
    const { message, language = "en" } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({
        reply: getSemanticFallbackReply(""),
        source: "fallback",
      });
    }

    const groqKey = process.env.GROQ_API_KEY?.trim();
    const groqModel = process.env.GROQ_MODEL?.trim() || "groq/compound-mini";
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

    // -------------------------------------------------------------
    // Tier 1: Try Groq AI (Ultra-fast LLM Inference)
    // -------------------------------------------------------------
    if (groqKey && groqKey.startsWith("gsk_")) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: groqModel,
            max_tokens: 300,
            temperature: 0.5,
            messages: [
              {
                role: "system",
                content: `${SYSTEM_PROMPT}\n${
                  language === "hi"
                    ? "Respond in natural Hindi."
                    : language === "ta"
                    ? "Respond in natural Tamil."
                    : "Respond in clear English."
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
          if (reply && reply.length > 5) {
            return NextResponse.json({
              reply,
              source: "groq",
              model: groqModel,
            });
          }
        } else {
          const errText = await groqRes.text();
          console.warn(`[Chat API] Groq error ${groqRes.status}:`, errText);
        }
      } catch (groqErr: any) {
        console.warn("[Chat API] Groq call failed or timed out:", groqErr?.message || groqErr);
      }
    }

    // -------------------------------------------------------------
    // Tier 2: Try Google Gemini AI (Secondary Backup)
    // -------------------------------------------------------------
    if (geminiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
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
                maxOutputTokens: 300,
                temperature: 0.5,
              },
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply && reply.length > 5) {
            return NextResponse.json({
              reply,
              source: "gemini",
              model: geminiModel,
            });
          }
        } else {
          const errText = await geminiRes.text();
          console.warn(`[Chat API] Gemini error ${geminiRes.status}:`, errText);
        }
      } catch (geminiErr: any) {
        console.warn("[Chat API] Gemini call failed:", geminiErr?.message || geminiErr);
      }
    }

    // -------------------------------------------------------------
    // Tier 3: Context-Aware Offline Semantic Engine
    // -------------------------------------------------------------
    return NextResponse.json({
      reply: getSemanticFallbackReply(message),
      source: "fallback",
      offline: true,
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
