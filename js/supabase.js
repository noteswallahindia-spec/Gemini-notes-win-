// Initialize Supabase Client
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

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

