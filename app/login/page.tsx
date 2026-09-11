"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Login & Responder Authentication Portal (app/login/page.tsx)
 * ==============================================================================
 * 
 * Command Glass Design System:
 * - Ambient background radial glows and subtle grid texture
 * - Glassmorphic rounded-2xl cards with soft borders
 * - 1-Click quick persona buttons (Citizen, Rescue, Authority) with active glow
 * - 100% Graceful auth error handling with human-readable guidance
 * - Instant role session persistence across cookies & localStorage
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, getUserRole, UserRole } from "@/lib/supabaseClient";
import {
  Shield,
  ShieldAlert,
  Users,
  Radio,
  Activity,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Lock,
  Sparkles,
  KeyRound,
  Mail
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("commander@kurukshetra.gov.in");
  const [password, setPassword] = useState<string>("Authority@Demo2026");
  const [selectedRole, setSelectedRole] = useState<UserRole>("authority");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * Translates any Supabase or network error into a human-readable message.
   * Guarantees raw error objects or [object Object] are never displayed.
   */
  const parseAuthError = (error: any): string => {
    if (!error) return "An unexpected error occurred during authentication. Please retry.";
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return "Network connection lost. Please verify your internet connectivity and re-attempt authentication.";
    }
    const msg = (error.message || error.error_description || String(error)).toLowerCase();

    if (msg.includes("invalid login credentials") || msg.includes("invalid credential") || msg.includes("wrong password")) {
      return "Authentication rejected: The credentials provided do not match our identity records.";
    }
    if (msg.includes("jwt expired") || msg.includes("session expired") || msg.includes("token is expired")) {
      return "Your active session token has expired. Please sign in again to refresh your credentials.";
    }
    if (msg.includes("popup closed") || msg.includes("user closed") || msg.includes("cancelled") || msg.includes("closed by user")) {
      return "OAuth verification was aborted because the identity popup was closed before completing.";
    }
    if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("failed to fetch")) {
      return "Unable to reach the authentication gateway. Please check your network and retry.";
    }
    if (msg.includes("email not confirmed")) {
      return "This account requires email verification. Please inspect your inbox for the confirmation link.";
    }
    return error.message || "Authentication attempt was unsuccessful. Please check your inputs and try again.";
  };

  const prefillCredentials = (role: UserRole) => {
    setSelectedRole(role);
    if (role === "citizen") {
      setEmail("citizen@kurukshetra.gov.in");
      setPassword("Citizen@Demo2026");
    } else if (role === "rescue") {
      setEmail("rescue@kurukshetra.gov.in");
      setPassword("Rescue@Demo2026");
    } else {
      setEmail("commander@kurukshetra.gov.in");
      setPassword("Authority@Demo2026");
    }
    setErrorMsg(null);
  };

  useEffect(() => {
    prefillCredentials("authority");
  }, []);

  const executeLogin = async (loginEmail: string, loginPassword: string, defaultRole?: UserRole) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      const detectedRole: UserRole =
        defaultRole ||
        (loginEmail.includes("rescue")
          ? "rescue"
          : loginEmail.includes("authority") || loginEmail.includes("commander")
          ? "authority"
          : selectedRole || "citizen");

      // 1. Attempt live Supabase Auth
      if (isConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
          });

          if (!error && data?.user) {
            const role = await getUserRole(data.user.id);
            localStorage.setItem("kurukshetra_active_role", role);
            localStorage.setItem("kurukshetra_active_email", data.user.email || loginEmail);
            localStorage.setItem("kurukshetra_role", role);
            document.cookie = `kurukshetra_role=${role}; path=/; max-age=86400`;

            toast.success("Security Clearance Confirmed", {
              description: `Authenticated as ${role.toUpperCase()}. Entering operational console.`,
            });
            router.push(`/dashboard/${role}`);
            return;
          }

          if (error) {
            console.warn("Supabase auth failed, evaluating fallback:", error);
            setErrorMsg(parseAuthError(error));
            setLoading(false);
            return;
          }
        } catch (supaErr: any) {
          console.warn("Supabase network exception:", supaErr);
          setErrorMsg(parseAuthError(supaErr));
          setLoading(false);
          return;
        }
      }

      // 2. Demo environment fallback session
      localStorage.setItem("kurukshetra_active_role", detectedRole);
      localStorage.setItem("kurukshetra_active_email", loginEmail);
      localStorage.setItem("kurukshetra_role", detectedRole);
      document.cookie = `kurukshetra_role=${detectedRole}; path=/; max-age=86400`;

      toast.success("Demo Mode Authorized", {
        description: `Logged in as ${detectedRole.toUpperCase()} (Operational Session Active).`,
      });

      router.push(`/dashboard/${detectedRole}`);
    } catch (err: any) {
      console.error("Unhandled login exception:", err);
      setErrorMsg(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (!isConfigured || !supabase) {
        toast.info("Demo Mode Active", {
          description: "Google OAuth connects in production. Defaulting to Authority Commander session.",
        });
        await executeLogin("commander@kurukshetra.gov.in", "Authority@Demo2026", "authority");
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`,
        },
      });

      if (error) {
        setErrorMsg(parseAuthError(error));
      }
    } catch (err: any) {
      setErrorMsg(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] bg-gradient-to-br from-[#0A0E17] via-[#111827] to-[#0F172A] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-ibm-sans relative overflow-hidden selection:bg-blue-500 selection:text-white">
      
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div
          className="fixed inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10 animate-slide-up">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/20 mb-1">
            <Shield className="w-6 h-6" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Kurukshetra PS20
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Autonomous Multi-Agent Crisis Command Gateway
          </p>
        </div>

        {/* Rapid Persona Selector Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => prefillCredentials("citizen")}
            className={`p-3 rounded-2xl border text-left transition-all backdrop-blur-md ${
              selectedRole === "citizen"
                ? "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/10 scale-[1.02]"
                : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-blue-400" strokeWidth={1.75} />
            </div>
            <span className="block text-xs font-semibold text-slate-100">Citizen</span>
            <span className="block text-[10px] font-mono text-slate-500">SOS / Reports</span>
          </button>

          <button
            type="button"
            onClick={() => prefillCredentials("rescue")}
            className={`p-3 rounded-2xl border text-left transition-all backdrop-blur-md ${
              selectedRole === "rescue"
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10 scale-[1.02]"
                : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2">
              <Radio className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
            </div>
            <span className="block text-xs font-semibold text-slate-100">Rescue</span>
            <span className="block text-[10px] font-mono text-slate-500">Field Squad</span>
          </button>

          <button
            type="button"
            onClick={() => prefillCredentials("authority")}
            className={`p-3 rounded-2xl border text-left transition-all backdrop-blur-md ${
              selectedRole === "authority"
                ? "bg-red-500/15 border-red-500/40 text-red-300 shadow-lg shadow-red-500/10 scale-[1.02]"
                : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center mb-2">
              <Activity className="w-4 h-4 text-red-400" strokeWidth={1.75} />
            </div>
            <span className="block text-xs font-semibold text-slate-100">Authority</span>
            <span className="block text-[10px] font-mono text-slate-500">HQ Console</span>
          </button>
        </div>

        {/* Login Form Glass Container */}
        <div className="glass-panel p-6 sm:p-7 shadow-2xl border border-white/[0.08] backdrop-blur-2xl bg-[#111827]/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeLogin(email, password);
            }}
            className="space-y-4"
          >
            {/* Error Message Notice */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="flex-1">
                  <p className="font-semibold text-xs text-red-300">Authentication Notice</p>
                  <p className="text-xs text-red-400 mt-0.5 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Operational Identity / Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition"
                placeholder="identity@kurukshetra.gov.in"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Security Clearance Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition"
                placeholder="••••••••••••"
              />
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2 mt-2 ${
                selectedRole === "authority"
                  ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-500/20"
                  : selectedRole === "rescue"
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-500/20"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-500/20"
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 font-mono text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  Verifying Credentials...
                </span>
              ) : selectedRole === "authority" ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate Authority Commander</span>
                </>
              ) : selectedRole === "rescue" ? (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Login as Rescue Specialist</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Enter Citizen Emergency Portal</span>
                </>
              )}
            </button>

            {/* Secondary Google SSO Button */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <span>1-Click Identity Authentication via Google</span>
            </button>
          </form>
        </div>

        {/* Government Directive Notice */}
        <div className="text-center">
          <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
            STATE EMERGENCY DIRECTIVE // RLS SECURITY ENFORCED
          </p>
        </div>

      </div>
    </div>
  );
}
