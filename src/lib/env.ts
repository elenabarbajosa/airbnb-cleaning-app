// IMPORTANT:
// For NEXT_PUBLIC_* vars, always use direct references so Next can inline them
// into client bundles. Do not use dynamic lookups like process.env[name].

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const NEXT_PUBLIC_SUPABASE_URL: string = supabaseUrl;
export const NEXT_PUBLIC_SUPABASE_ANON_KEY: string = supabaseAnonKey;


