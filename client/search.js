import { createUrlHelpers } from '../url/index.js';

export function enhanceSearch(dialogEl, searchIndex = [], options = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let dialog = dialogEl || document.querySelector('[data-search-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function') {
    return () => {};
  }

  let searchInput = dialog.querySelector('[data-search-input]');
  let resultsList = dialog.querySelector('[data-search-results]');
  let resultsCount = dialog.querySelector('[data-search-count]');
  let closeBtn = dialog.querySelector('[data-search-close]');

  if (!searchInput || !resultsList) {
    return () => {};
  }

  let finalSearchIndex = searchIndex;
  if (!finalSearchIndex || finalSearchIndex.length === 0) {
    let scriptEl = dialog.querySelector('script[data-search-index]');
    if (scriptEl) {
      try {
        finalSearchIndex = JSON.parse(scriptEl.textContent);
      } catch (e) {
        finalSearchIndex = [];
      }
    }
  }

  let safeSearchIndex = [];
  if (Array.isArray(finalSearchIndex)) {
    safeSearchIndex = finalSearchIndex.filter((item) => {
      return item &&
        typeof item.searchText === 'string' &&
        typeof item.path === 'string' &&
        typeof item.title === 'string';
    });
  }

  let basePath = options.basePath || dialog.getAttribute('data-base-path') || '/';
  let { resolvePath } = createUrlHelpers({ basePath });

  let lastActiveElement = null;
  let activeIndex = -1;
  let currentResults = [];
  let cleanedUp = false;

  function restoreFocus() {
    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      let el = lastActiveElement;
      lastActiveElement = null;
      el.focus();
    }
  }

  function handleGlobalKeyDown(event) {
    if (cleanedUp) return;
    if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (!dialog.open) {
        lastActiveElement = document.activeElement;
        dialog.showModal();
        searchInput.focus();
        if (typeof searchInput.select === 'function') {
          searchInput.select();
        }
      }
    }
  }
  document.addEventListener('keydown', handleGlobalKeyDown);

  let triggers = document.querySelectorAll('[data-search-trigger]');
  function handleTriggerClick(e) {
    if (cleanedUp) return;
    e.preventDefault();
    if (!dialog.open) {
      lastActiveElement = document.activeElement;
      dialog.showModal();
      searchInput.focus();
    }
  }
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', handleTriggerClick);
  });

  function handleDialogClick(event) {
    if (cleanedUp) return;
    if (event.target === dialog) {
      dialog.close();
    }
  }
  dialog.addEventListener('click', handleDialogClick);

  function handleCloseClick() {
    if (cleanedUp) return;
    dialog.close();
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', handleCloseClick);
  }

  function handleDialogClose() {
    if (cleanedUp) return;
    searchInput.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
    searchInput.removeAttribute('aria-activedescendant');
    restoreFocus();
  }
  dialog.addEventListener('close', handleDialogClose);

  function performSearch() {
    if (cleanedUp) return;
    let query = searchInput.value.trim().toLowerCase();
    if (!query) {
      currentResults = [];
      resultsList.innerHTML = '';
      if (resultsCount) {
        resultsCount.textContent = '';
        resultsCount.setAttribute('hidden', '');
      }
      searchInput.setAttribute('aria-expanded', 'false');
      activeIndex = -1;
      searchInput.removeAttribute('aria-activedescendant');
      return;
    }

    let terms = query.split(/\s+/).filter(Boolean);
    currentResults = safeSearchIndex.filter((item) => {
      let searchText = item.searchText.toLowerCase();
      return terms.every((term) => searchText.includes(term));
    });

    let displayResults = currentResults.slice(0, 15);
    activeIndex = -1;

    renderResults(displayResults);

    if (resultsCount) {
      let countText = currentResults.length === 1 ? '1 result found' : `${currentResults.length} results found`;
      resultsCount.textContent = countText;
      resultsCount.removeAttribute('hidden');
    }

    if (displayResults.length > 0) {
      searchInput.setAttribute('aria-expanded', 'true');
    } else {
      searchInput.setAttribute('aria-expanded', 'false');
    }
  }
  searchInput.addEventListener('input', performSearch);

  function renderResults(results) {
    resultsList.innerHTML = '';
    searchInput.removeAttribute('aria-activedescendant');
    if (results.length === 0) {
      let emptyLi = document.createElement('li');
      emptyLi.className = 'lp-search-no-results';
      emptyLi.textContent = 'No documentation matches your query.';
      resultsList.appendChild(emptyLi);
      return;
    }

    results.forEach((item, index) => {
      let li = document.createElement('li');
      li.className = 'lp-search-result-item';
      li.setAttribute('role', 'option');
      li.setAttribute('id', `lp-search-opt-${index}`);

      let a = document.createElement('a');
      a.href = resolvePath(item.path);
      a.className = 'lp-search-result-link';

      if (item.section && typeof item.section === 'string') {
        let meta = document.createElement('span');
        meta.className = 'lp-search-result-section';
        meta.textContent = item.section;
        a.appendChild(meta);
      }

      let title = document.createElement('span');
      title.className = 'lp-search-result-title';
      title.textContent = item.title;
      a.appendChild(title);

      if (item.description && typeof item.description === 'string') {
        let desc = document.createElement('span');
        desc.className = 'lp-search-result-description';
        desc.textContent = item.description;
        a.appendChild(desc);
      }

      li.appendChild(a);
      resultsList.appendChild(li);
    });
  }

  function updateActiveResult() {
    let items = resultsList.querySelectorAll('.lp-search-result-item');
    let hasActive = false;
    items.forEach((item, index) => {
      if (index === activeIndex) {
        item.classList.add('active');
        item.setAttribute('aria-selected', 'true');
        searchInput.setAttribute('aria-activedescendant', item.id);
        item.scrollIntoView({ block: 'nearest' });
        hasActive = true;
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-selected');
      }
    });
    if (!hasActive) {
      searchInput.removeAttribute('aria-activedescendant');
    }
  }

  function handleInputKeyDown(event) {
    if (cleanedUp) return;
    let items = resultsList.querySelectorAll('.lp-search-result-item:not(.lp-search-no-results)');
    if (items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      updateActiveResult();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      updateActiveResult();
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < items.length) {
        event.preventDefault();
        let activeLink = items[activeIndex].querySelector('a');
        if (activeLink) {
          activeLink.click();
          dialog.close();
        }
      }
    }
  }
  searchInput.addEventListener('keydown', handleInputKeyDown);

  return function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;

    document.removeEventListener('keydown', handleGlobalKeyDown);
    triggers.forEach((trigger) => {
      trigger.removeEventListener('click', handleTriggerClick);
    });
    dialog.removeEventListener('click', handleDialogClick);
    if (closeBtn) {
      closeBtn.removeEventListener('click', handleCloseClick);
    }
    dialog.removeEventListener('close', handleDialogClose);
    searchInput.removeEventListener('input', performSearch);
    searchInput.removeEventListener('keydown', handleInputKeyDown);

    if (dialog.open) {
      dialog.close();
    }

    searchInput.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
    searchInput.removeAttribute('aria-activedescendant');
    restoreFocus();

    if (resultsCount) {
      resultsCount.textContent = '';
      resultsCount.setAttribute('hidden', '');
    }
    resultsList.innerHTML = '';
  };
}
