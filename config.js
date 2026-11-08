/* SHOPY FONT public browser configuration.
   The Supabase publishable/anon key is designed for browser use.
   Never place a service_role key or private payment secret in this file. */
window.SHOPY_CONFIG = Object.freeze({
  SUPABASE_URL: "https://vulbvlardmvvxdhqyopn.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_hve5CvGEO3tyocvupHOv9w_zEVEaN9a",
  PLATFORM_NAME: "SHOPY FONT",
  DEFAULT_CURRENCY: "USD",
  DIRECT_REFERRAL_RATE: 0.78
});
window.sfSupabase = null;
try {
  if (window.supabase?.createClient) {
    window.sfSupabase = window.supabase.createClient(
      window.SHOPY_CONFIG.SUPABASE_URL,
      window.SHOPY_CONFIG.SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
    );
  }
} catch (error) {
  console.error("Supabase initialization failed:", error);
}
