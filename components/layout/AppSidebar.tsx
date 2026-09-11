"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Package,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
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
      badge: "Live",
    },
    {
      label: "Tactical Map",
      icon: Map,
      href: `/dashboard/authority#map-section`,
      active: false,
    },
    {
      label: "Resources",
      icon: Package,
      href: `/dashboard/authority#inventory-section`,
      active: false,
    },
    {
      label: "AI Audit Trail",
      icon: ScrollText,
      href: `/dashboard/authority#audit-section`,
      active: false,
    },
    {
      label: "Pre-Demo Test",
      icon: ShieldAlert,
      href: `/dashboard/test`,
      active: pathname === "/dashboard/test",
      badge: "9/9",
    },
    {
      label: "Settings",
      icon: Settings,
      href: `/dashboard/${role}`,
      active: false,
    },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col flex-shrink-0 border-r border-white/[0.06] bg-[#0B0F19]/60 backdrop-blur-xl p-4 transition-all duration-300 z-20 sticky top-16 h-[calc(100vh-4rem)] ${
        collapsed ? "w-20" : "w-60"
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Operations Desk
          </p>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition ml-auto"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                item.active
                  ? "bg-white/[0.08] text-slate-100 shadow-lg shadow-black/20 font-medium"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                  item.active
                    ? "text-blue-400"
                    : "text-slate-400 group-hover:text-slate-300"
                }`}
              />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-400 animate-pulse font-mono">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Persona Switcher */}
      {!collapsed && (
        <div className="mt-auto pt-4 border-t border-white/[0.06]">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3 px-2">
            Persona Gate
          </p>
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            <button
              onClick={() => onRoleSwitch("citizen")}
              className={`flex-1 text-xs py-1.5 rounded-lg transition font-medium ${
                role === "citizen"
                  ? "bg-blue-500/20 text-blue-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
              }`}
            >
              Citizen
            </button>
            <button
              onClick={() => onRoleSwitch("rescue")}
              className={`flex-1 text-xs py-1.5 rounded-lg transition font-medium ${
                role === "rescue"
                  ? "bg-blue-500/20 text-blue-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
              }`}
            >
              Rescue
            </button>
            <button
              onClick={() => onRoleSwitch("authority")}
              className={`flex-1 text-xs py-1.5 rounded-lg transition font-medium ${
                role === "authority"
                  ? "bg-blue-500/20 text-blue-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
              }`}
            >
              HQ
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
