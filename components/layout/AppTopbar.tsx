"use client";

import React, { useState } from "react";
import { ShieldAlert, Users, Radio, Activity, LogOut, Bell, Menu, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

interface AppTopbarProps {
  userRole: UserRole | null;
  userEmail: string;
  onRoleSwitch: (role: UserRole) => void;
  onLogout: () => void;
  onMobileMenuToggle: () => void;
}

export function AppTopbar({
  userRole,
  userEmail,
  onRoleSwitch,
  onLogout,
  onMobileMenuToggle,
}: AppTopbarProps) {
  const { language, setLanguage, t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: 1, title: "Autonomous Gemini Allocation Confirmed", time: "12:05 UTC", sev: "safe" },
    { id: 2, title: "Sentinel: Critical Surge Triaged (Score 9/10)", time: "12:01 UTC", sev: "critical" },
    { id: 3, title: "Rescue Squad Alpha Dispatched to Port 4", time: "11:55 UTC", sev: "watch" },
  ];

  const renderRoleBadge = (role: UserRole | null) => {
    switch (role) {
      case "authority":
        return <Badge variant="critical">AUTHORITY HQ</Badge>;
      case "rescue":
        return <Badge variant="watch">RESCUE SQUAD</Badge>;
      case "citizen":
      default:
        return <Badge variant="safe">CITIZEN PORTAL</Badge>;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#222933] bg-[#12161C] font-ibm-sans">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-1.5 rounded-sm border border-[#222933] text-[#8A99AD] hover:text-[#F6F4EF] hover:bg-[#181E26]"
            title="Toggle Menu"
          >
            <Menu className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#181E26] border border-[#222933] text-[#791F1F]">
              <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs tracking-wider uppercase font-mono text-[#F6F4EF]">
                  KURUKSHETRA PS20
                </span>
                <span className="text-[10px] font-mono text-[#8A99AD] border border-[#222933] px-1 rounded-sm bg-[#181E26]">
                  DEFCON 4
                </span>
              </div>
              <span className="text-[10px] text-[#8A99AD] font-mono hidden sm:inline tracking-wider">
                AGENTIC DISASTER RELIEF PLATFORM
              </span>
            </div>
          </div>
        </div>

        {/* Center: System Status Telemetry */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-sm bg-[#181E26] border border-[#222933] text-[11px] font-ibm-mono text-[#8A99AD]">
          <span className="dot-safe" />
          <span className="text-[#F6F4EF] font-semibold">GRID OPERATIONAL</span>
          <span className="text-[#222933]">|</span>
          <span>GROQ SENTINEL: ARMED</span>
          <span className="text-[#222933]">|</span>
          <span>GEMINI STRATEGIST: IDLE</span>
        </div>

        {/* Right: Controls & Persona */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Toggle */}
          <div className="flex items-center rounded-sm border border-[#222933] bg-[#181E26] p-0.5 text-xs font-mono">
            <button
              type="button"
              id="lang-toggle-en"
              onClick={() => setLanguage("en")}
              className={`px-2 py-0.5 rounded-sm transition-colors text-[10px] font-bold ${
                language === "en"
                  ? "bg-[#F6F4EF] text-[#12161C]"
                  : "text-[#8A99AD] hover:text-[#F6F4EF]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              id="lang-toggle-hi"
              onClick={() => setLanguage("hi")}
              className={`px-2 py-0.5 rounded-sm transition-colors text-[10px] font-bold ${
                language === "hi"
                  ? "bg-[#F6F4EF] text-[#12161C]"
                  : "text-[#8A99AD] hover:text-[#F6F4EF]"
              }`}
            >
              हिं
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-sm border border-[#222933] bg-[#181E26] text-[#8A99AD] hover:text-[#F6F4EF]"
              title="Notifications"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#791F1F]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-sm border border-[#222933] bg-[#181E26] p-3 shadow-2xl z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[#222933]">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#F6F4EF]">
                    Live Alert Stream
                  </span>
                  <Badge variant="critical">3 Active</Badge>
                </div>
                <div className="divide-y divide-[#222933]/60 mt-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2 text-xs">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={n.sev === "critical" ? "dot-critical" : n.sev === "watch" ? "dot-watch" : "dot-safe"} />
                        <span className="text-[#F6F4EF] font-semibold">{n.title}</span>
                      </div>
                      <span className="text-[10px] text-[#8A99AD] font-mono">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Badge */}
          <div className="hidden sm:block">
            {renderRoleBadge(userRole)}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-sm border border-[#222933] bg-[#181E26] text-[#F6F4EF] text-xs"
            >
              <div className="h-5 w-5 rounded-sm bg-[#12161C] border border-[#222933] flex items-center justify-center font-mono text-[10px] font-bold">
                {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="hidden md:inline max-w-[120px] truncate text-[#8A99AD] font-mono text-xs">
                {userEmail.split("@")[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-[#8A99AD]" strokeWidth={1.75} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-sm border border-[#222933] bg-[#181E26] p-2 shadow-2xl z-50">
                <div className="px-2 py-1.5 border-b border-[#222933] mb-1">
                  <p className="text-xs font-semibold text-[#F6F4EF] truncate">{userEmail}</p>
                  <p className="text-[10px] font-mono text-[#8A99AD] uppercase">{userRole || "citizen"}</p>
                </div>

                <div className="py-1 space-y-0.5">
                  <p className="px-2 text-[10px] font-mono uppercase text-[#8A99AD] mb-1">Switch Persona</p>
                  {(["citizen", "rescue", "authority"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleSwitch(r);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-sm text-xs flex items-center justify-between ${
                        userRole === r ? "bg-[#12161C] text-[#F6F4EF] font-bold border border-[#222933]" : "text-[#8A99AD] hover:bg-[#12161C] hover:text-[#F6F4EF]"
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      {userRole === r && <Check className="h-3 w-3 text-[#3B6D11]" strokeWidth={1.75} />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#222933] mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-sm text-xs text-[#791F1F] hover:bg-[#12161C] flex items-center gap-1.5"
                  >
                    <LogOut className="h-3 w-3" strokeWidth={1.75} />
                    <span>Terminate Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
