// =========================================================================
// PROJECT: Kurukshetra PS20 - Agentic Disaster Relief System
// STEP 2: Auth & Profile Sync
// FILE: types/auth.ts
// ROLE: Senior Backend Architect
// DESCRIPTION: Shared TypeScript interfaces for Authentication and User Profiles
//              to be consumed by Aditya (Frontend) and Backend API routes.
// =========================================================================

/**
 * The three distinct disaster management roles:
 * - 'citizen': Can report incidents, view own alerts and public maps.
 * - 'rescue': First responders who view assigned tasks, update incident status to 'resolved'.
 * - 'authority': Disaster Management War Room commanders who have full overview and trigger simulations.
 */
export type UserRole = "citizen" | "rescue" | "authority";

/**
 * Supported localization languages:
 * - 'en': English
 * - 'hi': Hindi (हिंदी)
 */
export type SupportedLanguage = "en" | "hi";

/**
 * Spatial coordinate and address metadata stored in JSONB.
 */
export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Public User Profile representation corresponding to `public.profiles`.
 * Note: Never contains passwords, JWTs, or credential secrets.
 */
export interface UserProfile {
  id: string; // Matches auth.users.id UUID
  email: string;
  role: UserRole;
  phone: string | null;
  preferred_language: SupportedLanguage;
  location_json: LocationData;
  created_at: string;
}

/**
 * Sanitized user payload returned by the `/api/auth/session` endpoint.
 */
export interface SessionUser {
  id: string;
  email: string | undefined;
  role: UserRole;
  phone: string | null;
  preferred_language: SupportedLanguage;
  location_json: LocationData;
  created_at?: string;
}

/**
 * API Response structure for `GET /api/auth/session`.
 */
export interface SessionResponse {
  authenticated: boolean;
  user: SessionUser | null;
  mode?: "production" | "local_demo_environment";
  message?: string;
  error?: string;
}

/**
 * Incoming payload structure when Supabase Auth triggers the create-profile function.
 */
export interface AuthWebhookPayload {
  type?: "INSERT" | "UPDATE";
  table?: string;
  schema?: string;
  record?: {
    id: string;
    email: string;
    phone?: string;
    raw_user_meta_data?: {
      phone?: string;
      role?: string;
      location_json?: LocationData;
    };
  };
}
