"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * RescueAIChatbot.tsx (Tactical Field AI Assistant & Alert Sentinel)
 * ==============================================================================
 * 
 * Features:
 * 1. Proactively alerts responders when Authority dispatches an emergency broadcast.
 * 2. Instant answers on Search & Rescue SOPs, extrication techniques, hazardous materials.
 * 3. Real Web Speech recognition (mic input) and Text-to-Speech synthesis.
 * 4. Powered by real Groq LLaMA 3.3 / Gemini AI with fallback redundancy.
 */

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Radio,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  LifeBuoy,
  Flame,
  Shield,
  Loader2,
  CheckCircle2
} from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isAlert?: boolean;
  source?: string;
  model?: string;
}

function formatInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedMessage({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("# ")) {
          return (
            <h3 key={i} className="font-bold text-sm text-amber-300 mt-1">
              {trimmed.replace(/^#\s*/, "")}
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h4 key={i} className="font-bold text-xs text-amber-200 mt-1">
              {trimmed.replace(/^##\s*/, "")}
            </h4>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h5 key={i} className="font-semibold text-xs text-slate-200 mt-0.5">
              {trimmed.replace(/^###\s*/, "")}
            </h5>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-1.5 pl-1">
              <span className="text-amber-400 mt-0.5">•</span>
              <span className="flex-1">{formatInline(trimmed.replace(/^[-*]\s*/, ""))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={i} className="flex items-start gap-1.5 pl-1">
              <span className="text-amber-400 font-mono text-[10px]">
                {trimmed.match(/^\d+\./)?.[0]}
              </span>
              <span className="flex-1">{formatInline(trimmed.replace(/^\d+\.\s*/, ""))}</span>
            </div>
          );
        }
        if (!trimmed) {
          return <div key={i} className="h-1" />;
        }
        return <p key={i}>{formatInline(line)}</p>;
      })}
    </div>
  );
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "init-1",
    sender: "bot",
    text: "NDRF Tactical AI Field Assistant online. VHF Channel 7 linked. Ready to assist with hazardous material standoff perimeters, swiftwater rescue SOPs, and casualty triage.",
    timestamp: "12:00",
    source: "groq",
  },
];

export function RescueAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [isOfflineSimulation, setIsOfflineSimulation] = useState(false);
  const [latestAlert, setLatestAlert] = useState<any>(null);
  const [hasUnreadAlert, setHasUnreadAlert] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Monitor latest authority alerts
  useEffect(() => {
    const checkAlert = () => {
      try {
        const item = localStorage.getItem("latest_public_emergency_alert");
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed && (!latestAlert || parsed.id !== latestAlert.id)) {
            setLatestAlert(parsed);
            setHasUnreadAlert(true);
            
            // Insert proactive alert notification in chat feed
            const alertMsg: ChatMessage = {
              id: `alert-${Date.now()}`,
              sender: "bot",
              text: `🚨 PRIORITY DISPATCH FROM AUTHORITY HQ:\n[${parsed.title}]\nTarget Sector: ${parsed.zone || "Operational Area"}\nStatus: ${parsed.status || "ACTIVE CRISIS"}\nEvacuation: ${parsed.evacuationCorridor || "Inland corridors"}\nSquad Order: ${parsed.allocatedSquads || "NDRF Squad Alpha mobilized"}.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              isAlert: true,
            };

            setMessages((prev) => [...prev, alertMsg]);
            toast.warning("🚨 Tactical AI Alert", {
              description: `New Authority dispatch received: ${parsed.title}`,
            });
          }
        }
      } catch (e) {}
    };

    checkAlert();
    window.addEventListener("storage", checkAlert);
    const interval = setInterval(checkAlert, 3000);
    return () => {
      window.removeEventListener("storage", checkAlert);
      clearInterval(interval);
    };
  }, [latestAlert]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Voice recognition setup
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
          setInput(transcript);
          setListening(false);
          handleSend(transcript);
        };

        recognition.onerror = () => {
          setListening(false);
        };

        recognition.onend = () => {
          setListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.info("Speech recognition not supported on this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
        toast.info("Listening for tactical field command...");
      } catch (e) {
        setListening(false);
      }
    }
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`[\]()]/g, "").slice(0, 200);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  const handleSend = async (userText?: string) => {
    const query = userText || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "rescue",
          message: query.trim(),
          language: "en",
          simulate_offline: isOfflineSimulation,
        }),
      });

      const data = await res.json();
      const botReply = data.reply || "Tactical communication acknowledgment. Maintain standard safety standoff.";

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botReply,
        source: data.source || (isOfflineSimulation ? "offline_simulated" : "groq"),
        model: data.model,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(botReply);
    } catch (e) {
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: "Tactical radio link degraded. Standard SOP: Maintain high ground, do not enter electrified standing water, and coordinate with squad lead via VHF Channel 4.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "fallback",
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Tactical Copilot Launcher Button */}
      <div className="fixed bottom-20 right-6 z-40">
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setHasUnreadAlert(false);
          }}
          className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl transition-all active:scale-95 ${
            hasUnreadAlert
              ? "bg-red-600 border-red-400 text-white animate-bounce shadow-red-600/50"
              : "bg-gradient-to-r from-amber-600 to-amber-500 border-amber-400 text-white shadow-amber-600/30 hover:from-amber-500 hover:to-amber-400"
          }`}
        >
          <div className="relative">
            <Radio className="w-5 h-5 text-white animate-pulse" />
            {hasUnreadAlert && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping" />
            )}
          </div>
          <div className="text-left">
            <div className="text-[10px] font-mono uppercase font-bold tracking-wider opacity-90">
              NDRF SQUAD COPILOT
            </div>
            <div className="text-xs font-bold leading-tight">
              {hasUnreadAlert ? "1 Urgent Broadcast" : "Tactical AI Assistant"}
            </div>
          </div>
        </button>
      </div>

      {/* Floating Tactical Chat Window */}
      {isOpen && (
        <div className="fixed bottom-36 right-6 z-50 w-84 sm:w-96 max-h-[580px] h-[520px] rounded-2xl border border-amber-500/30 bg-[#0B1120]/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden font-ibm-sans animate-slide-up">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-amber-500/20 bg-amber-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  Tactical Rescue Sentinel
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  {isOfflineSimulation ? "Offline Local Edge Model" : "Groq Ultra LPU Inference"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Interactive Offline AI Simulation Toggle */}
              <button
                onClick={() => {
                  const nextVal = !isOfflineSimulation;
                  setIsOfflineSimulation(nextVal);
                  toast.info(nextVal ? "Simulate Offline AI: ACTIVE" : "Groq Live Cloud AI: ACTIVE", {
                    description: nextVal
                      ? "Zero cellular connection simulated. Running on-device edge model inference."
                      : "Connected to live Groq LPU cluster.",
                  });
                }}
                title="Toggle Offline AI Simulation"
                className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold transition flex items-center gap-1 ${
                  isOfflineSimulation
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-blue-500/20 border-blue-500/40 text-blue-300"
                }`}
              >
                <span>{isOfflineSimulation ? "🟢 OFFLINE" : "⚡ LIVE"}</span>
              </button>

              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? "Mute Voice Audio" : "Enable Voice Audio"}
                className={`p-1.5 rounded-lg border transition ${
                  voiceEnabled
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-white/[0.04] border-white/[0.08] text-slate-400"
                }`}
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.08]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Broadcast Alert Banner if present */}
          {latestAlert && (
            <div className="bg-red-950/40 border-b border-red-500/30 p-2.5 px-3 flex items-start gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold text-red-300 uppercase font-mono text-[10px]">
                  ACTIVE DISPATCH: {latestAlert.title}
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                  {latestAlert.situationReport}
                </p>
              </div>
            </div>
          )}

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                    msg.isAlert
                      ? "bg-red-950/40 border border-red-500/40 text-red-100 shadow-md"
                      : msg.sender === "user"
                      ? "bg-amber-600 text-white rounded-br-none font-medium"
                      : "bg-white/[0.05] border border-white/[0.08] text-slate-200 rounded-bl-none"
                  }`}
                >
                  <FormattedMessage text={msg.text} />
                </div>
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[9px] font-mono text-slate-500">
                    {msg.timestamp}
                  </span>
                  {msg.sender === "bot" && (
                    <span className="text-[9px] font-mono text-slate-400 flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          msg.source === "offline_simulated"
                            ? "bg-emerald-400"
                            : "bg-blue-400"
                        }`}
                      />
                      {msg.source === "offline_simulated"
                        ? "Offline Edge (0ms Net)"
                        : "Groq LPU"}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono p-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {isOfflineSimulation
                    ? "Evaluating on-device local LPU SOP..."
                    : "Querying Groq Tactical LPU..."}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Tactical Prompt Chips */}
          <div className="p-2 border-t border-white/[0.06] bg-black/20 flex gap-1.5 overflow-x-auto text-[10px] font-mono">
            {[
              "Swiftwater extraction SOP",
              "Transformer 50m safe standoff",
              "Mass casualty triage codes",
              "Alternative high-ground route",
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-slate-200 whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-white/[0.08] bg-[#0B1120] flex items-center gap-2">
            <button
              onClick={toggleListening}
              className={`p-2 rounded-xl border transition ${
                listening
                  ? "bg-red-500 text-white border-red-400 animate-pulse"
                  : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200"
              }`}
              title="Voice Input (Push to Talk)"
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask tactical SOP or report situation..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
}
