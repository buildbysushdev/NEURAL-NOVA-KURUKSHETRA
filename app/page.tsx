"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Entry Point: 3-Portal Landing Gateway (app/page.tsx)
 * ==============================================================================
 * 
 * Command Glass Design:
 * - Direct triage gateway: Citizen ("I need help"), Rescue Team ("I'm a responder"),
 *   and Authority ("I'm coordinating")
 * - Background ambient glow orbs & subtle radial dot-grid texture
 * - Live operational status pill & multi-agency data transparency badges
 */

import React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Wifi,
  Shield,
  Zap,
  ArrowRight,
  Globe,
  Radio,
} from "lucide-react";

interface PortalCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonIcon: React.ElementType;
  color: "blue" | "amber" | "red";
  onClick: () => void;
  featured?: boolean;
}

function PortalCard({
  icon: Icon,
  title,
  subtitle,
  description,
  features,
  buttonText,
  buttonIcon: BtnIcon,
  color,
  onClick,
  featured,
}: PortalCardProps) {
  const colorMap = {
    blue: {
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      button: "bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 text-white",
      glow: "shadow-[0_0_40px_rgba(59,130,246,0.12)]",
      borderColor: "border-blue-500/20",
      badgeColor: "bg-blue-500 text-white",
    },
    amber: {
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      button: "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20 text-white",
      glow: "shadow-[0_0_40px_rgba(245,158,11,0.12)]",
      borderColor: "border-amber-500/20",
      badgeColor: "bg-amber-500 text-white",
    },
    red: {
      iconBg: "bg-red-500/10",
      iconColor: "text-red-400",
      button: "bg-red-600 hover:bg-red-500 shadow-red-500/25 text-white",
      glow: "shadow-[0_0_40px_rgba(239,68,68,0.15)]",
      borderColor: "border-red-500/30",
      badgeColor: "bg-red-500 text-white",
    },
  };

  const c = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`
        relative group rounded-2xl border p-6 flex flex-col justify-between
        transition-all duration-300 cursor-pointer backdrop-blur-xl select-none
        ${
          featured
            ? `bg-white/[0.04] ${c.borderColor} shadow-2xl ${c.glow}`
            : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]"
        }
      `}
    >
      {featured && (
        <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-md">
          Restricted Command
        </div>
      )}

      <div>
        {/* Top Icon */}
        <div className={`w-12 h-12 rounded-2xl ${c.iconBg} flex items-center justify-center mb-5 transition-transform group-hover:scale-105`}>
          <Icon className={`w-6 h-6 ${c.iconColor}`} strokeWidth={1.75} />
        </div>

        {/* Title & Subtitle */}
        <p className="text-xs font-semibold text-slate-400 mb-1 tracking-wide">
          {subtitle}
        </p>
        <h3 className="text-xl font-bold text-slate-100 mb-3 tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Features Checklist */}
        <ul className="space-y-2.5 mb-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" strokeWidth={2} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <button
        type="button"
        className={`w-full py-3 px-4 rounded-xl ${c.button} font-semibold text-xs tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 transition-all duration-200 group-hover:scale-[1.02]`}
      >
        <BtnIcon className="w-4 h-4" strokeWidth={2} />
        <span>{buttonText}</span>
      </button>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  const handlePortalSelect = (role: "citizen" | "rescue" | "authority") => {
    localStorage.setItem("kurukshetra_active_role", role);
    localStorage.setItem("kurukshetra_role", role);
    document.cookie = `kurukshetra_role=${role}; path=/; max-age=86400`;
    router.push(`/dashboard/${role}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0F172A] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden font-ibm-sans selection:bg-red-500 selection:text-white">
      
      {/* Background ambient lighting effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div
          className="fixed inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-6xl w-full mx-auto my-auto py-10">
        
        {/* Header Block */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-md mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300 font-mono">
              System operational — 24/7 monitoring active
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-slate-100 mb-4 tracking-tight">
            Kurukshetra Disaster Response
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Unified agentic disaster relief platform coordinating citizens, rescue squads, and state authorities during acute natural emergencies.
          </p>
        </div>

        {/* 3 Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Portal 1: Citizen */}
          <PortalCard
            icon={User}
            title="I Need Help"
            subtitle="Citizen Access"
            description="Report hazards, check real-time hazard proximity, and chat with the anti-hallucination ground relief assistant."
            features={[
              "Google / OTP Instant Login",
              "Geofenced Location Hazard Alerts",
              "AI Grounded Relief Chatbot",
              "Emergency SOS Beacon",
            ]}
            buttonText="Citizen Access"
            buttonIcon={User}
            color="blue"
            onClick={() => handlePortalSelect("citizen")}
          />

          {/* Portal 2: Rescue Team */}
          <PortalCard
            icon={Truck}
            title="I'm a Responder"
            subtitle="Rescue Squad Access"
            description="Receive field dispatch orders, view assigned multi-zone sectors, and log supply deliveries in real-time."
            features={[
              "NDRF / SDRF Team Credentials",
              "Dynamic Route & Mission Manifests",
              "Real-time Task Completion Sync",
              "Depot Stock Synchronization",
            ]}
            buttonText="Sign in as Team"
            buttonIcon={Shield}
            color="amber"
            onClick={() => handlePortalSelect("rescue")}
          />

          {/* Portal 3: Authority */}
          <PortalCard
            icon={ShieldCheck}
            title="I'm Coordinating"
            subtitle="Authority HQ Access"
            description="Oversee nationwide GIS telemetry, ratify autonomous AI allocations, and orchestrate emergency logistics."
            features={[
              "Commander Officer ID Authentication",
              "Live India NASA FIRMS & USGS Grid",
              "Gemini Multi-Zone Optimization",
              "Autonomous AI Audit Trail & Ratification",
            ]}
            buttonText="Command Console"
            buttonIcon={Lock}
            color="red"
            onClick={() => handlePortalSelect("authority")}
            featured
          />
        </div>

        {/* Footer Transparency Bar */}
        <div className="mt-14 sm:mt-16 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400 border-t border-white/[0.06] pt-6 font-mono">
          <span className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-blue-400" />
            <span>Live Data: NASA FIRMS + USGS</span>
          </span>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Decisions Verified by Humans</span>
          </span>
          <span className="hidden sm:inline text-slate-700">•</span>
          <span className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Powered by Groq &amp; Gemini</span>
          </span>
        </div>
      </div>

      {/* Bottom Legal & Versioning */}
      <div className="text-center text-[11px] text-slate-400 font-mono py-2">
        <span>Kurukshetra PS20 // Agentic Disaster Relief System // MIT Hackathon 2026</span>
      </div>
    </div>
  );
}
