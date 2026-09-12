/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Supabase Browser Client (lib/supabase/client.ts)
 * ==============================================================================
 */

import { supabase } from "@/lib/supabaseClient";

export function createBrowserClient() {
  return supabase;
}

export { supabase };
