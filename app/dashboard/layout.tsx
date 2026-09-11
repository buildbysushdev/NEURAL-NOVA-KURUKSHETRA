"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Production-Grade Dashboard Layout (app/dashboard/layout.tsx)
 * ==============================================================================
 * 
 * Features:
 * - Emergency Modern Aesthetic with Framer Motion transitions
 * - Collapsible AppSidebar with direct role switcher
 * - Telemetry-rich AppTopbar with live Defcon status, profile, language switch
 * - Mobile responsive drawer support via Shadcn Sheet
 * - Preserves all authentication checks & Supabase RLS session logic
 */

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, isConfigured, getUserRole, UserRole } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { Sheet } from "@/components/ui/sheet";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Authentication & session state
  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

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
    setMobileMenuOpen(false);
    router.push(`/dashboard/${targetRole}`);
  };

  // Loading spinner while verifying credentials
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Verifying Tactical Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Topbar */}
      <AppTopbar
        userRole={userRole}
        userEmail={userEmail}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <AppSidebar
          userRole={userRole}
          onRoleSwitch={handleRoleSwitch}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Mobile Drawer (Sheet) */}
        <Sheet
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          side="left"
          title="Tactical Navigation"
          description="Emergency Response Switchboard"
        >
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-mono uppercase text-slate-400">Active Role: {userRole}</p>
            <div className="flex flex-col gap-2">
              {(["citizen", "rescue", "authority"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  className={`px-3 py-2 rounded-md text-xs text-left capitalize font-semibold ${
                    userRole === r ? "bg-red-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {r} Dashboard
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="mt-6 px-3 py-2 rounded-md text-xs text-red-400 bg-red-950/40 border border-red-900/60"
            >
              Sign Out
            </button>
          </div>
        </Sheet>

        {/* Dynamic Animated Page Content */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 min-w-0 overflow-y-auto bg-slate-950/60 p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </motion.main>
      </div>

      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}
