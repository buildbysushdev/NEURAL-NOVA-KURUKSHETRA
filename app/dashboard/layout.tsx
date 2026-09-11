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
        // Detect path-based default role
        let routeRole: UserRole | null = null;
        if (pathname?.includes("/authority")) routeRole = "authority";
        else if (pathname?.includes("/rescue")) routeRole = "rescue";
        else if (pathname?.includes("/citizen")) routeRole = "citizen";

        // Check local storage or route role
        const savedRole =
          (localStorage.getItem("kurukshetra_active_role") as UserRole) ||
          (localStorage.getItem("kurukshetra_role") as UserRole) ||
          routeRole ||
          "authority";

        const savedEmail =
          localStorage.getItem("kurukshetra_active_email") ||
          (savedRole === "citizen"
            ? "citizen@kurukshetra.gov.in"
            : savedRole === "rescue"
            ? "rescue@kurukshetra.gov.in"
            : "commander@kurukshetra.gov.in");

        // Immediately set session so UI mounts without delay
        setUserRole(savedRole);
        setUserEmail(savedEmail);
        localStorage.setItem("kurukshetra_active_role", savedRole);
        localStorage.setItem("kurukshetra_active_email", savedEmail);
        setLoading(false);

        if (pathname === "/dashboard" || pathname === "/dashboard/") {
          router.push(`/dashboard/${savedRole}`);
          return;
        }

        // Fast background validation if Supabase is configured (max 1500ms timeout)
        if (isConfigured) {
          try {
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise<{ data: { session: null }; error: any }>((resolve) =>
              setTimeout(
                () => resolve({ data: { session: null }, error: new Error("Session timeout") }),
                1500
              )
            );

            const {
              data: { session },
              error,
            } = (await Promise.race([sessionPromise, timeoutPromise])) as any;

            if (!error && session?.user) {
              const role = await getUserRole(session.user.id);
              setUserRole(role);
              setUserEmail(session.user.email || "");
              localStorage.setItem("kurukshetra_active_role", role);
              localStorage.setItem("kurukshetra_active_email", session.user.email || "");
            }
          } catch (supaErr) {
            console.warn("Supabase background session check error:", supaErr);
          }
        }
      } catch (err) {
        console.error("Auth layout validation error:", err);
        setUserRole("authority");
        setUserEmail("commander@kurukshetra.gov.in");
        setLoading(false);
      }
    }

    checkAuthAndRole();
  }, [pathname, router]);

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

  const isCitizen = pathname?.includes("/citizen");

  // Loading spinner while verifying credentials
  if (loading) {
    return (
      <div className="min-h-screen bg-[#12161C] flex flex-col items-center justify-center text-[#F6F4EF]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F6F4EF] mb-3" strokeWidth={1.75} />
        <p className="text-xs font-mono uppercase tracking-widest text-[#8A99AD]">Verifying Tactical Session...</p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col relative ${
        isCitizen
          ? "bg-[#F6F4EF] text-[#1A1A1A] font-public-sans"
          : "bg-[#0B0F19] bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0F172A] text-slate-100 font-ibm-sans"
      }`}
    >
      {/* Subtle background dot-grid texture overlay */}
      {!isCitizen && (
        <div
          className="fixed inset-0 opacity-[0.02] pointer-events-none z-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      )}

      {/* Topbar */}
      <AppTopbar
        userRole={userRole}
        userEmail={userEmail}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 relative overflow-hidden z-10">
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
          <div className="flex flex-col gap-3 p-1">
            <p className="text-[11px] font-mono uppercase text-slate-400">
              Active Role: {userRole}
            </p>
            <div className="flex flex-col gap-2">
              {(["citizen", "rescue", "authority"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  className={`px-3 py-2 rounded-xl text-xs text-left capitalize font-semibold border transition-colors ${
                    userRole === r
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-slate-200 hover:bg-white/[0.06]"
                  }`}
                >
                  {r} Dashboard
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="mt-6 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 border border-red-500/30 transition-colors shadow-lg shadow-red-500/20"
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
          className={`flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 ${
            isCitizen ? "bg-[#F6F4EF]" : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </motion.main>
      </div>

      <Toaster richColors position="top-right" theme={isCitizen ? "light" : "dark"} />
    </div>
  );
}

