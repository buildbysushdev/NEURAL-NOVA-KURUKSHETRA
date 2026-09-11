"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "bot";
  text: string;
}

const QUICK_REPLIES = [
  "Where is the nearest shelter?",
  "Is my area safe?",
  "What should I do in a flood?",
  "How do I evacuate?",
];

export function FloatingChatbotButton() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([
    {
      role: "bot",
      text: "Hi! I am your Sentinel Safety Assistant 🛡️\n\nAsk me about shelters, evacuation routes, or emergency contacts. I reply in seconds.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send(text?: string) {
    const userText = text || input;
    if (!userText.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, language: "en" }),
      });
      const d = await r.json();
      setMsgs((m) => [
        ...m,
        {
          role: "bot",
          text:
            d.reply ||
            "Please dial 112 for immediate help. Nearest shelter: Central Relief Station Alpha (800m inland from Marina).",
        },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "bot",
          text: "Connection issue. For emergencies, dial 112 immediately. Nearest shelter: Central Relief Station Alpha.",
        },
      ]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Safety Assistant"
          style={{
            position: "fixed",
            bottom: 80,
            right: 20,
            zIndex: 99,
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            border: "none",
            color: "white",
            fontSize: 26,
            boxShadow: "0 8px 32px rgba(59,130,246,0.45)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          💬
          {/* Notification dot */}
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ef4444",
              border: "2px solid white",
            }}
          />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 80,
            right: 16,
            left: 16,
            maxWidth: 400,
            margin: "0 auto",
            height: "62vh",
            maxHeight: 520,
            background: "white",
            borderRadius: 20,
            zIndex: 99,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
              color: "white",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Sentinel Safety Assistant</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>
                Powered by Groq LLaMA 3 · Always available
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                marginLeft: "auto",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: 8,
                color: "white",
                width: 28,
                height: 28,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 12px 4px",
              background: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {msgs.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    maxWidth: "82%",
                    background: m.role === "user" ? "#3b82f6" : "white",
                    color: m.role === "user" ? "white" : "#0f172a",
                    fontSize: 13,
                    lineHeight: 1.5,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    whiteSpace: "pre-line",
                    border: m.role === "bot" ? "1px solid #e2e8f0" : "none",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 16px",
                    borderRadius: "16px 16px 16px 4px",
                    background: "white",
                    border: "1px solid #e2e8f0",
                    fontSize: 20,
                    letterSpacing: 4,
                  }}
                >
                  ···
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Replies */}
          {msgs.length <= 1 && (
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                gap: 6,
                overflowX: "auto",
                background: "#f8fafc",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  style={{
                    flexShrink: 0,
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: "1px solid #e2e8f0",
                    background: "white",
                    fontSize: 11,
                    color: "#3b82f6",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Row */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: 8,
              background: "white",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about shelters, evacuation..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 20,
                border: "1.5px solid #e2e8f0",
                outline: "none",
                fontSize: 13,
                fontFamily: "inherit",
                color: "#0f172a",
                background: "#f8fafc",
              }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: loading || !input.trim() ? "#e2e8f0" : "#3b82f6",
                border: "none",
                color: "white",
                cursor: loading || !input.trim() ? "default" : "pointer",
                fontSize: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
