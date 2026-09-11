"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Login & Responder Authentication Portal (app/login/page.tsx)
 * ==============================================================================
 * 
 * Production-Grade Institutional Emergency Design:
 * - Base: #12161C, Card: #181E26, Border: #222933, Text: #F6F4EF
 * - Verb-driven action buttons (no generic "Submit", "OK")
 * - 100% Graceful Supabase Auth error translation (no raw error objects)
 * - Safe demo prefill personas with 1-click authentication
 * - Wrapped in high-contrast accessibility focus rings
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, getUserRole, UserRole } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Users, Radio, Activity, AlertCircle, ArrowRight, Loader2, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("commander@kurukshetra.gov.in");
  const [password, setPassword] = useState<string>("Authority@Demo2026");
  const [fullName, setFullName] = useState<string>("");
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
              description: `Authenticated as ${role.toUpperCase()}. Entering operational zone.`,
            });
            router.push(`/dashboard/${role}`);
            return;
          }

          if (error) {
            console.warn("Supabase auth failed, evaluating fallback:", error);
            // If live credentials failed, show the specific parsed error
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
    <div className="min-h-screen bg-[#12161C] text-[#F6F4EF] flex flex-col justify-center items-center p-4 sm:p-6 font-ibm-sans">
      <div className="w-full max-w-md space-y-4">
        
        {/* Header Branding */}
        <div className="text-center space-y-1.5 mb-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-sm bg-[#181E26] border border-[#222933] text-[#791F1F] mb-1">
            <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h1 className="text-sm font-bold uppercase tracking-widest font-mono text-[#F6F4EF]">
            KURUKSHETRA PS20 // ACCESS GATE
          </h1>
          <p className="text-xs text-[#8A99AD]">
            Autonomous Disaster Relief & Multi-Agent Emergency Command
          </p>
        </div>

        {/* Rapid Persona Switcher Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => prefillCredentials("citizen")}
            className={`p-2.5 rounded-sm border text-left transition-colors ${
              selectedRole === "citizen"
                ? "border-[#F6F4EF] bg-[#181E26] text-[#F6F4EF]"
                : "border-[#222933] bg-[#12161C] text-[#8A99AD] hover:bg-[#181E26]"
            }`}
          >
            <Users className="w-4 h-4 mb-1.5" strokeWidth={1.75} />
            <span className="block text-xs font-semibold">Citizen</span>
            <span className="block text-[10px] font-mono text-[#8A99AD]">SOS / Reports</span>
          </button>

          <button
            type="button"
            onClick={() => prefillCredentials("rescue")}
            className={`p-2.5 rounded-sm border text-left transition-colors ${
              selectedRole === "rescue"
                ? "border-[#F6F4EF] bg-[#181E26] text-[#F6F4EF]"
                : "border-[#222933] bg-[#12161C] text-[#8A99AD] hover:bg-[#181E26]"
            }`}
          >
            <Radio className="w-4 h-4 mb-1.5" strokeWidth={1.75} />
            <span className="block text-xs font-semibold">Rescue</span>
            <span className="block text-[10px] font-mono text-[#8A99AD]">Field Ops</span>
          </button>

          <button
            type="button"
            onClick={() => prefillCredentials("authority")}
            className={`p-2.5 rounded-sm border text-left transition-colors ${
              selectedRole === "authority"
                ? "border-[#F6F4EF] bg-[#181E26] text-[#F6F4EF]"
                : "border-[#222933] bg-[#12161C] text-[#8A99AD] hover:bg-[#181E26]"
            }`}
          >
            <Activity className="w-4 h-4 mb-1.5" strokeWidth={1.75} />
            <span className="block text-xs font-semibold">Authority</span>
            <span className="block text-[10px] font-mono text-[#8A99AD]">HQ Command</span>
          </button>
        </div>

        {/* Login Form Card */}
        <Card className="border border-[#222933] bg-[#181E26] rounded-sm p-6 shadow-none">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeLogin(email, password);
            }}
            className="space-y-4"
          >
            {/* Error Message Display */}
            {errorMsg && (
              <div className="p-3 rounded-sm bg-[#12161C] border border-[#791F1F] border-l-4 border-l-[#791F1F] text-xs text-[#F6F4EF] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#791F1F] flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <div className="flex-1">
                  <p className="font-semibold text-xs text-[#F6F4EF]">Authentication Notice</p>
                  <p className="text-xs text-[#8A99AD] mt-0.5 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-[#8A99AD]">
                Operational Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#12161C] border-[#222933] text-[#F6F4EF] text-xs font-mono h-9 rounded-sm focus-visible:ring-2 focus-visible:ring-[#F6F4EF]"
                placeholder="identity@kurukshetra.gov.in"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase tracking-wider text-[#8A99AD]">
                Security Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#12161C] border-[#222933] text-[#F6F4EF] text-xs font-mono h-9 rounded-sm focus-visible:ring-2 focus-visible:ring-[#F6F4EF]"
                placeholder="••••••••••••"
              />
            </div>

            {/* Primary Action Button (Specific Verb Phrase) */}
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full h-10 mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                  Verifying Security Clearance...
                </span>
              ) : selectedRole === "authority" ? (
                "Authenticate as Authority Commander"
              ) : selectedRole === "rescue" ? (
                "Login as Rescue Specialist"
              ) : (
                "Enter Citizen Emergency Portal"
              )}
            </Button>

            {/* Secondary Google OAuth */}
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full h-9"
            >
              Verify Identity via Google SSO
            </Button>
          </form>
        </Card>

        {/* Security & RLS Compliance Notice */}
        <div className="text-center">
          <p className="text-[11px] font-mono text-[#8A99AD] uppercase tracking-wider">
            GOVERNMENT SECURITY DIRECTIVE // ROW LEVEL SECURITY ENFORCED
          </p>
        </div>

      </div>
    </div>
  );
}
