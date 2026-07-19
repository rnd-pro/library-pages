import baseStyles from './styles.css.js';
import { renderThemeBoot } from './boot.js';
import escapeHtml from './escape.js';
import { assertValidPageStyles } from './config.js';
import { renderSearchDialog } from '../search/index.js';
import { createUrlHelpers, normalizePath } from '../url/index.js';

export function renderStyles(siteConfig) {
  let overrideCss = '';
  if (siteConfig && siteConfig.tokenOverrides) {
    overrideCss = `\n:root {\n  ${Object.entries(siteConfig.tokenOverrides)
      .map(([k, v]) => {
        if (typeof k !== 'string' || !/^--lp-[a-zA-Z0-9\-_]+$/.test(k)) {
          throw new Error(`Invalid token override key: "${k}"`);
        }
        if (typeof v !== 'string' || /[;{}<>]/.test(v)) {
          throw new Error(`Invalid token override value: "${v}"`);
        }
        return `${k}: ${v};`;
      })
      .join('\n  ')}\n}`;
  }
  return `<style>${baseStyles}${overrideCss}</style>`;
}

export function renderHead(siteConfig, pageTitle = '', currentPath = '') {
  let brandTitle = siteConfig.brand.title;
  let title = pageTitle ? `${pageTitle} - ${brandTitle}` : brandTitle;

  let metaDesc = '';
  if (siteConfig.metadata && siteConfig.metadata.description) {
    metaDesc = `<meta name="description" content="${escapeHtml(siteConfig.metadata.description)}">`;
  }

  let canonical = '';
  if (siteConfig.metadata && siteConfig.metadata.baseUrl) {
    let { resolveUrl } = createUrlHelpers({
      basePath: siteConfig.basePath,
      baseUrl: siteConfig.metadata.baseUrl
    });
    let canonicalUrl = resolveUrl(currentPath);
    canonical = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`;
  }

  let iconLink = '';
  if (siteConfig.metadata && siteConfig.metadata.icon) {
    let { resolvePath } = createUrlHelpers({ basePath: siteConfig.basePath });
    iconLink = `<link rel="icon" href="${escapeHtml(resolvePath(siteConfig.metadata.icon))}">`;
  }

  let pageStyleTag = '';
  if (siteConfig.pageStyles !== undefined) {
    let pageStyles = assertValidPageStyles(siteConfig.pageStyles);
    if (pageStyles.trim()) {
      pageStyleTag = `<style>${pageStyles}</style>`;
    }
  }

  let clientScript = '';
  if (siteConfig.clientEntryPath) {
    let { resolvePath } = createUrlHelpers({ basePath: siteConfig.basePath });
    let resolvedClient = resolvePath(siteConfig.clientEntryPath);
    clientScript = `<script type="module" src="${escapeHtml(resolvedClient)}"></script>`;
  }

  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  ${metaDesc}
  ${canonical}
  ${iconLink}
  ${renderStyles(siteConfig)}
  ${pageStyleTag}
  ${renderThemeBoot(siteConfig.themeStorageKey)}
  ${clientScript}
`;
}

export function renderHeader(siteConfig, currentPath = '') {
  let brand = siteConfig.brand;
  let { resolvePath } = createUrlHelpers({ basePath: siteConfig.basePath });

  let logoHtml = '';
  if (brand.logo) {
    if (typeof brand.logo !== 'string') {
      throw new Error('Brand logo must be a string.');
    }
    let resolvedLogo = resolvePath(brand.logo);
    logoHtml = `<img class="lp-logo" src="${escapeHtml(resolvedLogo)}" alt="${escapeHtml(brand.title)} logo">`;
  }

  let navHtml = '';
  let mobileNavHtml = '';
  if (siteConfig.navigation && siteConfig.navigation.length > 0) {
    let links = siteConfig.navigation.map(item => {
      let resolvedPath = resolvePath(item.path);
      let isActive = normalizePath(currentPath) === normalizePath(item.path);
      let activeClass = isActive ? ' active' : '';
      let ariaCurrent = isActive ? ' aria-current="page"' : '';
      return `<a href="${escapeHtml(resolvedPath)}" class="lp-nav-link${activeClass}"${ariaCurrent}>${escapeHtml(item.label)}</a>`;
    }).join('\n      ');

    navHtml = `<nav class="lp-nav">
      ${links}
    </nav>`;

    mobileNavHtml = `<details class="lp-header-nav">
      <summary>Menu</summary>
      <nav class="lp-header-nav-menu" aria-label="Site navigation">
        ${links}
      </nav>
    </details>`;
  }

  let brandHome = resolvePath('/');

  return `
  <header class="lp-header">
    <div class="lp-header-container">
      <a href="${escapeHtml(brandHome)}" class="lp-brand">
        ${logoHtml}
        <span class="lp-brand-title">${escapeHtml(brand.title)}</span>
      </a>
      <button class="lp-btn" data-search-trigger title="Search (Cmd+K)" aria-label="Search">
        <svg class="lp-icon-search" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <span class="lp-search-label">Search</span>
        <kbd class="lp-search-kbd">⌘K</kbd>
      </button>
      <div class="lp-header-spacer"></div>
      ${navHtml}
      <button class="lp-btn lp-btn-icon" data-theme-toggle title="Toggle Theme" aria-label="Toggle Theme">
        <svg class="lp-icon-theme" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      </button>
      ${mobileNavHtml}
    </div>
  </header>
`;
}

export function renderFooter(siteConfig) {
  let linksHtml = '';
  if (siteConfig.footer && siteConfig.footer.links && siteConfig.footer.links.length > 0) {
    let links = siteConfig.footer.links.map(item => {
      let { resolvePath } = createUrlHelpers({ basePath: siteConfig.basePath });
      let resolvedPath = resolvePath(item.path);
      return `<a href="${escapeHtml(resolvedPath)}" class="lp-footer-link">${escapeHtml(item.label)}</a>`;
    }).join('\n      ');
    linksHtml = `<div class="lp-footer-links">
      ${links}
    </div>`;
  }

  let copyrightText = siteConfig.footer && siteConfig.footer.copyright
    ? siteConfig.footer.copyright
    : `© ${siteConfig.brand.title}`;

  return `
  <footer class="lp-footer">
    <div class="lp-footer-container">
      ${linksHtml}
      <div class="lp-footer-copy">${escapeHtml(copyrightText)}</div>
    </div>
  </footer>
`;
}

export function renderPage({ siteConfig, pageTitle = '', contentHtml, currentPath = '', searchIndex }) {
  if (!siteConfig) {
    throw new Error('siteConfig is required for rendering a page.');
  }
  if (contentHtml === undefined) {
    throw new Error('contentHtml is required for rendering a page.');
  }

  let searchDialogHtml = renderSearchDialog({
    basePath: siteConfig.basePath,
    placeholder: siteConfig.searchPlaceholder,
    searchIndex: searchIndex
  });

  let symbioteAttr = '';
  if (siteConfig.symbioteTokenBridge === true) {
    symbioteAttr = ' data-lp-symbiote="true"';
  }

  return `<!DOCTYPE html>
<html lang="${escapeHtml(siteConfig.language || 'en')}" data-theme-key="${escapeHtml(siteConfig.themeStorageKey || 'lp-theme')}"${symbioteAttr}>
<head>
${renderHead(siteConfig, pageTitle, currentPath)}
</head>
<body>
  <a href="#main-content" class="lp-skip-link">Skip to content</a>
  ${renderHeader(siteConfig, currentPath)}
  <main id="main-content" class="lp-main" tabindex="-1">
    <div class="lp-page-container">
      ${contentHtml}
    </div>
  </main>
  ${renderFooter(siteConfig)}
  ${searchDialogHtml}
</body>
</html>`;
}
