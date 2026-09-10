import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl = "https://cafufqdkfkeftqdjewnh.supabase.co";
export const supabasePublishableKey = "sb_publishable_HzwDusWmoYut1EtZyupuEg_d2A1W92f";

export const supabasePublic = createSupabaseClient<any, "public", any>(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let browserClient: ReturnType<typeof createSupabaseClient<any, "public", any>> | undefined;

export function createClient() {
  if (!browserClient) {
    browserClient = createSupabaseClient<any, "public", any>(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: typeof window !== "undefined",
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "kadai-izira-commerce-auth",
      },
    });
  }
  return browserClient;
}
