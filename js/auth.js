let isSignUpMode = false;

document.addEventListener('DOMContentLoaded', () => {
  setupAuthEvents();
});

function setupAuthEvents() {
  const authForm = document.getElementById('auth-form');
  const toggleBtn = document.getElementById('toggle-auth-btn');

  // Switch between Login and Signup
  toggleBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    
    document.getElementById('auth-title').textContent = isSignUpMode ? 'Create an Account' : 'Welcome to Notes Win';
    document.getElementById('auth-subtitle').textContent = isSignUpMode ? 'Sign up to start your learning journey' : 'Log in to continue your preparation';
    document.getElementById('auth-submit-btn').textContent = isSignUpMode ? 'Sign Up' : 'Log In';
    
    document.getElementById('toggle-auth-mode-text').innerHTML = isSignUpMode 
      ? 'Already have an account? <a href="#" id="toggle-auth-btn" class="auth-link">Log In</a>'
      : 'Don\'t have an account? <a href="#" id="toggle-auth-btn" class="auth-link">Sign Up</a>';

    // Re-bind click event to toggle link
    setupAuthEvents();
  });

  // Handle Form Submission (Sign Up / Login)
  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const errorDiv = document.getElementById('auth-error');
    const submitBtn = document.getElementById('auth-submit-btn');

    // Reset error box
    if (errorDiv) {
      errorDiv.textContent = '';
      errorDiv.classList.add('hidden');
    }

    if (!email || !password) {
      showError('Please enter both Email and Password.');
      return;
    }

    if (!supabase) {
      showError('Supabase Connection Failed! Check js/supabase.js file credentials.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      if (isSignUpMode) {
        // CALL SUPABASE SIGN UP
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          showError(error.message);
        } else if (data?.user) {
          alert('Sign Up Successful! Redirecting...');
          
          // Show Onboarding Screen manually if Auth Listener hasn't fired
          document.getElementById('auth-container')?.classList.add('hidden');
          document.getElementById('onboarding-container')?.classList.remove('hidden');
        }
      } else {
        // CALL SUPABASE LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          showError(error.message);
        } else {
          document.getElementById('auth-container')?.classList.add('hidden');
          document.getElementById('app-shell')?.classList.remove('hidden');
        }
      }
    } catch (err) {
      showError('Unexpected Error: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUpMode ? 'Sign Up' : 'Log In';
    }
  });
}

function showError(msg) {
  const errorDiv = document.getElementById('auth-error');
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
  } else {
    alert(msg);
  }
}
