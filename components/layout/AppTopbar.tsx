"use client";

import React, { useState } from "react";
import { ShieldAlert, Users, Radio, Activity, LogOut, Bell, Menu, Sparkles, ChevronDown, Check, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    { id: 1, title: "Autonomous Dispatch Complete", time: "Just now", type: "success" },
    { id: 2, title: "Sentinel: High Severity Incident Triaged (Score 9/10)", time: "2m ago", type: "critical" },
    { id: 3, title: "Gemini Strategist: Optimal Supply Route Recomputed", time: "5m ago", type: "info" },
  ];

  const renderRoleBadge = (role: UserRole | null) => {
    switch (role) {
      case "authority":
        return (
          <Badge variant="critical" className="font-mono text-[11px] uppercase py-1 px-2.5">
            <Activity className="h-3 w-3 mr-1 inline" />
            {t("role_authority")}
          </Badge>
        );
      case "rescue":
        return (
          <Badge variant="warning" className="font-mono text-[11px] uppercase py-1 px-2.5">
            <Radio className="h-3 w-3 mr-1 inline" />
            {t("role_rescue")}
          </Badge>
        );
      case "citizen":
      default:
        return (
          <Badge variant="default" className="font-mono text-[11px] uppercase py-1 px-2.5 bg-blue-950/80 text-blue-300 border-blue-800">
            <Users className="h-3 w-3 mr-1 inline" />
            {t("role_citizen")}
          </Badge>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6">
        
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600/10 text-red-500 border border-red-600/30 shadow-sm shadow-red-950/50">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-white uppercase font-mono">
                  {t("brand_title")}
                </span>
                <span className="text-[10px] font-mono text-red-500 bg-red-950/60 px-1 rounded border border-red-800/50">
                  PS20
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline tracking-wider">
                AGENTIC EMERGENCY RESPONSE SYSTEM
              </span>
            </div>
          </div>
        </div>

        {/* Center: System Status Telemetry */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 font-semibold uppercase tracking-wider">DEFCON 4</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400">RLS ACTIVE</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">AUTONOMOUS MULTI-AGENT</span>
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5 text-xs font-mono shadow-sm">
            <button
              type="button"
              id="lang-toggle-en"
              onClick={() => setLanguage("en")}
              className={`px-2.5 py-1 rounded-md transition-all text-[11px] font-bold cursor-pointer ${
                language === "en"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              id="lang-toggle-hi"
              onClick={() => setLanguage("hi")}
              className={`px-2.5 py-1 rounded-md transition-all text-[11px] font-bold cursor-pointer ${
                language === "hi"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="हिंदी में बदलें"
            >
              हिं
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow">
                3
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-slate-800 bg-slate-950 p-3 shadow-2xl z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-white">Alert Dispatch</span>
                  <Badge variant="critical" className="text-[9px] py-0 px-1.5">3 ACTIVE</Badge>
                </div>
                <div className="divide-y divide-slate-800/60 mt-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2 text-xs">
                      <p className="text-slate-200 font-medium">{n.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
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

          {/* Profile & Logout Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 transition-colors text-xs"
            >
              <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-mono font-bold text-[10px]">
                {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="hidden md:inline max-w-[120px] truncate text-slate-300">
                {userEmail.split("@")[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-2xl z-50">
                <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-white truncate">{userEmail}</p>
                  <p className="text-[10px] font-mono text-slate-400 uppercase">{userRole || "citizen"}</p>
                </div>

                <div className="py-1">
                  <p className="px-2 text-[10px] font-mono uppercase text-slate-400 mb-1">Switch Role</p>
                  {(["citizen", "rescue", "authority"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleSwitch(r);
                        setShowProfileMenu(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between ${
                        userRole === r ? "bg-slate-800 text-white font-bold" : "text-slate-300 hover:bg-slate-900"
                      }`}
                    >
                      <span className="capitalize">{r}</span>
                      {userRole === r && <Check className="h-3 w-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs text-red-400 hover:bg-red-950/40 flex items-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t("nav_logout")}</span>
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
