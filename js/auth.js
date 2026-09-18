// Global mode toggle state
let isSignUpMode = false;

document.addEventListener('DOMContentLoaded', () => {
  initAuthForm();
  initAuthModeToggle();
  initGoogleAuth();
});

function initAuthModeToggle() {
  const toggleBtn = document.getElementById('toggle-auth-btn');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const submitBtn = document.getElementById('auth-submit-btn');
  const toggleText = document.getElementById('toggle-auth-mode-text');
  const errorDiv = document.getElementById('auth-error');
  const successDiv = document.getElementById('auth-success');

  toggleBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;

    // Clear previous error or success messages
    if (errorDiv) {
      errorDiv.textContent = '';
      errorDiv.classList.add('hidden');
    }
    if (successDiv) {
      successDiv.textContent = '';
      successDiv.classList.add('hidden');
    }

    if (isSignUpMode) {
      authTitle.textContent = 'Create an Account';
      authSubtitle.textContent = 'Sign up to start your learning journey';
      submitBtn.textContent = 'Sign Up';
      toggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-auth-btn" class="auth-link">Log In</a>';
    } else {
      authTitle.textContent = 'Welcome to Notes Win';
      authSubtitle.textContent = 'Log in to continue your preparation';
      submitBtn.textContent = 'Log In';
      toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="toggle-auth-btn" class="auth-link">Sign Up</a>';
    }

    // Re-bind click event to newly created dynamic link
    document.getElementById('toggle-auth-btn')?.addEventListener('click', arguments.callee);
  });
}

function initAuthForm() {
  const authForm = document.getElementById('auth-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorDiv = document.getElementById('auth-error');
  const successDiv = document.getElementById('auth-success');
  const submitBtn = document.getElementById('auth-submit-btn');

  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput?.value?.trim();
    const password = passwordInput?.value;

    // Reset messages
    showAuthError('');
    showAuthSuccess('');

    if (!email || !password) {
      showAuthError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      showAuthError('Password must be at least 6 characters long.');
      return;
    }

    // Disable button to prevent double submissions
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = isSignUpMode ? 'Signing Up...' : 'Logging In...';
    }

    try {
      if (isSignUpMode) {
        console.log('🔄 Attempting Supabase Sign Up for:', email);

        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password
        });

        if (error) {
          console.error('❌ Supabase Sign Up Error:', error);
          showAuthError(getFriendlyErrorMessage(error));
        } else {
          console.log('✅ Supabase Sign Up Success:', data);

          if (data.user) {
            // Check if email confirmation is required by Supabase settings
            if (data.session) {
              showAuthSuccess('Account created! Navigating to onboarding...');
              // Auth listener in app.js automatically triggers Onboarding
            } else {
              showAuthSuccess('Sign up successful! Please check your email to confirm your account before logging in.');
            }
          }
        }
      } else {
        console.log('🔄 Attempting Supabase Log In for:', email);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (error) {
          console.error('❌ Supabase Log In Error:', error);
          showAuthError(getFriendlyErrorMessage(error));
        } else {
          console.log('✅ Supabase Log In Success:', data);
          showAuthSuccess('Login successful!');
          // Auth listener in app.js automatically handles redirection
        }
      }
    } catch (err) {
      console.error('❌ Unexpected Auth Exception:', err);
      showAuthError('An unexpected connection error occurred. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
      }
    }
  });
}

function initGoogleAuth() {
  const googleBtn = document.getElementById('google-login-btn');

  googleBtn?.addEventListener('click', async () => {
    try {
      console.log('🔄 Initiating Google OAuth Login...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        console.error('❌ Google OAuth Error:', error);
        showAuthError(error.message);
      }
    } catch (err) {
      console.error('❌ OAuth Exception:', err);
      showAuthError('Failed to initiate Google login.');
    }
  });
}

// Helpers
function showAuthError(message) {
  const errorDiv = document.getElementById('auth-error');
  if (errorDiv) {
    if (message) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    } else {
      errorDiv.textContent = '';
      errorDiv.classList.add('hidden');
    }
  }
}

function showAuthSuccess(message) {
  const successDiv = document.getElementById('auth-success');
  if (successDiv) {
    if (message) {
      successDiv.textContent = message;
      successDiv.classList.remove('hidden');
    } else {
      successDiv.textContent = '';
      successDiv.classList.add('hidden');
    }
  }
}

function getFriendlyErrorMessage(error) {
  if (!error) return 'An error occurred.';
  
  const msg = error.message.toLowerCase();
  
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (msg.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('password should be at least')) {
    return 'Password is too weak. It must be at least 6 characters.';
  }
  if (msg.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email address before logging in.';
  }

  return error.message || 'Authentication failed. Please check your details.';
}
