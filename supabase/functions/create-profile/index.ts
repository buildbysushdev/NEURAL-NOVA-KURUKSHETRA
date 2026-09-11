// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 2: Auth & Profile Management
// FILE: supabase/functions/create-profile/index.ts
// ROLE: Senior Backend Architect
// TARGET RUNTIME: Deno (Supabase Edge Functions)
// =========================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface AuthWebhookPayload {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id: string;
    email: string;
    phone?: string;
    raw_user_meta_data?: {
      phone?: string;
      role?: string;
      location_json?: Record<string, any>;
    };
  };
}

serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[create-profile] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
      return new Response(
        JSON.stringify({ error: "Internal server configuration error." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize elevated Supabase Admin client to write directly to public.profiles
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse incoming webhook body
    const body: AuthWebhookPayload = await req.json();
    const userRecord = body.record || body;

    // Validate required fields
    if (!userRecord || !userRecord.id || !userRecord.email) {
      console.warn("[create-profile] Received invalid payload: missing user id or email.");
      return new Response(
        JSON.stringify({ error: "Invalid user data provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Security Check: Enforce role defaults to 'citizen'.
    // Even if client attempts to pass role='authority' in metadata, we override to 'citizen'.
    const enforcedRole = "citizen";

    const phone =
      userRecord.phone ||
      userRecord.raw_user_meta_data?.phone ||
      null;

    const locationJson =
      userRecord.raw_user_meta_data?.location_json || {
        lat: 13.0827,
        lng: 80.2707,
        address: "Chennai Command Zone",
      };

    // Insert or update profile row in public.profiles
    // Note: NEVER log user passwords, tokens, or credential hashes
    const { data: profile, error: insertError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userRecord.id,
          email: userRecord.email,
          role: enforcedRole,
          phone: phone,
          location_json: locationJson,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("id, email, role, phone, location_json, created_at")
      .single();

    if (insertError) {
      console.error("[create-profile] Error inserting profile row:", insertError.message);
      return new Response(
        JSON.stringify({ error: "Failed to create user profile in database." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log the successful profile sync into audit_logs
    await supabaseAdmin.from("audit_logs").insert([
      {
        agent_name: "auth-sync-trigger",
        action: "PROFILE_CREATED",
        details_json: {
          user_id: profile.id,
          email: profile.email,
          role: profile.role,
        },
        timestamp: new Date().toISOString(),
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile synchronized successfully.",
        profile: {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          phone: profile.phone,
          location_json: profile.location_json,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    // Ensure no sensitive credentials leak in stack traces
    console.error("[create-profile] Unhandled exception:", error.message || error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred during profile synchronization." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
