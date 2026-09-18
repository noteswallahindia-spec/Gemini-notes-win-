// Initialize Supabase Client
const SUPABASE_URL = "https://jnmetyqhwhuujdxgxpmm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_V17u1fgx2kMg53TghxfCSA_jTc4Tptk";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function for user-friendly error messages
function getFriendlyErrorMessage(error) {
  if (!error) return "An unexpected error occurred. Please try again.";
  
  const msg = error.message.toLowerCase();
  
  if (msg.includes("invalid login credentials")) {
    return "Incorrect email or password. Please check and try again.";
  }
  if (msg.includes("user already registered")) {
    return "An account with this email already exists.";
  }
  if (msg.includes("password should be at least")) {
    return "Password must be at least 6 characters long.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Network error. Please check your internet connection.";
  }
  
  return "Something went wrong. Please try again.";
}

