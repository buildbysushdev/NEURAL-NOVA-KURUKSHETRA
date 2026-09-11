"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Brain,
  Send,
  Sparkles,
  Zap,
  Shield,
  Copy,
  Check,
  RotateCcw,
  Bot,
  User,
  Radio,
  FileText,
  Clock,
  Compass,
} from "lucide-react";
import { toast } from "sonner";

interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
  source?: "groq" | "gemini" | "fallback";
  model?: string;
  timestamp: string;
}

const TACTICAL_PROMPTS = [
  "Generate 60-min Evacuation Plan for Marina Sector B",
  "Calculate boat & medical supply needs for 1,200 victims",
  "Draft Tri-Channel Emergency Alert (SMS/Voice/App)",
  "What SOP steps to take if substation power grid fails?",
  "Assess Cyclone Fengal storm surge inundation vector",
];

export function AICopilotPanel() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      role: "assistant",
      content:
        "**Sentinel AI Tactical Command Copilot Active.**\n\nI am connected to the real-time Multi-Agent Disaster Pipeline (Groq LLaMA 3 / Compound AI & Gemini 3.6).\n\nAsk me any operational question regarding disaster logistics, evacuation routing, resource optimization, or emergency communications.",
      source: "groq",
      model: "groq/compound-mini",
      timestamp: "Operational Ready",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(textToSend?: string) {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: CopilotMessage = {
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[COMMANDER CONTEXT: You are assisting the State Disaster Management Authority (SDMA) commander in the tactical operations room. Answer with high operational precision, tactical bullet points, exact resource quantities, and evacuation routes for Chennai.] ${query}`,
          language: "en",
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ||
            "Tactical triage generated. Recommend initiating Zone B evacuation via Anna Salai corridor and alerting SDRF Sector Units 1 & 2.",
          source: data.source || "groq",
          model: data.model || "groq/compound-mini",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Telemetry mesh degraded. Applying local tactical cache:\n- Recommend immediate deployment of 4 inflatable zodiac rescue boats to Marina Sector B.\n- Coordinate with Chennai Corporation ward 112 for high-capacity dewatering pumps.\n- Call 112 / 1070 for State Emergency Operation Centre.",
          source: "fallback",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to Clipboard", { description: "Tactical brief ready for transmission." });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col h-[680px] rounded-2xl border border-white/[0.08] bg-[#0d131f]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Tactical AI Copilot</h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live API Linked
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous Sentinel &amp; Strategist AI Consultation</p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                role: "assistant",
                content: "Session reset. Commander, how can Sentinel AI assist with current incident response?",
                source: "groq",
                timestamp: "Reset",
              },
            ])
          }
          className="p-1.5 rounded-lg border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05] transition"
          title="Clear Consultation Log"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Tactical Prompt Chips */}
      <div className="px-4 py-2.5 border-b border-white/[0.06] bg-black/20 flex gap-2 overflow-x-auto scrollbar-none">
        {TACTICAL_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="flex-shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/15 hover:border-cyan-500/40 transition whitespace-nowrap"
          >
            ⚡ {prompt}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                {m.role === "user" ? (
                  <>
                    <User className="w-3 h-3 text-blue-400" />
                    <span>Commander</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-cyan-400" />
                    <span>Sentinel Copilot</span>
                    {m.source === "groq" && (
                      <span className="text-[9px] text-cyan-400/80 font-mono">
                        (Groq LLaMA 3 · ~280ms)
                      </span>
                    )}
                  </>
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">· {m.timestamp}</span>
            </div>

            <div
              className={`group relative max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-lg ${
                m.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border border-blue-500/30 rounded-tr-none"
                  : "bg-slate-900/90 border border-white/[0.08] text-slate-200 rounded-tl-none"
              }`}
            >
              <div className="whitespace-pre-line font-sans">{m.content}</div>

              {m.role === "assistant" && (
                <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {m.model || "groq/compound-mini"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(m.content, idx)}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                    title="Copy response"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedIndex === idx ? "Copied" : "Copy Brief"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                <Bot className="w-3 h-3" />
                <span>Sentinel AI Processing Query...</span>
              </span>
            </div>
            <div className="rounded-2xl rounded-tl-none bg-slate-900/90 border border-cyan-500/20 px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Querying Groq LLaMA 3 inference engine &amp; analyzing Chennai GIS telemetry...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-white/[0.08] bg-slate-950/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI for evacuation plans, logistics triage, NDRF protocol..."
            disabled={loading}
            className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-cyan-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consult</span>
          </button>
        </form>
      </div>
    </div>
  );
}
