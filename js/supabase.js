const SUPABASE_URL = 'https://jnmetyqhwhuujdxgxpmm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_V17u1fgx2kMg53TghxfCSA_jTc4Tptk';

// Initialize Supabase Client globally
let supabase;

if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('❌ Supabase JS SDK failed to load from CDN.');
}
