// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// PHASE 7: Accessibility & Localization Support
// FILE: app/api/profile/update/route.ts
// ROLE: Senior Backend Architect
// DESCRIPTION: Server-side route to update user profile preferences,
//              specifically `preferred_language` ('en' | 'hi'), phone, or location.
// =========================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupportedLanguage } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const body = await req.json();
    const { preferred_language, phone, location_json } = body;

    // Validate language if provided
    if (preferred_language && !["en", "hi"].includes(preferred_language)) {
      return NextResponse.json(
        { success: false, error: "Invalid language. Supported values: 'en', 'hi'." },
        { status: 400 }
      );
    }

    // In demo environment without live Supabase
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your-project")) {
      return NextResponse.json({
        success: true,
        mode: "local_demo_environment",
        message: "Profile preferences updated successfully.",
        updated_preferences: {
          preferred_language: preferred_language || "en",
          phone: phone || null,
          location_json: location_json || null,
        },
      });
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Active session required." },
        { status: 401 }
      );
    }

    const updatePayload: Record<string, any> = {};
    if (preferred_language) updatePayload.preferred_language = preferred_language as SupportedLanguage;
    if (phone !== undefined) updatePayload.phone = phone;
    if (location_json !== undefined) updatePayload.location_json = location_json;

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)
      .select("id, email, role, phone, preferred_language, location_json")
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile preferences updated successfully.",
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error("[api/profile/update] Exception:", error.message || error);
    return NextResponse.json(
      { success: false, error: "Internal server error updating profile." },
      { status: 500 }
    );
  }
}
