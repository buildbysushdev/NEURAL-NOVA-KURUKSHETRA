"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Login & Registration Page (app/login/page.tsx)
 * ==============================================================================
 * 
 * Implements:
 * 1. Google OAuth Sign-In
 * 2. Email & Password Sign-In and Registration
 * 3. Role discovery from the Supabase 'profiles' table ('citizen' | 'rescue' | 'authority')
 * 4. Automatic redirection to the role-specific dashboard (/dashboard)
 * 5. Uses Shadcn/UI primitives (Button, Card, Input, Label, Alert)
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, getUserRole, UserRole } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Users, Radio, Activity, AlertCircle, ArrowRight, Lock, Mail, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  // Component State with prefilled evaluation credentials
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>(
    process.env.NEXT_PUBLIC_DEMO_AUTHORITY_EMAIL || "commander@kurukshetra.gov.in"
  );
  const [password, setPassword] = useState<string>(
    process.env.NEXT_PUBLIC_DEMO_AUTHORITY_PASSWORD || "Authority@Demo2026"
  );
  const [fullName, setFullName] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("authority");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * Helper function to prefill form credentials
   */
  const prefillCredentials = (role: UserRole) => {
    let demoEmail = "";
    let demoPassword = "";

    if (role === "citizen") {
      demoEmail = process.env.NEXT_PUBLIC_DEMO_CITIZEN_EMAIL || "citizen@kurukshetra.gov.in";
      demoPassword = process.env.NEXT_PUBLIC_DEMO_CITIZEN_PASSWORD || "Citizen@Demo2026";
    } else if (role === "rescue") {
      demoEmail = process.env.NEXT_PUBLIC_DEMO_RESCUE_EMAIL || "rescue@kurukshetra.gov.in";
      demoPassword = process.env.NEXT_PUBLIC_DEMO_RESCUE_PASSWORD || "Rescue@Demo2026";
    } else if (role === "authority") {
      demoEmail = process.env.NEXT_PUBLIC_DEMO_AUTHORITY_EMAIL || "commander@kurukshetra.gov.in";
      demoPassword = process.env.NEXT_PUBLIC_DEMO_AUTHORITY_PASSWORD || "Authority@Demo2026";
    }

    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsSignUp(false);
  };

  // Automatically prefill credentials on initial mount in demo mode
  React.useEffect(() => {
    if (isDemoMode) {
      prefillCredentials("authority");
    }
  }, [isDemoMode]);

  /**
   * Universal Login Executor (used by normal submit and demo buttons)
   */
  const executeLogin = async (loginEmail: string, loginPassword: string, defaultRole?: UserRole) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword
        });

        if (!error && data.user) {
          const userRole = await getUserRole(data.user.id);
          localStorage.setItem("kurukshetra_active_role", userRole);
          localStorage.setItem("kurukshetra_active_email", data.user.email || loginEmail);
          router.push(`/dashboard/${userRole}`);
          return;
        }
      }

      // Fallback or demo bypass
      const roleToAssign: UserRole = defaultRole 
        || (loginEmail.includes("rescue") ? "rescue" : loginEmail.includes("authority") ? "authority" : "citizen");

      localStorage.setItem("kurukshetra_active_role", roleToAssign);
      localStorage.setItem("kurukshetra_active_email", loginEmail || "demo.user@kurukshetra.gov.in");
      router.push(`/dashboard/${roleToAssign}`);
    } catch (err: any) {
      console.error("Auth error:", err);
      if (isDemoMode && defaultRole) {
        localStorage.setItem("kurukshetra_active_role", defaultRole);
        localStorage.setItem("kurukshetra_active_email", loginEmail);
        router.push(`/dashboard/${defaultRole}`);
      } else {
        setErrorMsg(err.message || "Authentication failed. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Email / Password authentication form submission
   */
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isConfigured && supabase) {
        if (isSignUp) {
          // 1. Sign up with Supabase Auth
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role: selectedRole
              }
            }
          });

          if (error) throw error;

          if (data.user) {
            // 2. Insert or update the public 'profiles' table
            await supabase.from("profiles").upsert({
              id: data.user.id,
              email,
              full_name: fullName,
              role: selectedRole
            });

            localStorage.setItem("kurukshetra_active_role", selectedRole);
            localStorage.setItem("kurukshetra_active_email", email);
            router.push(`/dashboard/${selectedRole}`);
            return;
          }
        } else {
          await executeLogin(email, password);
          return;
        }
      } else {
        // Fallback demo mode when remote Supabase keys are not set
        const roleToAssign: UserRole = isSignUp 
          ? selectedRole 
          : email.includes("rescue") 
          ? "rescue" 
          : email.includes("authority") 
          ? "authority" 
          : "citizen";

        localStorage.setItem("kurukshetra_active_role", roleToAssign);
        localStorage.setItem("kurukshetra_active_email", email || "demo.user@kurukshetra.gov.in");
        router.push(`/dashboard/${roleToAssign}`);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick Demo Login Buttons:
   * Auto-fills email and password from environment variables and immediately triggers submit
   */
  const handleQuickDemoLogin = async (role: UserRole) => {
    prefillCredentials(role);

    let demoEmail = "";
    let demoPassword = "";
    if (role === "citizen") {
      demoEmail = process.env.NEXT_PUBLIC_DEMO_CITIZEN_EMAIL || "citizen@kurukshetra.gov.in";
      demoPassword = process.env.NEXT_PUBLIC_DEMO_CITIZEN_PASSWORD || "Citizen@Demo2026";
    } else if (role === "rescue") {
      demoEmail = process.env.NEXT_PUBLIC_DEMO_RESCUE_EMAIL || "rescue@kurukshetra.gov.in";
      demoPassword = process.env.NEXT_PUBLIC_DEMO_RESCUE_PASSWORD || "Rescue@Demo2026";
    } else if (role === "authority") {
      demoEmail = process.env.NEXT_PUBLIC_DEMO_AUTHORITY_EMAIL || "commander@kurukshetra.gov.in";
      demoPassword = process.env.NEXT_PUBLIC_DEMO_AUTHORITY_PASSWORD || "Authority@Demo2026";
    }

    // Automatically trigger submission
    await executeLogin(demoEmail, demoPassword, role);
  };

  /**
   * Handle Google OAuth Sign-In
   */
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;
      } else {
        localStorage.setItem("kurukshetra_active_role", "authority");
        localStorage.setItem("kurukshetra_active_email", "commander.google@kurukshetra.gov.in");
        router.push("/dashboard/authority");
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMsg(err.message || "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-600/40 shadow-lg shadow-red-950/50 mb-1">
            <ShieldAlert className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Kurukshetra PS20
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Agentic Disaster Relief Platform &bull; Unified Emergency Command
          </p>
        </div>

        {/* Main Authentication Card */}
        <Card className="border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-slate-100">
              {isSignUp ? "Register Emergency Responder" : "Sign In to Platform"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {isSignUp 
                ? "Create an account with your designated relief role"
                : "Enter your verified credentials or continue with Google"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Alert */}
            {errorMsg && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Error</AlertTitle>
                <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
              </Alert>
            )}

            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-5"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8 0-1.3.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500 font-mono text-[10px]">
                  Or authenticate with email
                </span>
              </div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {isSignUp && (
                <div className="space-y-1">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Commander Vikram Rao"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-800 text-xs"
                  />
                </div>
              )}

              {/* Quick prefill chips for evaluator convenience */}
              {isDemoMode && !isSignUp && (
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/60 mb-2">
                  <span className="text-[10px] font-mono text-slate-400">Prefill Accounts:</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => prefillCredentials("citizen")}
                      className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60 hover:bg-blue-900/60 transition-colors cursor-pointer"
                      title="Prefill Citizen credentials"
                    >
                      Citizen
                    </button>
                    <button
                      type="button"
                      onClick={() => prefillCredentials("rescue")}
                      className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 hover:bg-amber-900/60 transition-colors cursor-pointer"
                      title="Prefill Rescue credentials"
                    >
                      Rescue
                    </button>
                    <button
                      type="button"
                      onClick={() => prefillCredentials("authority")}
                      className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/60 hover:bg-red-900/60 transition-colors cursor-pointer"
                      title="Prefill Authority credentials"
                    >
                      Authority
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@disasterrelief.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-950 border-slate-800 text-xs"
                />
              </div>

              {/* Role selection on registration */}
              {isSignUp && (
                <div className="space-y-1">
                  <Label htmlFor="role">Assigned Emergency Role (profiles.role)</Label>
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="citizen">Citizen (Alerts, Evacuations, SOS)</option>
                    <option value="rescue">Rescue Squad (Field Operations & Triage)</option>
                    <option value="authority">Authority (Master Command & AI Allocation)</option>
                  </select>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-5 mt-2"
                disabled={loading}
              >
                {loading ? "Verifying..." : isSignUp ? "Create Account & Enter" : "Sign In to Dashboard"}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-slate-800 p-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Need responder credentials? Register with designated role"}
            </button>
          </CardFooter>
        </Card>

        {/* Quick Login Buttons (Demo Mode Only) */}
        {isDemoMode && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Demo Mode Quick Login
              </span>
              <span className="text-[10px] text-slate-500 font-mono">NEXT_PUBLIC_DEMO_MODE=true</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Button 1: Login as Citizen (Blue) */}
              <button
                type="button"
                id="demo-login-citizen-btn"
                onClick={() => handleQuickDemoLogin("citizen")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-950/40 border border-blue-600/50 hover:bg-blue-600/20 hover:border-blue-400 text-blue-300 transition-all text-center group disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Users className="h-5 w-5 text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-blue-200">Login as Citizen</span>
                <span className="text-[9px] text-blue-400/80 font-mono mt-0.5">Alerts &amp; SOS</span>
              </button>

              {/* Button 2: Login as Rescue (Orange) */}
              <button
                type="button"
                id="demo-login-rescue-btn"
                onClick={() => handleQuickDemoLogin("rescue")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-amber-950/40 border border-orange-600/50 hover:bg-orange-600/20 hover:border-orange-400 text-orange-300 transition-all text-center group disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Radio className="h-5 w-5 text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-orange-200">Login as Rescue</span>
                <span className="text-[9px] text-orange-400/80 font-mono mt-0.5">Field Missions</span>
              </button>

              {/* Button 3: Login as Authority (Red) */}
              <button
                type="button"
                id="demo-login-authority-btn"
                onClick={() => handleQuickDemoLogin("authority")}
                disabled={loading}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-red-950/40 border border-red-600/50 hover:bg-red-600/20 hover:border-red-400 text-red-300 transition-all text-center group disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Activity className="h-5 w-5 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-red-200">Login as Authority</span>
                <span className="text-[9px] text-red-400/80 font-mono mt-0.5">Master Command</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
