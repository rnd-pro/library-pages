export function enhanceShell(options = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let cleanedUp = false;

  function updateScroll() {
    if (cleanedUp) return;
    let scrolled = window.scrollY > 0;
    document.body.setAttribute('data-scrolled', scrolled ? 'true' : 'false');
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  let themeToggle = document.querySelector('[data-theme-toggle]');

  function handleThemeClick() {
    if (cleanedUp) return;
    let themeKey = document.documentElement.getAttribute('data-theme-key') || 'lp-theme';
    if (!/^[a-zA-Z0-9\-_]+$/.test(themeKey)) {
      themeKey = 'lp-theme';
    }
    let currentTheme = document.documentElement.getAttribute('data-theme');

    if (currentTheme !== 'light' && currentTheme !== 'dark') {
      currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    let nextTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(nextTheme);

    try {
      localStorage.setItem(themeKey, nextTheme);
    } catch (e) {
      // Handle blocked storage access
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', handleThemeClick);
  }

  return function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;

    window.removeEventListener('scroll', updateScroll);
    if (themeToggle) {
      themeToggle.removeEventListener('click', handleThemeClick);
    }
  };
}
