"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  Boxes,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Users,
  Radio,
  Activity,
  Flame,
  Globe2,
  BellRing
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/lib/supabaseClient";
import { useLanguage } from "@/context/LanguageContext";

interface AppSidebarProps {
  userRole: UserRole | null;
  onRoleSwitch: (role: UserRole) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function AppSidebar({
  userRole,
  onRoleSwitch,
  collapsed,
  setCollapsed,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  const role = userRole || "authority";

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: `/dashboard/${role}`,
      active: pathname === `/dashboard/${role}` || pathname === "/dashboard",
      badge: "LIVE",
      badgeVariant: "critical" as const,
    },
    {
      label: "Tactical Map",
      icon: MapPin,
      href: role === "authority" ? "/dashboard/authority#map-section" : `/dashboard/${role}`,
      active: false,
    },
    {
      label: "Resources",
      icon: Boxes,
      href: role === "authority" ? "/dashboard/authority#inventory-section" : `/dashboard/${role}`,
      active: false,
    },
    {
      label: "AI Audit Trail",
      icon: ScrollText,
      href: role === "authority" ? "/dashboard/authority#audit-section" : `/dashboard/${role}`,
      active: false,
    },
    {
      label: "Settings",
      icon: Settings,
      href: `/dashboard/${role}`,
      active: false,
    },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="hidden md:flex flex-col flex-shrink-0 bg-slate-950/95 border-r border-slate-800/80 z-40 backdrop-blur-md select-none justify-between h-[calc(100vh-3.5rem)] sticky top-14"
    >
      {/* Navigation Links */}
      <div className="flex flex-col p-3 gap-1.5">
        <div className="flex items-center justify-between px-2 py-1.5 mb-2">
          {!collapsed && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Operations Center
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-slate-800/70 text-slate-400 hover:text-white transition-colors ml-auto"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                item.active
                  ? "bg-red-600/10 text-red-400 border border-red-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${item.active ? "text-red-500" : "text-slate-400"}`} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant} className="text-[9px] py-0 px-1.5 tracking-wider font-mono">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Role Switcher & System Telemetry in Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/30 flex flex-col gap-2">
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                Active Persona
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => onRoleSwitch("citizen")}
                className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all ${
                  role === "citizen"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
                title="Switch to Citizen View"
              >
                <Users className="h-3.5 w-3.5 mb-0.5" />
                <span>Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => onRoleSwitch("rescue")}
                className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all ${
                  role === "rescue"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
                title="Switch to Rescue Team View"
              >
                <Radio className="h-3.5 w-3.5 mb-0.5" />
                <span>Rescue</span>
              </button>
              <button
                type="button"
                onClick={() => onRoleSwitch("authority")}
                className={`flex flex-col items-center justify-center p-1.5 rounded text-[10px] font-medium transition-all ${
                  role === "authority"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
                title="Switch to Authority Commander View"
              >
                <Activity className="h-3.5 w-3.5 mb-0.5" />
                <span>HQ</span>
              </button>
            </div>

            <div className="rounded-md bg-slate-950/80 p-2 border border-slate-800/60 mt-1">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>GROQ SENTINEL: ONLINE</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>GEMINI STRATEGIST: IDLE</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <button
              onClick={() => onRoleSwitch(role === "authority" ? "citizen" : role === "citizen" ? "rescue" : "authority")}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
              title={`Active: ${role.toUpperCase()} (Click to toggle)`}
            >
              {role === "authority" ? (
                <Activity className="h-4 w-4 text-red-500" />
              ) : role === "rescue" ? (
                <Radio className="h-4 w-4 text-amber-400" />
              ) : (
                <Users className="h-4 w-4 text-blue-400" />
              )}
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
