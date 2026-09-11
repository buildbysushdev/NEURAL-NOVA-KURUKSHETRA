"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 — Dashboard Layout (app/dashboard/layout.tsx)
 * ==============================================================================
 * THREE COMPLETELY SEPARATE PORTAL SHELLS:
 *   - /citizen  → Warm light mode, mobile-first, NO sidebar, bottom nav + floating chatbot
 *   - /rescue   → Dark amber theme, NO authority sidebar, field-ops top bar + bottom tabs
 *   - /authority → Full command glass: sidebar + topbar (unchanged)
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
import { AgentStatusBar } from "@/components/ui/AgentStatusBar";
import { FloatingChatbotButton } from "@/components/citizen/FloatingChatbotButton";

// ─── helpers ──────────────────────────────────────────────────────────────────

function CitizenShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { href: "/dashboard/citizen", label: "🏠", text: "Home" },
    { href: "/dashboard/citizen?tab=report", label: "⚠️", text: "Report" },
    { href: "/dashboard/citizen?tab=map", label: "📍", text: "Shelters" },
    { href: "/dashboard/citizen?tab=chat", label: "💬", text: "Help" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #F6F4EF 0%, #EDE9E0 100%)",
        fontFamily: "'Public Sans', system-ui, sans-serif",
      }}
    >
      {/* Citizen Top Bar — simple, warm, NO ops sidebar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 56,
          background: "rgba(255,255,255,0.92)",
          borderBottom: "1px solid #E2D9C8",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: "linear-gradient(135deg, #ef4444, #f97316)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          🛡️
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
            Kurukshetra PS20
          </div>
          <div style={{ fontSize: 10, color: "#64748b" }}>Citizen Safety Portal</div>
        </div>
        <a
          href="tel:112"
          style={{
            marginLeft: "auto",
            padding: "6px 14px",
            borderRadius: 20,
            background: "#ef4444",
            color: "white",
            fontWeight: 700,
            fontSize: 11,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          📞 112
        </a>
        <button
          onClick={() => {
            localStorage.clear();
            router.push("/login");
          }}
          style={{
            marginLeft: 8,
            background: "none",
            border: "1px solid #E2D9C8",
            borderRadius: 8,
            padding: "4px 10px",
            fontSize: 10,
            color: "#64748b",
            cursor: "pointer",
          }}
        >
          Switch
        </button>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "16px 16px 100px" }}>
        {children}
      </main>

      {/* Floating AI Chatbot Button */}
      <FloatingChatbotButton />

      {/* Bottom Navigation */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "rgba(255,255,255,0.96)",
          borderTop: "1px solid #E2D9C8",
          backdropFilter: "blur(12px)",
          display: "flex",
          zIndex: 50,
        }}
      >
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              color:
                pathname === "/dashboard/citizen" && tab.text === "Home"
                  ? "#ef4444"
                  : "#64748b",
              textDecoration: "none",
              gap: 2,
              fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.label}</span>
            {tab.text}
          </a>
        ))}
      </nav>

      <Toaster richColors position="top-center" theme="light" />
    </div>
  );
}

function RescueShell({
  children,
  userEmail,
  onLogout,
}: {
  children: React.ReactNode;
  userEmail: string;
  onLogout: () => void;
}) {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B1120",
        color: "#f1f5f9",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}
    >
      {/* Rescue Top Bar — amber ops theme, NO authority sidebar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 64,
          background: "rgba(11,17,32,0.95)",
          borderBottom: "2px solid rgba(245,158,11,0.35)",
          backdropFilter: "blur(16px)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
        }}
      >
        {/* Left: Unit Identity */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            🚁
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#94a3b8",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              NDRF · FIELD CONSOLE
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>
              Rescue Squad Alpha
            </div>
          </div>
        </div>

        {/* Center: On Duty Badge */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              padding: "5px 14px",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 11,
              background: "rgba(16,185,129,0.15)",
              border: "1px solid #10b981",
              color: "#10b981",
              fontFamily: "monospace",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
                animation: "pulse 2s infinite",
              }}
            />
            ON DUTY
          </div>

          {/* Switch Portal */}
          <button
            onClick={() => router.push("/dashboard/authority")}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            Switch Portal
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: "16px 16px 90px" }}>{children}</main>

      {/* Rescue Bottom Nav — amber tabs */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "rgba(11,17,32,0.97)",
          borderTop: "2px solid rgba(245,158,11,0.35)",
          backdropFilter: "blur(12px)",
          display: "flex",
          zIndex: 50,
        }}
      >
        {[
          { label: "📋", text: "Missions", tabId: "missions" },
          { label: "🗺️", text: "OSM Terrain", tabId: "terrain" },
          { label: "🧠", text: "AI Measures", tabId: "measures" },
          { label: "📦", text: "Field Stock", tabId: "inventory" },
        ].map((tab) => (
          <button
            key={tab.text}
            onClick={() => {
              window.dispatchEvent(new CustomEvent("rescue_tab_change", { detail: tab.tabId }));
            }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              color: "#f59e0b",
              background: "none",
              border: "none",
              gap: 2,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18 }}>{tab.label}</span>
            {tab.text}
          </button>
        ))}
      </nav>

      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}

// ─── Main Layout Export ────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [userEmail, setUserEmail] = useState<string>("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    async function checkAuthAndRole() {
      try {
        let routeRole: UserRole | null = null;
        if (pathname?.includes("/authority")) routeRole = "authority";
        else if (pathname?.includes("/rescue")) routeRole = "rescue";
        else if (pathname?.includes("/citizen")) routeRole = "citizen";

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

        setUserRole(savedRole);
        setUserEmail(savedEmail);
        localStorage.setItem("kurukshetra_active_role", savedRole);
        localStorage.setItem("kurukshetra_active_email", savedEmail);
        setLoading(false);

        if (pathname === "/dashboard" || pathname === "/dashboard/") {
          router.push(`/dashboard/${savedRole}`);
          return;
        }
      } catch (err) {
        setUserRole("authority");
        setUserEmail("commander@kurukshetra.gov.in");
        setLoading(false);
      }
    }
    checkAuthAndRole();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      if (isConfigured && supabase) await supabase.auth.signOut();
    } catch {}
    localStorage.clear();
    document.cookie = "kurukshetra_role=; path=/; max-age=0";
    router.push("/login");
  };

  const handleRoleSwitch = (targetRole: UserRole) => {
    const emailForRole =
      targetRole === "citizen"
        ? "citizen@kurukshetra.gov.in"
        : targetRole === "rescue"
        ? "rescue@kurukshetra.gov.in"
        : "commander@kurukshetra.gov.in";

    localStorage.setItem("kurukshetra_active_role", targetRole);
    localStorage.setItem("kurukshetra_active_email", emailForRole);
    localStorage.setItem("kurukshetra_role", targetRole);
    document.cookie = `kurukshetra_role=${targetRole}; path=/; max-age=86400`;
    setUserRole(targetRole);
    setUserEmail(emailForRole);
    setMobileMenuOpen(false);
    router.push(`/dashboard/${targetRole}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-3" strokeWidth={1.75} />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Verifying Session...
        </p>
      </div>
    );
  }

  // ── CITIZEN: completely separate shell ────────────────────────────────────
  if (pathname?.includes("/citizen")) {
    return (
      <CitizenShell>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </CitizenShell>
    );
  }

  // ── RESCUE: separate amber ops shell ─────────────────────────────────────
  if (pathname?.includes("/rescue")) {
    return (
      <RescueShell userEmail={userEmail} onLogout={handleLogout}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </RescueShell>
    );
  }

  // ── AUTHORITY: full command glass with sidebar ─────────────────────────────
  return (
    <div className="min-h-screen flex flex-col relative bg-[#0B0F19] bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0F172A] text-slate-100 font-ibm-sans">
      {/* Dot-grid texture */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <AppTopbar
        userRole={userRole}
        userEmail={userEmail}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
        onMobileMenuToggle={() => setMobileMenuOpen(true)}
      />

      <div className="flex flex-1 relative overflow-hidden z-10">
        <AppSidebar
          userRole={userRole}
          onRoleSwitch={handleRoleSwitch}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

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

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24"
        >
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </motion.main>
      </div>

      <AgentStatusBar />
      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}
