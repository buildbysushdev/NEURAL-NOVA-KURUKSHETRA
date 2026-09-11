// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 2: Auth & Profile Management
// FILE: app/api/auth/session/route.ts
// ROLE: Senior Backend Architect & Frontend Lead
// DESCRIPTION: Secure Next.js 14 API route to inspect session and return
//              the current user's profile and verified role using @supabase/ssr.
// =========================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabase as browserSupabase, isConfigured } from "@/lib/supabaseClient";
import type { SessionResponse } from "@/types/auth";
import type { UserProfile } from "@/types/backend";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/session
 * Inspects request cookies using @supabase/ssr, validates authentication,
 * and returns the authenticated user's role and profile data.
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // In standalone demo/development mode, return standard mock session for frontend testing
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder") || supabaseUrl.includes("your-project")) {
      const demoRole = (req.nextUrl.searchParams.get("role") as any) || "authority";
      const demoLang = (req.nextUrl.searchParams.get("lang") as any) || "en";

      const defaultUser: UserProfile = {
        id: "670c5e12-8809-411a-8cbb-d3f37477ebba",
        email: "commander@kurukshetra.gov.in",
        role: demoRole,
        phone: "+91-9884012345",
        location_json: {
          lat: 13.0827,
          lng: 80.2707,
          address: "State Emergency Operations Center, Chennai"
        },
        created_at: "2026-09-11T10:00:00.000Z"
      };

      return NextResponse.json({
        authenticated: true,
        mode: "local_demo_environment",
        user: defaultUser
      });
    }

    // Initialize Supabase Server Client with @supabase/ssr cookie management
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignored if called from a Server Component context
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignored if called from a Server Component context
          }
        },
      },
    });

    // 1. Authenticate user from JWT in cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<SessionResponse>(
        {
          authenticated: false,
          user: null,
          message: "No active session found.",
        },
        { status: 200 }
      );
    }

    // 2. Fetch verified role and metadata from public.profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, phone, preferred_language, location_json, created_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          role: "citizen",
          phone: user.phone || null,
          preferred_language: "en",
          location_json: { lat: 13.0827, lng: 80.2707 },
          created_at: user.created_at,
        },
      });
    }

    // 3. Return sanitized profile data
    return NextResponse.json({
      authenticated: true,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        phone: profile.phone,
        preferred_language: profile.preferred_language || "en",
        location_json: profile.location_json,
        created_at: profile.created_at,
      },
    });
  } catch (error: any) {
    console.error("[api/auth/session] Exception while fetching session:", error.message || error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Internal server error validating user session.",
      },
      { status: 500 }
    );
  }
}
