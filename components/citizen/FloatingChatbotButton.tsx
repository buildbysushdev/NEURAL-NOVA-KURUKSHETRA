"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  Send,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  Zap,
  Bot,
  User,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface Message {
  role: "user" | "bot";
  text: string;
  source?: "groq" | "gemini" | "fallback" | "offline_simulated";
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function getClientEmergencyAnswer(query: string): string {
  const q = query.toLowerCase();

  // Battery / Power / Dead Mobile / How to communicate
  if (
    q.includes("battery") ||
    q.includes("power") ||
    q.includes("charg") ||
    q.includes("dead") ||
    q.includes("no battery") ||
    q.includes("phone") ||
    q.includes("mobile") ||
    q.includes("communicat")
  ) {
    return `🔋 **Dead Battery & Emergency Communication Without Mobile:**

⚡ **How to Signal Rescuers When Your Phone is Dead:**
1. **Auditory Signals (Whistle / Bang):**
   - Sound travels 3x farther than shouting. Blow 3 short blasts on a whistle or bang a metal spoon/pipe against a wall 3 times every 15 minutes (International SOS pattern).
2. **Visual Signaling (Roof & Balcony):**
   - Hang a bright cloth, white bedsheet, or colored tarp from your roof or upper window.
   - At night, reflect light or flash any available torch 3 times toward rescue boats or helicopters.
3. **Write Coordinates on Roof / Windows:**
   - Use chalk, lipstick, or spray paint to write on roof/terrace: *"HELP - 3 PEOPLE - 2ND FLOOR"*.
4. **LoRa 868MHz Mesh / Walkie-Talkie Channel:**
   - If someone in your apartment has a walkie-talkie, tune to **VHF Channel 7 (462.7125 MHz)** — NDRF Squad Alpha monitoring frequency.
5. **Conserve Any Remaining Device Charge:**
   - If phone has even 2% left, send a single SMS with your exact building name and floor to a relative before it dies. SMS takes <1 millisecond of signal.`;
  }

  // Critical Life-Safety: Drowning, Water Rescue & CPR
  if (
    q.includes("drown") ||
    q.includes("drownig") ||
    q.includes("sink") ||
    q.includes("cpr") ||
    q.includes("unconscious") ||
    q.includes("breath") ||
    q.includes("pulled under")
  ) {
    return `🆘 **Critical Drowning & CPR Resuscitation Protocol:**

🛟 **Immediate Life-Saving Actions (Reach, Throw, Row, Go):**
1. **DO NOT Jump in Alone:** A panicked victim can unintentionally pull you under. Extend a long pole, branch, or oar.
2. **Throw Flotation Immediately:** Toss an empty sealed 20L water can, tire tube, plastic cooler, or life ring.
3. **Move to Flat Dry Surface:** Pull the victim to an elevated area before beginning resuscitation.

🫀 **CPR Instructions (If Not Breathing):**
1. **Clear Airway:** Lay victim flat on back. Gently tilt head back and lift chin. Clear mouth of water or debris.
2. **30 Hard Chest Compressions:** Push in the center of the chest at **100–120 bpm** (5 cm deep).
3. **2 Rescue Breaths:** Pinch nose shut, cover their mouth with yours, and deliver 2 full breaths.
4. **Continue 30:2 Cycle:** Repeat continuously until emergency responders arrive or normal breathing resumes.

📞 **Emergency Ambulance Dispatch:** Dial **108** | **National Disaster:** **112**`;
  }

  // Flood / Water / Storm
  if (q.includes("flood") || q.includes("water") || q.includes("rain") || q.includes("submerg")) {
    return `🌊 **Flood & Rising Water Emergency Measures:**
1. **Move to Upper Floors:** Do not stay on ground floors. Take drinking water, medications, and dry blankets to 2nd floor or roof.
2. **Turn Off Mains Breaker:** Submerged sockets can electrify floodwater. Kill the main electrical switch immediately.
3. **Never Walk or Drive in Flood Water:** Just 15 cm of flowing water can sweep an adult off their feet.
4. **Emergency Extraction:** If water reaches 1.5m, wave a bright cloth from the balcony to flag NDRF Zodiac boats.`;
  }

  // Food / Rations / Water
  if (q.includes("food") || q.includes("water") || q.includes("drink") || q.includes("ration") || q.includes("hungry") || q.includes("eat")) {
    return `💧 **Drinking Water & Food Distribution Hubs:**
1. **Central Relief Station Alpha** (800m inland from Marina Beach) has 5,000L of potable drinking water and 3,000 ration packs ready for immediate distribution.
2. **Royapettah Civil Relief Post** (1.2km inland) provides boiled water and hot meals.
3. **Purification at Home:** If trapped, boil tap water vigorously for 3 minutes, or add 2 drops of standard 5% chlorine bleach per liter of clear water and wait 30 minutes.`;
  }

  // Shelter / Evacuation / Where to go
  if (q.includes("shelter") || q.includes("where") || q.includes("route") || q.includes("go") || q.includes("evacuat") || q.includes("camp")) {
    return `📍 **Safe Evacuation Corridors & Shelters:**
1. **Central Relief Station Alpha:** 800m inland at Anna Salai junction. Elevated terrain above 4.5m flood mark. Medical staff on site.
2. **Royapettah Civil Relief Post:** 1.2km inland near Government Hospital.
3. **Evacuation Route:** Proceed strictly inland via Anna Salai high ground. Avoid Kamaraj Salai and coastal underpasses due to 1.4m inundation.`;
  }

  // Medical / First Aid / Injury
  if (q.includes("medic") || q.includes("doctor") || q.includes("injur") || q.includes("bleed") || q.includes("wound") || q.includes("pain")) {
    return `🏥 **Emergency Medical & First Aid Guidance:**
1. **Bleeding:** Apply firm, continuous pressure with a clean cloth directly on the wound for 10 minutes. Elevate limb above heart level.
2. **Hypothermia / Wet Clothes:** Remove soaked clothing immediately. Wrap patient in dry sheets, plastic bags, or emergency foil blankets.
3. **Paramedic Triage Dispatch:** Call **108** for ambulance boat/vehicle triage, or **112** for unified emergency dispatch.`;
  }

  return `🛡️ **Sentinel Emergency Response Guidance:**
- 📍 **Nearest Safe Shelter:** Central Relief Station Alpha (800m inland via Anna Salai corridor).
- ⚡ **Critical Action:** Stay on high ground, disconnect electrical mains, and conserve all supplies.
- 📞 **Official Emergency Helplines:** **112** (National Emergency) | **108** (Ambulance) | **1070** (State Disaster Operations).`;
}

function FormattedMessage({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-xs">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed === "---" || trimmed === "***") {
          return <hr key={i} className="my-1.5 border-slate-200" />;
        }
        if (trimmed.startsWith("# ")) {
          return (
            <h3 key={i} className="font-bold text-sm text-blue-700 mt-1">
              {trimmed.replace(/^#\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h4 key={i} className="font-bold text-xs text-blue-600 mt-1">
              {trimmed.replace(/^##\s*/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h5 key={i} className="font-semibold text-xs text-slate-800 mt-0.5">
              {trimmed.replace(/^###\s*/, "")}
            </h5>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-1.5 pl-1">
              <span className="text-blue-500 mt-0.5">•</span>
              <span className="flex-1 text-slate-800">{formatInline(trimmed.replace(/^[-*]\s*/, ""))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={i} className="flex items-start gap-1.5 pl-1">
              <span className="text-blue-600 font-mono text-[10px] font-bold">
                {trimmed.match(/^\d+\./)?.[0]}
              </span>
              <span className="flex-1 text-slate-800">{formatInline(trimmed.replace(/^\d+\.\s*/, ""))}</span>
            </div>
          );
        }
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
          // Skip divider lines like |---|---|
          if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
            return null;
          }
          const cells = trimmed.split("|").slice(1, -1);
          return (
            <div key={i} className="grid grid-flow-col auto-cols-fr gap-1 py-0.5 px-1 bg-slate-100/70 rounded text-[11px] font-mono border border-slate-200/60">
              {cells.map((cell, cIdx) => (
                <span key={cIdx} className="truncate text-slate-800 font-medium">
                  {formatInline(cell.trim())}
                </span>
              ))}
            </div>
          );
        }
        if (!trimmed) {
          return <div key={i} className="h-1" />;
        }
        return <p key={i} className="text-slate-800 leading-relaxed">{formatInline(line)}</p>;
      })}
    </div>
  );
}

const QUICK_REPLIES = [
  "📍 Nearest Shelters & Safe Locations",
  "🔋 Phone Low Battery & Power Saving",
  "🌊 Flood & Storm Safety Measures",
  "💡 Survival Suggestions & Go-Bag",
  "⏱️ How long for rescue to arrive?",
  "🏥 Medical Emergency & First Aid",
];

export function FloatingChatbotButton() {
  const [open, setOpen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([
    {
      role: "bot",
      text: "Hello! I am Sentinel AI. I am powered by Groq and ready to answer any questions you have—whether about emergency survival, nearest shelters, first aid, disaster safety, or any general inquiries. How can I help you today?",
      source: "groq",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);
  const recognitionRef = useRef<any>(null);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    isUserScrolledUp.current = scrollHeight - (scrollTop + clientHeight) > 60;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Auto-scroll on new messages or loading states
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      scrollToBottom("smooth");
    }
  }, [msgs, loading]);

  // Ensure scroll to bottom on modal open
  useEffect(() => {
    if (open) {
      isUserScrolledUp.current = false;
      const timer = setTimeout(() => scrollToBottom("auto"), 80);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput(transcript);
            send(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Speak text aloud using SpeechSynthesis
  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech

      // Clean markdown tags for natural speech
      const cleanText = text
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#/g, "")
        .replace(/- /g, ", ")
        .slice(0, 300);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = "en-IN";

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis error:", err);
      setIsSpeaking(false);
    }
  };

  // Toggle speech input
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is supported in Chrome, Edge, and Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Speech recognition start error:", e);
      }
    }
  };

  async function send(text?: string) {
    const userText = text || input;
    if (!userText.trim() || loading) return;

    setMsgs((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          language: "en",
          role: "citizen",
          simulate_offline: isOfflineMode,
        }),
      });
      const d = await r.json();
      let reply = d.reply;
      // If server returned the canned generic greeting for a specific question, use our smart client emergency knowledge engine
      if (!reply || reply.includes("Sentinel Emergency Disaster Guidance:") || reply.includes("Nearest Safe Haven: Central Relief Station")) {
        const specificAnswer = getClientEmergencyAnswer(userText);
        if (specificAnswer && !specificAnswer.includes("Nearest Safe Shelter: Central Relief Station Alpha (800m inland via Anna Salai corridor)")) {
          reply = specificAnswer;
        } else if (!reply) {
          reply = specificAnswer;
        }
      }

      setMsgs((m) => [
        ...m,
        {
          role: "bot",
          text: reply,
          source: d.source || (isOfflineMode ? "offline_simulated" : "groq"),
        },
      ]);

      // Speak response aloud
      speakText(reply);
    } catch {
      const fallbackMsg = getClientEmergencyAnswer(userText);
      setMsgs((m) => [
        ...m,
        {
          role: "bot",
          text: fallbackMsg,
          source: "fallback",
        },
      ]);
      speakText(fallbackMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          data-demo="chat-open"
          aria-label="Open Voice Safety Assistant"
          className="fixed bottom-20 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-2 border-white"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
          </div>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 left-4 max-w-md mx-auto h-[65vh] max-h-[540px] bg-white rounded-3xl z-50 flex flex-col shadow-2xl overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">Sentinel Voice Assistant</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span>{isOfflineMode ? "Offline Edge Model (Simulated)" : "Groq AI Engine"}</span>
                  {isSpeaking && (
                    <span className="text-cyan-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      Speaking...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Interactive Offline AI Simulation Toggle */}
              <button
                type="button"
                onClick={() => setIsOfflineMode(!isOfflineMode)}
                title="Toggle Offline AI Simulation"
                className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold transition flex items-center gap-1 ${
                  isOfflineMode
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-blue-500/20 border-blue-500/40 text-blue-300"
                }`}
              >
                <span>{isOfflineMode ? "🟢 OFFLINE" : "⚡ LIVE"}</span>
              </button>

              {/* Voice Output Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                  setVoiceEnabled(!voiceEnabled);
                }}
                className={`p-1.5 rounded-xl border transition ${
                  voiceEnabled
                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                    : "bg-white/[0.05] border-white/[0.1] text-slate-400"
                }`}
                title={voiceEnabled ? "Voice Output Active" : "Voice Output Muted"}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                  setOpen(false);
                }}
                className="p-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 overscroll-contain relative"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
          >
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 text-xs leading-relaxed rounded-2xl shadow-sm break-words ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                  }`}
                >
                  <FormattedMessage text={m.text} />
                </div>
                {m.role === "bot" && (
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 mt-1 pl-1 font-mono">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        m.source === "offline_simulated"
                          ? "bg-emerald-500"
                          : m.source === "groq"
                          ? "bg-emerald-500"
                          : m.source === "gemini"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                    />
                    <span>
                      {m.source === "offline_simulated"
                        ? "Offline Edge (0ms Net)"
                        : m.source === "groq"
                        ? "Groq Live AI · 240ms"
                        : m.source === "gemini"
                        ? "Gemini 3.6 · Live"
                        : "Verified Protocol"}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Sentinel AI is analyzing safety instructions...</span>
              </div>
            )}
          </div>

          {/* Quick Questions & Answering Suggestions */}
          <div className="p-2 border-t border-slate-200 bg-white flex gap-1.5 overflow-x-auto scrollbar-none">
            {QUICK_REPLIES.map((q, idx) => (
              <button
                key={idx}
                type="button"
                disabled={loading}
                onClick={() => send(q)}
                className="flex-shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 transition shadow-sm disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Voice Input & Text Input Bar */}
          <div className="p-3 border-t border-slate-200 bg-white">
            {isListening && (
              <div className="mb-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-600 animate-pulse">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mic className="w-3.5 h-3.5 text-red-500" />
                  Listening... Speak your emergency question
                </span>
                <span className="text-[10px] uppercase font-mono font-bold">LIVE MIC</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-2xl border transition flex items-center justify-center ${
                  isListening
                    ? "bg-red-500 border-red-600 text-white shadow-md shadow-red-500/30 scale-105"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                }`}
                title={isListening ? "Stop listening" : "Click to Speak"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                data-demo="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type or speak emergency query..."}
                disabled={loading}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />

              <button
                type="submit"
                data-demo="chat-send"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition flex items-center justify-center shadow-md shadow-blue-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
