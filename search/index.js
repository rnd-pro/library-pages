import { createUrlHelpers, normalizeRoutes } from '../url/index.js';
import escapeHtml from '../shell/escape.js';

/**
 * @typedef {Object} SearchIndexItem
 * @property {string} path
 * @property {string} title
 * @property {string} section
 * @property {string} description
 * @property {Array<string>} headers
 * @property {string} searchText
 */

/**
 * Builds a search index from routes.
 *
 * @param {Array<Object>} routes
 * @returns {Array<SearchIndexItem>}
 */
export function buildSearchIndex(routes) {
  let normalized = normalizeRoutes(routes);
  return normalized.map((route) => {
    let headers = Array.isArray(route.headers) ? route.headers : [];
    let title = route.title || '';
    let section = route.section || '';
    let description = route.description || '';
    let searchText = [
      title,
      section,
      description,
      ...headers,
    ].join(' ').toLowerCase();

    return {
      path: route.path,
      title,
      section,
      description,
      headers,
      searchText,
    };
  });
}

/**
 * Renders the semantic HTML string for the search dialog.
 *
 * @param {Object} [options]
 * @param {string} [options.basePath] The base path to use for search links
 * @param {Array<Object>} [options.searchIndex] The searchable routes index to embed
 * @param {string} [options.placeholder] Custom placeholder for input
 * @returns {string} HTML string
 */
export function renderSearchDialog(options = {}) {
  let { resolvePath } = createUrlHelpers({ basePath: options.basePath });
  let basePath = resolvePath('/');
  let placeholder = options.placeholder || 'Search documentation...';

  let searchIndex = options.searchIndex;
  if (searchIndex === undefined) {
    searchIndex = [];
  } else if (!Array.isArray(searchIndex)) {
    throw new TypeError('Search index must be an array');
  }

  let serialized = JSON.stringify(searchIndex).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  let embeddedScript = `<script type="application/json" class="lp-search-index-data" data-search-index>${serialized}</script>`;

  return `
<dialog id="lp-search-dialog" class="lp-search-dialog" data-base-path="${escapeHtml(basePath)}" data-search-dialog aria-label="Search documentation">
  <div class="lp-search-box">
    <header class="lp-search-header">
      <div class="lp-search-input-wrapper">
        <svg class="lp-search-input-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="search" id="lp-search-input" class="lp-search-input" data-search-input placeholder="${escapeHtml(placeholder)}" autocomplete="off" spellcheck="false" aria-autocomplete="list" aria-controls="lp-search-results-list" aria-expanded="false" aria-label="Search text input">
      </div>
      <button type="button" class="lp-search-close-btn" data-search-close aria-label="Close search">Esc</button>
    </header>
    <div class="lp-search-results-container">
      <div id="lp-search-results-count" class="lp-search-results-count" data-search-count aria-live="polite" hidden></div>
      <ul id="lp-search-results-list" class="lp-search-results-list" data-search-results role="listbox" aria-label="Search results"></ul>
    </div>
    <footer class="lp-search-footer">
      <span class="lp-search-key-hint"><kbd class="lp-search-key">↑↓</kbd> Navigate</span>
      <span class="lp-search-key-hint"><kbd class="lp-search-key">Enter</kbd> Select</span>
      <span class="lp-search-key-hint"><kbd class="lp-search-key">Esc</kbd> Close</span>
    </footer>
  </div>
  ${embeddedScript}
</dialog>
`.trim();
}
