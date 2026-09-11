import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project") &&
  !supabaseUrl.includes("placeholder") &&
  !supabaseAnonKey.includes("placeholder")
);

// Real Supabase client instance (or dummy client if keys are missing)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient(
      "https://placeholder-project.supabase.co",
      "placeholder-anon-key-00000000000000000000000000"
    );

/**
 * Helper to fetch a user's role from the public.users table.
 * Table schema expected:
 *   users (
 *     id uuid primary key,
 *     email text,
 *     role text in ('citizen', 'rescue', 'authority'),
 *     full_name text
 *   )
 */
export async function getUserRole(userId) {
  if (!userId) return "citizen";

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        console.warn("Could not fetch user role from Supabase users table:", error.message);
        return "citizen";
      }

      return data?.role || "citizen";
    } catch (err) {
      console.error("Error querying Supabase users table:", err);
      return "citizen";
    }
  }

  // Fallback for local testing / mock auth
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(`user_role_${userId}`);
    if (saved) return saved;
  }
  return "citizen";
}
