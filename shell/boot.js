/**
 * Renders the theme boot script element for inclusion in HTML <head>.
 * @param {string} [themeStorageKey]
 * @returns {string} HTML script tag string
 */
export function renderThemeBoot(themeStorageKey = 'lp-theme') {
  if (typeof themeStorageKey !== 'string' || !/^[a-zA-Z0-9\-_]+$/.test(themeStorageKey)) {
    throw new Error('themeStorageKey must be a valid alphanumeric/hyphen/underscore string.');
  }
  return `<script>
(function() {
  document.documentElement.classList.add('js-active');
  let theme = 'light';
  try {
    let stored = localStorage.getItem(${JSON.stringify(themeStorageKey)});
    let valid = stored === 'light' || stored === 'dark';
    if (valid) {
      theme = stored;
    }
    if (!valid && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme = 'dark';
    }
  } catch {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark';
      }
    } catch {}
  }
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
})();
</script>`;
}
