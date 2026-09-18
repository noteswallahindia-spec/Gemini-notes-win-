document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initSessionCheck();
});

function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('nw_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggleBtn?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('nw_theme', newTheme);
  });
}

function initSessionCheck() {
  const splashScreen = document.getElementById('splash-screen');
  const authContainer = document.getElementById('auth-container');
  const onboardingContainer = document.getElementById('onboarding-container');
  const appShell = document.getElementById('app-shell');

  // Single view controller to avoid stacking
  function showSingleView(targetView) {
    if (splashScreen) splashScreen.style.display = 'none';
    
    if (authContainer) authContainer.classList.add('hidden');
    if (onboardingContainer) onboardingContainer.classList.add('hidden');
    if (appShell) appShell.classList.add('hidden');

    if (targetView) targetView.classList.remove('hidden');
  }

  // Safety fallback
  const splashTimeout = setTimeout(() => {
    if (splashScreen && splashScreen.style.display !== 'none') {
      showSingleView(authContainer);
    }
  }, 2000);

  if (typeof supabase === 'undefined' || !supabase) {
    clearTimeout(splashTimeout);
    showSingleView(authContainer);
    return;
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    clearTimeout(splashTimeout);

    if (session) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.onboarding_completed) {
          showSingleView(appShell);
        } else {
          showSingleView(onboardingContainer);
        }
      } catch (e) {
        showSingleView(appShell);
      }
    } else {
      showSingleView(authContainer);
    }
  });
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const screens = document.querySelectorAll('.screen-view');
  const headerTitle = document.getElementById('screen-title');

  function switchTab(targetTab, targetTitle) {
    navItems.forEach((nav) => {
      nav.classList.toggle('active', nav.getAttribute('data-tab') === targetTab);
    });
    screens.forEach((screen) => {
      screen.classList.toggle('active', screen.id === `screen-${targetTab}`);
    });
    
    if (headerTitle && targetTitle) headerTitle.textContent = targetTitle;
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      switchTab(item.getAttribute('data-tab'), item.getAttribute('data-title'));
    });
  });

  document.addEventListener('click', (e) => {
    const quickCard = e.target.closest('[data-navigate]');
    if (quickCard) {
      const tabTarget = quickCard.getAttribute('data-navigate');
      const matchingNavItem = document.querySelector(`.nav-item[data-tab="${tabTarget}"]`);
      if (matchingNavItem) {
        matchingNavItem.click();
      }
    }
  });
}
