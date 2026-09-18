let isSignUpMode = false;
let isForgotPasswordMode = false;

// DOM Elements
const authContainer = document.getElementById('auth-container');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordGroup = document.getElementById('password-group');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const googleBtn = document.getElementById('google-login-btn');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');
const toggleAuthBtn = document.getElementById('toggle-auth-btn');
const toggleForgotBtn = document.getElementById('toggle-forgot-password');
const toggleAuthText = document.getElementById('toggle-auth-mode-text');
const logoutBtn = document.getElementById('logout-btn');

function showError(message) {
  authError.textContent = message;
  authError.classList.remove('hidden');
  authSuccess.classList.add('hidden');
}

function showSuccess(message) {
  authSuccess.textContent = message;
  authSuccess.classList.remove('hidden');
  authError.classList.add('hidden');
}

function clearMessages() {
  authError.classList.add('hidden');
  authSuccess.classList.add('hidden');
}

// Toggle Auth Screens (Login / Signup / Forgot Password)
toggleAuthBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  clearMessages();
  isSignUpMode = !isSignUpMode;
  isForgotPasswordMode = false;
  
  if (isSignUpMode) {
    authTitle.textContent = "Create an Account";
    authSubtitle.textContent = "Sign up to start your preparation";
    authSubmitBtn.textContent = "Sign Up";
    toggleAuthText.innerHTML = `Already have an account? <a href="#" id="toggle-auth-btn" class="auth-link">Log In</a>`;
    passwordGroup.classList.remove('hidden');
  } else {
    authTitle.textContent = "Welcome to Notes Win";
    authSubtitle.textContent = "Log in to continue your preparation";
    authSubmitBtn.textContent = "Log In";
    toggleAuthText.innerHTML = `Don't have an account? <a href="#" id="toggle-auth-btn" class="auth-link">Sign Up</a>`;
    passwordGroup.classList.remove('hidden');
  }
  // Re-bind event dynamic listener
  document.getElementById('toggle-auth-btn').addEventListener('click', arguments.callee);
});

toggleForgotBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  clearMessages();
  isForgotPasswordMode = true;
  authTitle.textContent = "Reset Password";
  authSubtitle.textContent = "Enter your email to receive a reset link";
  authSubmitBtn.textContent = "Send Reset Link";
  passwordGroup.classList.add('hidden');
});

// Form Submission Handling
authForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  authSubmitBtn.disabled = true;

  try {
    if (isForgotPasswordMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      showSuccess("Password reset link sent to your email!");
    } else if (isSignUpMode) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      showSuccess("Account created successfully! Please check your email for verification.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Success is handled by onAuthStateChange in app.js
    }
  } catch (err) {
    showError(getFriendlyErrorMessage(err));
  } finally {
    authSubmitBtn.disabled = false;
  }
});

// Google OAuth Login
googleBtn?.addEventListener('click', async () => {
  clearMessages();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
  if (error) showError(getFriendlyErrorMessage(error));
});

// Logout Listener
logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

