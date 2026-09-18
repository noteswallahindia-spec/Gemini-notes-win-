document.addEventListener('DOMContentLoaded', () => {
  // Safe PDF.js worker setup
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';
  }

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

  // Hard timeout fallback to ensure UI displays even if auth listener hangs
  const splashTimeout = setTimeout(() => {
    if (splashScreen && splashScreen.style.display !== 'none') {
      splashScreen.style.display = 'none';
      if (authContainer && authContainer.classList.contains('hidden') && appShell.classList.contains('hidden')) {
        authContainer.classList.remove('hidden');
      }
    }
  }, 2500);

  if (typeof supabase === 'undefined' || !supabase) {
    if (splashScreen) splashScreen.style.display = 'none';
    if (authContainer) authContainer.classList.remove('hidden');
    return;
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    clearTimeout(splashTimeout);
    if (splashScreen) splashScreen.style.display = 'none';

    if (session) {
      if (authContainer) authContainer.classList.add('hidden');
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.onboarding_completed) {
          if (onboardingContainer) onboardingContainer.classList.add('hidden');
          if (appShell) appShell.classList.remove('hidden');
          if (typeof loadUserProfile === 'function') loadUserProfile(profile);
        } else {
          if (appShell) appShell.classList.add('hidden');
          if (onboardingContainer) onboardingContainer.classList.remove('hidden');
        }
      } catch (e) {
        if (appShell) appShell.classList.remove('hidden');
      }
    } else {
      if (appShell) appShell.classList.add('hidden');
      if (onboardingContainer) onboardingContainer.classList.add('hidden');
      if (authContainer) authContainer.classList.remove('hidden');
    }
  });
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const screens = document.querySelectorAll('.screen-view');
  const headerTitle = document.getElementById('screen-title');
  const backBtn = document.getElementById('back-nav-btn');

  function switchTab(targetTab, targetTitle) {
    navItems.forEach((nav) => {
      nav.classList.toggle('active', nav.getAttribute('data-tab') === targetTab);
    });
    screens.forEach((screen) => {
      screen.classList.toggle('active', screen.id === `screen-${targetTab}`);
    });
    
    if (headerTitle && targetTitle) headerTitle.textContent = targetTitle;
    backBtn?.classList.add('hidden');

    if (targetTab === 'pro-notes' && typeof switchProNotesSubView === 'function') {
      switchProNotesSubView('subjects');
    }
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
