import { enhanceShell } from './shell.js';
import { enhanceSearch } from './search.js';

export function enhanceLibraryPages(options = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let cleanedUp = false;

  document.documentElement.classList.add('js-active');

  let cleanupShell = enhanceShell(options) || (() => {});

  let dialogEl = null;
  if (options.dialog) {
    if (typeof options.dialog === 'string') {
      dialogEl = document.querySelector(options.dialog);
    } else {
      dialogEl = options.dialog;
    }
  } else {
    dialogEl = document.querySelector('[data-search-dialog]');
  }

  let searchIndex = options.searchIndex || [];
  let cleanupSearch = () => {};

  if (dialogEl) {
    cleanupSearch = enhanceSearch(dialogEl, searchIndex, options) || (() => {});
  }

  return function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;

    if (typeof cleanupShell === 'function') {
      cleanupShell();
    }
    if (typeof cleanupSearch === 'function') {
      cleanupSearch();
    }
    document.documentElement.classList.remove('js-active');
    document.body.removeAttribute('data-scrolled');
  };
}
