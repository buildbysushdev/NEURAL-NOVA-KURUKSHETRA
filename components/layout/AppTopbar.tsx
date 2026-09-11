"use client";

import React, { useState } from "react";
import { Shield, Bell, Menu, ChevronDown, Check, LogOut, Globe } from "lucide-react";
import { UserRole } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

interface AppTopbarProps {
  userRole: UserRole | null;
  userEmail: string;
  onRoleSwitch: (role: UserRole) => void;
  onLogout: () => void;
  onMobileMenuToggle: () => void;
}

function StatusPill({
  color,
  label,
}: {
  color: "emerald" | "amber" | "slate" | "red";
  label: string;
}) {
  const colors = {
    emerald: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    amber: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    slate: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
    red: "bg-red-500/15 text-red-400 border border-red-500/20",
  };

  const dotColors = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    slate: "bg-slate-500",
    red: "bg-red-400",
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md ${colors[color]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColors[color]} ${
          color === "emerald" ? "animate-pulse" : ""
        }`}
      />
      <span>{label}</span>
    </div>
  );
}

export function AppTopbar({
  userRole,
  userEmail,
  onRoleSwitch,
  onLogout,
  onMobileMenuToggle,
}: AppTopbarProps) {
  const { language, setLanguage } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    {
      id: 1,
      title: "Autonomous Gemini Allocation Confirmed",
      time: "12:05 UTC",
      color: "text-emerald-400",
    },
    {
      id: 2,
      title: "Sentinel: Critical Surge Triaged (Score 9/10)",
      time: "12:01 UTC",
      color: "text-red-400",
    },
    {
      id: 3,
      title: "Rescue Squad Alpha Dispatched to Port 4",
      time: "11:55 UTC",
      color: "text-amber-400",
    },
  ];

  const roleTitle =
    userRole === "authority"
      ? "Commander"
      : userRole === "rescue"
      ? "Field Lead"
      : "Citizen";

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "C";

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B0F19]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-xl hover:bg-white/[0.04] text-slate-400 transition"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100 tracking-wide">
                Kurukshetra PS20
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Agentic Disaster Relief Platform
              </p>
            </div>
          </div>
        </div>

        {/* Center: Status Indicators */}
        <div className="hidden lg:flex items-center gap-4">
          <StatusPill color="emerald" label="Grid Operational" />
          <StatusPill color="amber" label="Sentinel Armed" />
          <StatusPill color="slate" label="Strategist Idle" />
        </div>

        {/* Right: Controls & User Area */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Language Switcher */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] font-semibold ${
                language === "en"
                  ? "bg-white/[0.08] text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] font-semibold ${
                language === "hi"
                  ? "bg-white/[0.08] text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              हिं
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/[0.08] bg-[#0F172A]/95 backdrop-blur-2xl p-4 shadow-2xl z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-semibold text-slate-200">
                    Live System Alerts
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
                    3 Active
                  </span>
                </div>
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition"
                    >
                      <p className={`text-xs font-medium ${n.color}`}>{n.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        {n.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Area with Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-white/[0.06] hover:opacity-90 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-violet-500/20">
                {initial}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-medium text-slate-200 leading-tight">
                  {roleTitle}
                </span>
                <span className="text-[10px] font-mono text-slate-400 max-w-[120px] truncate">
                  {userEmail || "auth@kurukshetra"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/[0.08] bg-[#0F172A]/95 backdrop-blur-2xl p-3 shadow-2xl z-50 space-y-2">
                <div className="px-2 py-1.5 border-b border-white/[0.06]">
                  <p className="text-xs font-semibold text-slate-200 truncate">{userEmail}</p>
                  <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                    Active: {roleTitle}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="px-2 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                    Switch Persona
                  </p>
                  {(["citizen", "rescue", "authority"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleSwitch(r);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition ${
                        userRole === r
                          ? "bg-blue-500/20 text-blue-300 font-medium"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span className="capitalize">{r === "authority" ? "Authority (HQ)" : r}</span>
                      {userRole === r && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-white/[0.06] pt-1 mt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </nav>
  );
}
