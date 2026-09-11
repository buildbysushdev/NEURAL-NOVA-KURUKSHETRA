import { NextResponse } from "next/server";
import { supabase, isConfigured } from "@/lib/supabaseClient";
import { UserProfile } from "@/types/backend";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - BACKEND API CONTRACT
 * API Route: /api/auth/session (GET)
 * ==============================================================================
 * 
 * Returns authenticated user session, profile, and emergency role.
 */

export async function GET() {
  try {
    if (isConfigured && supabase) {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (user && !authError) {
        // Fetch corresponding profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          const userProfile: UserProfile = {
            id: profile.id,
            email: profile.email || user.email || "",
            role: profile.role || "citizen",
            phone: profile.phone || null,
            location_json: profile.location_json || {
              lat: 13.0827,
              lng: 80.2707,
              address: "State Emergency Operations Center"
            },
            created_at: profile.created_at || user.created_at
          };

          return NextResponse.json({
            authenticated: true,
            user: userProfile
          });
        }
      }
    }

    // Default mock session for development / offline evaluation
    const defaultUser: UserProfile = {
      id: "670c5e12-8809-411a-8cbb-d3f37477ebba",
      email: "commander@kurukshetra.gov.in",
      role: "authority",
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
      user: defaultUser
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}
