document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initSessionCheck();
});

// Theme Management (Light / Dark)
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

// Session Check & Splash Logic
function initSessionCheck() {
  const splashScreen = document.getElementById('splash-screen');
  const authContainer = document.getElementById('auth-container');
  const appShell = document.getElementById('app-shell');

  // Supabase Auth Listener for session handling
  supabase.auth.onAuthStateChange((event, session) => {
    // Hide Splash after animation ends (approx 2s)
    setTimeout(() => {
      if (splashScreen) splashScreen.style.display = 'none';

      if (session) {
        authContainer.classList.add('hidden');
        appShell.classList.remove('hidden');
      } else {
        appShell.classList.add('hidden');
        authContainer.classList.remove('hidden');
      }
    }, 2000);
  });
}

// Bottom Navigation Shell Switcher
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const screens = document.querySelectorAll('.screen-view');
  const headerTitle = document.getElementById('screen-title');

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      const targetTitle = item.getAttribute('data-title');

      navItems.forEach((nav) => nav.classList.remove('active'));
      screens.forEach((screen) => screen.classList.remove('active'));

      item.classList.add('active');
      const activeScreen = document.getElementById(`screen-${targetTab}`);
      if (activeScreen) activeScreen.classList.add('active');

      if (headerTitle) headerTitle.textContent = targetTitle;
    });
  });
}

