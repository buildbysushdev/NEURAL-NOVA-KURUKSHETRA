"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MapPin,
  Boxes,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Radio,
  Activity
} from "lucide-react";
import { UserRole } from "@/lib/supabaseClient";

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
  const role = userRole || "authority";

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: `/dashboard/${role}`,
      active: pathname === `/dashboard/${role}` || pathname === "/dashboard",
      badge: "LIVE",
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
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden md:flex flex-col flex-shrink-0 bg-[#12161C] border-r border-[#222933] select-none justify-between h-[calc(100vh-3.5rem)] sticky top-14 font-ibm-sans"
    >
      {/* Navigation Links */}
      <div className="flex flex-col p-2.5 gap-1">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          {!collapsed && (
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A99AD]">
              OPERATIONS DESK
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-sm text-[#8A99AD] hover:text-[#F6F4EF] hover:bg-[#181E26] transition-colors ml-auto"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" strokeWidth={1.75} /> : <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors group ${
                item.active
                  ? "bg-[#181E26] text-[#F6F4EF] border-l-4 border-l-[#791F1F]"
                  : "text-[#8A99AD] hover:text-[#F6F4EF] hover:bg-[#181E26]"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="font-ibm-mono text-[9px] px-1 py-0.2 rounded-sm bg-[#12161C] border border-[#222933] text-[#F6F4EF]">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Role Switcher & Telemetry Footer */}
      <div className="p-2.5 border-t border-[#222933] bg-[#181E26]/50 flex flex-col gap-2">
        {!collapsed ? (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono uppercase text-[#8A99AD] tracking-wider">
                Persona Gate
              </span>
              <span className="dot-safe" />
            </div>

            <div className="grid grid-cols-3 gap-1 bg-[#12161C] p-1 rounded-sm border border-[#222933]">
              <button
                type="button"
                onClick={() => onRoleSwitch("citizen")}
                className={`p-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  role === "citizen"
                    ? "bg-[#F6F4EF] text-[#12161C] font-bold"
                    : "text-[#8A99AD] hover:text-[#F6F4EF]"
                }`}
                title="Switch to Citizen View"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => onRoleSwitch("rescue")}
                className={`p-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  role === "rescue"
                    ? "bg-[#F6F4EF] text-[#12161C] font-bold"
                    : "text-[#8A99AD] hover:text-[#F6F4EF]"
                }`}
                title="Switch to Rescue Team View"
              >
                Rescue
              </button>
              <button
                type="button"
                onClick={() => onRoleSwitch("authority")}
                className={`p-1.5 rounded-sm text-[10px] font-mono uppercase tracking-wider transition-colors ${
                  role === "authority"
                    ? "bg-[#F6F4EF] text-[#12161C] font-bold"
                    : "text-[#8A99AD] hover:text-[#F6F4EF]"
                }`}
                title="Switch to Authority Commander View"
              >
                HQ
              </button>
            </div>

            <div className="rounded-sm bg-[#12161C] p-2 border border-[#222933]">
              <div className="flex items-center gap-1.5 text-[10px] text-[#8A99AD] font-mono">
                <span className="dot-safe" />
                <span>SENTINEL: ARMED</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#8A99AD] font-mono mt-0.5">
                <span className="dot-watch" />
                <span>STRATEGIST: ACTIVE</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <button
              onClick={() => onRoleSwitch(role === "authority" ? "citizen" : role === "citizen" ? "rescue" : "authority")}
              className="p-1.5 rounded-sm bg-[#181E26] text-[#8A99AD] hover:text-[#F6F4EF] border border-[#222933]"
              title={`Active: ${role.toUpperCase()}`}
            >
              {role === "authority" ? (
                <Activity className="h-4 w-4 text-[#F6F4EF]" strokeWidth={1.75} />
              ) : role === "rescue" ? (
                <Radio className="h-4 w-4 text-[#F6F4EF]" strokeWidth={1.75} />
              ) : (
                <Users className="h-4 w-4 text-[#F6F4EF]" strokeWidth={1.75} />
              )}
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
