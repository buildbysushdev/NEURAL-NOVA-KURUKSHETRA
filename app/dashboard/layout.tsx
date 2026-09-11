"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Main Dashboard Layout (app/dashboard/layout.tsx)
 * ==============================================================================
 * 
 * Responsibilities:
 * 1. Verifies user authentication session (Supabase session or active local session).
 * 2. Reads the user's role ('citizen', 'rescue', 'authority').
 * 3. Enforces role-based routing (e.g., citizen redirected to /dashboard/citizen).
 * 4. Displays unified top navigation with User Email, Role Badge, Demo Role Switcher, and Logout button.
 */

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, isConfigured, getUserRole, UserRole } from "@/lib/supabaseClient";
import { ShieldAlert, Users, Radio, Activity, LogOut, Loader2, ChevronDown, Sparkles, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  // Authentication & session state
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoMenuOpen, setDemoMenuOpen] = useState<boolean>(false);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  useEffect(() => {
    async function checkAuthAndRole() {
      try {
        // 1. If Supabase is live and configured, attempt Supabase session validation
        if (isConfigured) {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (!error && session?.user) {
              const role = await getUserRole(session.user.id);
              setUserRole(role);
              setUserEmail(session.user.email || "");
              localStorage.setItem("kurukshetra_active_role", role);
              localStorage.setItem("kurukshetra_active_email", session.user.email || "");

              if (pathname === "/dashboard" || pathname === "/dashboard/") {
                router.push(`/dashboard/${role}`);
              }
              setLoading(false);
              return;
            }
          } catch (supaErr) {
            console.warn("Supabase session check error:", supaErr);
          }
        }

        // 2. Local session / demo mode check:
        const savedRole =
          (localStorage.getItem("kurukshetra_active_role") as UserRole) ||
          (localStorage.getItem("kurukshetra_role") as UserRole);

        const savedEmail =
          localStorage.getItem("kurukshetra_active_email") ||
          (savedRole === "citizen"
            ? "citizen@kurukshetra.gov.in"
            : savedRole === "rescue"
            ? "rescue@kurukshetra.gov.in"
            : "commander@kurukshetra.gov.in");

        if (savedRole) {
          setUserRole(savedRole);
          setUserEmail(savedEmail);

          if (pathname === "/dashboard" || pathname === "/dashboard/") {
            router.push(`/dashboard/${savedRole}`);
          }
          setLoading(false);
          return;
        }

        // 3. Fallback for demo mode: if demo mode is enabled, auto-assign authority
        if (isDemoMode) {
          const defaultDemoRole: UserRole = "authority";
          const defaultDemoEmail = "commander@kurukshetra.gov.in";
          setUserRole(defaultDemoRole);
          setUserEmail(defaultDemoEmail);
          localStorage.setItem("kurukshetra_active_role", defaultDemoRole);
          localStorage.setItem("kurukshetra_active_email", defaultDemoEmail);

          if (pathname === "/dashboard" || pathname === "/dashboard/") {
            router.push(`/dashboard/${defaultDemoRole}`);
          }
          setLoading(false);
          return;
        }

        // Neither Supabase session nor saved local session found: redirect to login
        router.push("/login");
      } catch (err) {
        console.error("Auth layout validation error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndRole();
  }, [pathname, router, isDemoMode]);

  // Handle user logout
  const handleLogout = async () => {
    try {
      if (isConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      localStorage.removeItem("kurukshetra_active_role");
      localStorage.removeItem("kurukshetra_active_email");
      localStorage.removeItem("kurukshetra_role");
      localStorage.removeItem("kurukshetra_user");
      document.cookie = "kurukshetra_role=; path=/; max-age=0";
      router.push("/login");
    }
  };

  // Switch role immediately in demo mode
  const handleRoleSwitch = (targetRole: UserRole) => {
    let emailForRole = "commander@kurukshetra.gov.in";
    if (targetRole === "citizen") emailForRole = "citizen@kurukshetra.gov.in";
    else if (targetRole === "rescue") emailForRole = "rescue@kurukshetra.gov.in";

    localStorage.setItem("kurukshetra_active_role", targetRole);
    localStorage.setItem("kurukshetra_active_email", emailForRole);
    localStorage.setItem("kurukshetra_role", targetRole);
    document.cookie = `kurukshetra_role=${targetRole}; path=/; max-age=86400`;

    setUserRole(targetRole);
    setUserEmail(emailForRole);
    setDemoMenuOpen(false);
    router.push(`/dashboard/${targetRole}`);
  };

  // Quick logout and return to /login
  const handleQuickLogoutSwitch = async () => {
    setDemoMenuOpen(false);
    await handleLogout();
  };

  // Render role badge with distinct styles
  const renderRoleBadge = (role: UserRole | null) => {
    switch (role) {
      case "authority":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 font-mono text-[11px] uppercase py-1 px-2.5">
            <Activity className="h-3 w-3" />
            {t("role_authority")}
          </Badge>
        );
      case "rescue":
        return (
          <Badge className="flex items-center gap-1 font-mono text-[11px] uppercase py-1 px-2.5 bg-amber-950 text-amber-300 border border-amber-800">
            <Radio className="h-3 w-3" />
            {t("role_rescue")}
          </Badge>
        );
      case "citizen":
      default:
        return (
          <Badge className="flex items-center gap-1 font-mono text-[11px] uppercase py-1 px-2.5 bg-blue-950 text-blue-300 border border-blue-800">
            <Users className="h-3 w-3" />
            {t("role_citizen")}
          </Badge>
        );
    }
  };

  // Loading spinner while verifying credentials
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-3" />
        <p className="text-xs font-mono uppercase tracking-wider">Verifying Responder Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-3 sm:px-6">
          
          {/* Brand & Project Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600/20 text-red-500 border border-red-600/40">
              <ShieldAlert className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-white">
                  {t("brand_title")}
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  / {t("brand_subtitle")}
                </span>
              </div>
            </div>
          </div>

          {/* User Email, Role Badge, Demo Switch, Language Toggle, and Logout Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Toggle: EN | HI */}
            <div className="flex items-center rounded-md border border-slate-800 bg-slate-900/90 p-0.5 text-xs font-mono shadow-sm">
              <button
                type="button"
                id="lang-toggle-en"
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 rounded transition-colors text-[11px] font-bold cursor-pointer ${
                  language === "en"
                    ? "bg-red-600 text-white shadow"
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
                className={`px-2 py-0.5 rounded transition-colors text-[11px] font-bold cursor-pointer ${
                  language === "hi"
                    ? "bg-red-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="हिन्दी में बदलें (Switch to Hindi)"
              >
                HI
              </button>
            </div>
            {/* Demo Switch Dropdown (Only when NEXT_PUBLIC_DEMO_MODE === 'true') */}
            {isDemoMode && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  id="demo-switch-dropdown-btn"
                  onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                  className="border-emerald-600/50 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 text-xs flex items-center gap-1.5 h-8 px-2.5 font-mono shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span className="font-semibold hidden sm:inline">{t("demo_switch")}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${demoMenuOpen ? "rotate-180" : ""}`} />
                </Button>

                {demoMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setDemoMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95">
                      <div className="px-2.5 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                        <span>{t("switch_role")}</span>
                        <span className="text-emerald-400 font-bold">DEMO</span>
                      </div>

                      <div className="py-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => handleRoleSwitch("citizen")}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                            userRole === "citizen" ? "bg-blue-950/60 text-blue-300 font-bold border border-blue-800/60" : "text-slate-300 hover:bg-slate-800/70"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span>{t("role_citizen")}</span>
                          </div>
                          {userRole === "citizen" && <Check className="h-3.5 w-3.5 text-blue-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRoleSwitch("rescue")}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                            userRole === "rescue" ? "bg-amber-950/60 text-amber-300 font-bold border border-amber-800/60" : "text-slate-300 hover:bg-slate-800/70"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Radio className="h-4 w-4 text-amber-400" />
                            <span>{t("role_rescue")}</span>
                          </div>
                          {userRole === "rescue" && <Check className="h-3.5 w-3.5 text-amber-400" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRoleSwitch("authority")}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                            userRole === "authority" ? "bg-red-950/60 text-red-300 font-bold border border-red-800/60" : "text-slate-300 hover:bg-slate-800/70"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-red-400" />
                            <span>{t("role_authority")}</span>
                          </div>
                          {userRole === "authority" && <Check className="h-3.5 w-3.5 text-red-400" />}
                        </button>
                      </div>

                      <div className="pt-1 mt-1 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={handleQuickLogoutSwitch}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-950/50 transition-colors text-left font-mono cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5 text-rose-400" />
                          <span>{t("logout")} &amp; {t("switch_role")} (/login)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Role Badge */}
            {renderRoleBadge(userRole)}

            {/* User Email */}
            <span className="text-xs text-slate-300 font-mono hidden md:inline truncate max-w-[180px]">
              {userEmail}
            </span>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-800 bg-slate-900 hover:bg-red-950 hover:text-red-300 text-slate-300 text-xs flex items-center gap-1.5 h-8 px-3"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 pb-10">
        {children}
      </main>

      {/* Global Realtime Toast Alerts */}
      <Toaster position="top-right" richColors theme="dark" closeButton />
    </div>
  );
}
