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

  supabase.auth.onAuthStateChange(async (event, session) => {
    setTimeout(async () => {
      if (splashScreen) splashScreen.style.display = 'none';

      if (session) {
        authContainer.classList.add('hidden');
        
        // Check if Profile & Onboarding is complete
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.onboarding_completed) {
          onboardingContainer.classList.add('hidden');
          appShell.classList.remove('hidden');
          if (typeof loadUserProfile === 'function') loadUserProfile(profile);
        } else {
          appShell.classList.add('hidden');
          onboardingContainer.classList.remove('hidden');
        }
      } else {
        appShell.classList.add('hidden');
        onboardingContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
      }
    }, 1800);
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

  // Direct Quick Access Button Routing
  document.addEventListener('click', (e) => {
    const quickCard = e.target.closest('[data-navigate]');
    if (quickCard) {
      const tabTarget = quickCard.getAttribute('data-navigate');
      const matchingNavItem = document.querySelector(`.nav-item[data-tab="${tabTarget}"]`);
      if (matchingNavItem) {
        matchingNavItem.click();
      } else {
        alert(`${tabTarget.replace('-', ' ').toUpperCase()} feature coming in next parts!`);
      }
    }
  });
}
