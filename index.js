// Main entrypoint for library-pages.
// Exposes only Node-safe, DOM-free SSG / configuration utilities.
// Client-side / browser enhancements must be imported from the './client' subpath.

export {
  defineSiteConfig,
  defineDocsRoutes,
  renderPage,
  renderHead,
  renderHeader,
  renderFooter,
  renderStyles,
  renderDocsPage,
  extractTOC,
  renderTOC,
  renderSidebar,
  renderPager,
  renderThemeBoot
} from './shell/index.js';

export {
  readPagesEnv,
  normalizePath,
  createUrlHelpers,
  normalizeRoutes
} from './url/index.js';

export {
  buildSearchIndex,
  renderSearchDialog
} from './search/index.js';

export {
  createPagesJsdaConfig
} from './jsda/index.js';

export {
  createArtifactChecks,
  assertPagesOutput
} from './testing/index.js';
