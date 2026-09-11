import { NextRequest, NextResponse } from "next/server";

// Bulletproof citizen chatbot API
// Uses Groq LLaMA 3 with a smart fallback if API key is missing/invalid

const FALLBACK_RESPONSES: Record<string, string> = {
  shelter:
    "🏠 Nearest shelter: **Central Relief Station Alpha** — 800m inland from Marina Beach. Also available: Royapettah Relief Post (1.2km), Saidapet Community Hall (2.1km). All have food, water, and medical staff.",
  flood:
    "🌊 Flood safety: Move to higher ground immediately. Avoid walking in floodwater (even 6 inches can knock you over). Turn off electricity at the breaker. Call 112 if trapped. Do NOT drive through flooded roads.",
  safe:
    "📍 Your area (Marina Waterfront Sector B) has a **CRITICAL** storm surge warning. Water level: 2.4m. Recommended action: Evacuate west via Kamaraj Salai toward Anna Salai. Avoid low-lying coastal paths.",
  evacuate:
    "🚶 Evacuation route: Head inland via Anna Salai (marked green in the app map). Evacuation buses run every 20 min from Marina Central Station. Carry ID, medicines, and 3-day food supply.",
  food:
    "🍱 Relief supplies: 3,000 ration packs at Central Relief Station Alpha. Distribution: 7AM–7PM daily. Token system — register at the station entrance.",
  medical:
    "🏥 Medical aid: NDRF medical team at Marina Central Station. Government General Hospital emergency line: 044-25309500. For critical emergencies: 108 (ambulance).",
  number:
    "📞 Emergency contacts: National Emergency: **112** | NDRF: **011-24363260** | SDMA Tamil Nadu: **1070** | Ambulance: **108** | Fire: **101** | Police: **100**",
  default:
    "🛡️ For immediate emergencies, dial **112**. Nearest shelter: Central Relief Station Alpha (800m from Marina). Safe evacuation route: Anna Salai inland corridor. Stay away from flooded areas.",
};

function getFallbackReply(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("shelter") || msg.includes("safe haven") || msg.includes("camp"))
    return FALLBACK_RESPONSES.shelter;
  if (msg.includes("flood") || msg.includes("water") || msg.includes("surge"))
    return FALLBACK_RESPONSES.flood;
  if (msg.includes("safe") || msg.includes("danger") || msg.includes("area"))
    return FALLBACK_RESPONSES.safe;
  if (msg.includes("evacuate") || msg.includes("leave") || msg.includes("route") || msg.includes("escape"))
    return FALLBACK_RESPONSES.evacuate;
  if (msg.includes("food") || msg.includes("ration") || msg.includes("supply"))
    return FALLBACK_RESPONSES.food;
  if (msg.includes("medical") || msg.includes("hospital") || msg.includes("doctor") || msg.includes("medicine"))
    return FALLBACK_RESPONSES.medical;
  if (msg.includes("number") || msg.includes("call") || msg.includes("contact") || msg.includes("helpline"))
    return FALLBACK_RESPONSES.number;
  return FALLBACK_RESPONSES.default;
}

export async function POST(req: NextRequest) {
  try {
    const { message, language = "en" } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ reply: FALLBACK_RESPONSES.default });
    }

    const apiKey = process.env.GROQ_API_KEY;

    // Try Groq first
    if (apiKey && apiKey.startsWith("gsk_")) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            max_tokens: 180,
            temperature: 0.4,
            messages: [
              {
                role: "system",
                content: `You are a calm, helpful emergency safety assistant for Chennai citizens during a disaster. 
Give short, actionable answers in 2-3 sentences maximum. Be specific with locations and numbers.
Key facts: Nearest shelter = Central Relief Station Alpha (800m inland from Marina Beach). Safe route = Anna Salai inland corridor. Emergency = 112. SDMA radio = 1070.
${language === "hi" ? "Respond in Hindi." : "Respond in English."}`,
              },
              {
                role: "user",
                content: message,
              },
            ],
          }),
          signal: AbortSignal.timeout(4000),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply && reply.length > 5) {
            return NextResponse.json({ reply, source: "groq" });
          }
        }
      } catch (groqErr) {
        console.warn("[Chat API] Groq failed, using fallback:", groqErr);
      }
    }

    // Smart fallback — always works
    return NextResponse.json({
      reply: getFallbackReply(message),
      source: "fallback",
    });
  } catch (err: any) {
    console.error("[Chat API] Error:", err);
    return NextResponse.json({
      reply: FALLBACK_RESPONSES.default,
      source: "fallback",
    });
  }
}
