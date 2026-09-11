"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDisasterRelief } from "@/context/DisasterReliefContext";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldAlert, Users, Radio, Activity, LogOut, LogIn, User, ChevronDown, Sparkles, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const { user, role, signOut, switchRole } = useAuth();
  const { alertLevel } = useDisasterRelief();
  const { language, setLanguage, t } = useLanguage();
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const getRoleBadge = (currentRole) => {
    switch (currentRole) {
      case "authority":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 font-mono text-[11px] uppercase">
            <Activity className="h-3 w-3" />
            {t("role_authority")}
          </Badge>
        );
      case "rescue":
        return (
          <Badge className="flex items-center gap-1 font-mono text-[11px] uppercase bg-amber-950 text-amber-300 border border-amber-800">
            <Radio className="h-3 w-3" />
            {t("role_rescue")}
          </Badge>
        );
      case "citizen":
      default:
        return (
          <Badge className="flex items-center gap-1 font-mono text-[11px] uppercase bg-blue-950 text-blue-300 border border-blue-800">
            <Users className="h-3 w-3" />
            {t("role_citizen")}
          </Badge>
        );
    }
  };

  const handleDemoRoleSwitch = (targetRole) => {
    localStorage.setItem("kurukshetra_active_role", targetRole);
    if (typeof switchRole === "function") {
      switchRole(targetRole);
    }
    setDemoMenuOpen(false);
    router.push(`/dashboard/${targetRole}`);
  };

  const handleQuickLogout = async () => {
    setDemoMenuOpen(false);
    if (typeof signOut === "function") {
      await signOut();
    }
    localStorage.removeItem("kurukshetra_active_role");
    localStorage.removeItem("kurukshetra_active_email");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
      <div className="flex h-14 items-center justify-between px-3 sm:px-6">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600/20 text-red-500 border border-red-600/40">
              <ShieldAlert className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-slate-100">
                  {t("brand_title")}
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  / {t("brand_subtitle")}
                </span>
              </div>
              <span className="text-[10px] text-red-400 font-mono tracking-wider font-semibold">
                {alertLevel}
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Language Toggle, Demo Switch, User Role & Auth Action */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language Toggle: EN | HI */}
          <div className="flex items-center rounded-md border border-slate-800 bg-slate-900/90 p-0.5 text-xs font-mono shadow-sm">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2 py-0.5 rounded transition-colors text-[11px] font-bold cursor-pointer ${
                language === "en"
                  ? "bg-red-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`px-2 py-0.5 rounded transition-colors text-[11px] font-bold cursor-pointer ${
                language === "hi"
                  ? "bg-red-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              HI
            </button>
          </div>

          {/* Demo Switch dropdown */}
          {isDemoMode && (
            <div className="relative">
              <button
                type="button"
                id="demo-navbar-switch-btn"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold bg-emerald-950/40 border border-emerald-600/50 hover:bg-emerald-900/40 text-emerald-300 shadow-sm transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">{t("demo_switch")}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${demoMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {demoMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDemoMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-2.5 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                      <span>Switch Responder Role</span>
                      <span className="text-emerald-400 font-bold">DEMO</span>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => handleDemoRoleSwitch("citizen")}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                          role === "citizen" ? "bg-blue-950/60 text-blue-300 font-bold border border-blue-800/60" : "text-slate-300 hover:bg-slate-800/70"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-400" />
                          <span>Citizen Portal</span>
                        </div>
                        {role === "citizen" && <Check className="h-3.5 w-3.5 text-blue-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDemoRoleSwitch("rescue")}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                          role === "rescue" ? "bg-amber-950/60 text-amber-300 font-bold border border-amber-800/60" : "text-slate-300 hover:bg-slate-800/70"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Radio className="h-4 w-4 text-amber-400" />
                          <span>Rescue Team</span>
                        </div>
                        {role === "rescue" && <Check className="h-3.5 w-3.5 text-amber-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDemoRoleSwitch("authority")}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                          role === "authority" ? "bg-red-950/60 text-red-300 font-bold border border-red-800/60" : "text-slate-300 hover:bg-slate-800/70"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-red-400" />
                          <span>Authority Command</span>
                        </div>
                        {role === "authority" && <Check className="h-3.5 w-3.5 text-red-400" />}
                      </button>
                    </div>

                    <div className="pt-1 mt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={handleQuickLogout}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-950/50 transition-colors text-left font-mono cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 text-rose-400" />
                        <span>Logout &amp; Switch (/login)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {user ? (
            <>
              {/* Role badge */}
              <div className="flex items-center gap-2">
                {getRoleBadge(role)}
                <span className="text-xs text-slate-400 font-mono hidden md:inline truncate max-w-[180px]">
                  {user.email || user.user_metadata?.full_name}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-900 border border-slate-800 transition-colors"
                title="Sign out of platform"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
