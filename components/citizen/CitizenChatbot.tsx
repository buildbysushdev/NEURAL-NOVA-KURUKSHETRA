"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { queryCitizenChatbot } from "@/lib/ai/chatbot-agent";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export function CitizenChatbot() {
  const { language } = useLanguage();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text:
        language === "hi"
          ? "नमस्ते। मैं कुरुक्षेत्र नागरिक आपातकालीन सहायता बॉट हूँ। आप बाढ़, चिकित्सा या राहत सामग्री के बारे में पूछ सकते हैं। मैं आपकी क्या सहायता कर सकता हूँ?"
          : "Welcome to Kurukshetra Emergency Support. I am your automated Sentinel Assistant. You can describe an emergency, request immediate supplies (water/medical/food), or inquire about safe evacuation zones. How can I assist you right now?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef(false);

  // Detect whether the user has intentionally scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If user is more than 80px from bottom, consider them reading history
    isUserScrolledUp.current = scrollHeight - (scrollTop + clientHeight) > 80;
  };

  // Auto-scroll to newest message unless user scrolled up
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Call grounded Sentinel chatbot agent
    setTimeout(async () => {
      try {
        const nearbyZonesData = [
          {
            id: "depot-alpha",
            name: "Central Logistics Hub Alpha",
            type: "relieff_depot",
            distance_km: 0.8,
            available_supplies: {
              drinking_water: "5,000 Liters",
              ration_packs: "3,000 Kits",
            },
          },
          {
            id: "shelter-beta",
            name: "Royapettah Multi-Story Evacuation Shelter",
            type: "shelter",
            distance_km: 1.4,
            available_supplies: {
              emergency_beds: "450 Units",
              medical_kits: "120 Kits",
            },
          },
        ];

        const answer = await queryCitizenChatbot(cleanText, {
          language: language as "en" | "hi",
          nearbyZones: nearbyZonesData,
        });

        const aiMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "assistant",
          text: answer.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        const fallbackMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "assistant",
          text: "Unable to assess this report right now, please retry",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      } finally {
        setIsTyping(false);
      }
    }, 800);
  };

  return (
    <div className="border border-[#DED9CE] bg-[#FFFFFF] rounded-sm flex flex-col h-[480px] text-[#1A1A1A]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#DED9CE] bg-[#F6F4EF]/60">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-sm bg-[#1A1A1A] text-[#F6F4EF] flex items-center justify-center">
            <Bot className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[#1A1A1A]">
              CITIZEN SENTINEL ASSISTANT
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="dot-safe" />
          <span className="font-ibm-mono text-[10px] text-[#6B655B] uppercase">ONLINE</span>
        </div>
      </div>

      {/* Messages Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F6F4EF]/20"
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`group flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`p-3 rounded-sm text-xs leading-relaxed max-w-[85%] relative transition-all ${
                  isUser
                    ? "bg-[#1A1A1A] text-[#F6F4EF]"
                    : "bg-[#FFFFFF] text-[#1A1A1A] border border-[#DED9CE] border-l-4 border-l-[#3B6D11]"
                }`}
              >
                {msg.text}
              </div>

              {/* Timestamp visible on hover only */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1 px-1">
                <Clock className="w-2.5 h-2.5 text-[#6B655B]" strokeWidth={1.75} />
                <span className="font-ibm-mono text-[10px] text-[#6B655B]">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Three Animated Bouncing Dots Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-1.5 p-3 rounded-sm bg-[#FFFFFF] border border-[#DED9CE] w-20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] animate-bounce" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Specific Verb Phrase */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-[#DED9CE] bg-[#FFFFFF] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            language === "hi"
              ? "संदेश टाइप करें (उदा. राशन कहां मिलेगा?)..."
              : "Ask emergency assistant (e.g. Where is drinking water?)..."
          }
          className="flex-1 px-3 py-2 text-xs rounded-sm border border-[#DED9CE] bg-[#F6F4EF]/50 text-[#1A1A1A] placeholder:text-[#6B655B] focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs uppercase tracking-wider font-semibold rounded-sm bg-[#1A1A1A] text-[#F6F4EF] hover:bg-black disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Send Emergency Query</span>
        </button>
      </form>
    </div>
  );
}
