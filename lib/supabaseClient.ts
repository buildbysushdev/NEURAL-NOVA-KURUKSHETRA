/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Supabase Client Initialization & Authentication Utility
 * ==============================================================================
 * 
 * This file configures the Supabase JavaScript Client using environment variables.
 * It is used across the frontend for Authentication, PostgreSQL queries,
 * and Supabase Realtime subscriptions.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Read environment variables from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Check if valid live credentials are provided
export const isConfigured: boolean = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project") &&
  !supabaseUrl.includes("placeholder") &&
  !supabaseAnonKey.includes("placeholder")
);

// Fallback URL and Key so the client never crashes during development / testing
const fallbackUrl = "https://placeholder-project.supabase.co";
const fallbackKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

/**
 * The unified Supabase client instance used throughout the app.
 */
export const supabase: SupabaseClient = createClient(
  isConfigured ? supabaseUrl : fallbackUrl,
  isConfigured ? supabaseAnonKey : fallbackKey
);

/**
 * Defined user roles matching the project requirements:
 * - 'citizen': General public for hazard reporting and SOS triggers
 * - 'rescue': NDRF / SDRF field squads for mission triage and victim rescue
 * - 'authority': Disaster Management Authority / Commanders for agentic allocation
 */
export type UserRole = "citizen" | "rescue" | "authority";

/**
 * Profile interface representing rows in the 'profiles' table.
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at?: string;
}

/**
 * Fetch a user's role from the 'profiles' table in Supabase.
 * In production, the backend team has a Postgres trigger that creates
 * a row in 'profiles' on auth.users signup.
 * 
 * @param userId - Supabase auth user UUID
 * @returns Promise<UserRole> - Assigned role ('citizen' | 'rescue' | 'authority')
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  if (!userId) return "citizen";

  if (isConfigured) {
    try {
      // Query the 'profiles' table for this user ID
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Could not fetch user role from 'profiles' table:", error.message);
        return "citizen";
      }

      return (data?.role as UserRole) || "citizen";
    } catch (err) {
      console.error("Error connecting to Supabase profiles table:", err);
      return "citizen";
    }
  }

  // Graceful fallback for local evaluation / offline testing
  if (typeof window !== "undefined") {
    const cachedRole = localStorage.getItem(`kurukshetra_role_${userId}`);
    if (cachedRole) return cachedRole as UserRole;
  }

  return "citizen";
}
