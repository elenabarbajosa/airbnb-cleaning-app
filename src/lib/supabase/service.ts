import { createClient } from "@supabase/supabase-js";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/lib/env";

export function createSupabaseServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        // helps Supabase route logs/metrics; no user auth here
        "X-Client-Info": `airbnbapp-service`,
      },
    },
  });
}

