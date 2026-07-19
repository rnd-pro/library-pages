import { renderHead, renderHeader, renderFooter } from './page.js';
import escapeHtml from './escape.js';
import { renderSearchDialog, buildSearchIndex } from '../search/index.js';
import { createUrlHelpers, normalizePath } from '../url/index.js';

export function renderMobileTOC(toc, currentRoute, siteConfig) {
  if (!toc || toc.length === 0) {
    return '';
  }
  let basePath = siteConfig ? siteConfig.basePath : '/';
  let { resolvePath } = createUrlHelpers({ basePath });

  let items = toc.map(item => {
    let depthClass = `depth-${item.depth}`;
    let currentPath = (currentRoute && typeof currentRoute.path === 'string') ? currentRoute.path : '/';
    let resolvedRoutePath = resolvePath(currentPath);
    let hrefValue = resolvedRoutePath + '#' + item.id;
    return `<li class="lp-toc-item ${depthClass}">
      <a href="${escapeHtml(hrefValue)}" class="lp-toc-link">${escapeHtml(item.text)}</a>
    </li>`;
  }).join('\n    ');

  return `
  <details class="lp-mobile-toc">
    <summary>On this page</summary>
    <ul class="lp-toc-list">
      ${items}
    </ul>
  </details>
`;
}

export function extractTOC(contentHtml) {
  if (!contentHtml) return [];
  let headingRegex = /<h([23])\s+[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let toc = [];
  let match;
  let regex = new RegExp(headingRegex);
  while ((match = regex.exec(contentHtml)) !== null) {
    let depth = parseInt(match[1], 10);
    let id = match[2];
    let text = match[3].replace(/<\/?[^>]+(>|$)/g, '').trim();
    toc.push({ id, text, depth });
  }
  return toc;
}

export function renderTOC(toc, currentRoute, siteConfig) {
  if (!toc || toc.length === 0) {
    return '';
  }
  let basePath = siteConfig ? siteConfig.basePath : '/';
  let { resolvePath } = createUrlHelpers({ basePath });

  let items = toc.map(item => {
    let depthClass = `depth-${item.depth}`;
    let currentPath = (currentRoute && typeof currentRoute.path === 'string') ? currentRoute.path : '/';
    let resolvedRoutePath = resolvePath(currentPath);
    let hrefValue = resolvedRoutePath + '#' + item.id;
    return `<li class="lp-toc-item ${depthClass}">
      <a href="${escapeHtml(hrefValue)}" class="lp-toc-link">${escapeHtml(item.text)}</a>
    </li>`;
  }).join('\n    ');

  return `
  <aside class="lp-toc">
    <div class="lp-toc-title">On This Page</div>
    <ul class="lp-toc-list">
      ${items}
    </ul>
  </aside>
`;
}

export function renderSidebar(routes, currentRoute, siteConfig) {
  if (!routes || routes.length === 0) {
    return '';
  }
  let basePath = siteConfig ? siteConfig.basePath : '/';
  let { resolvePath } = createUrlHelpers({ basePath });

  let groups = {};
  let sectionsSeen = [];

  routes.forEach(route => {
    let section = route.section || '';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(route);

    if (!sectionsSeen.includes(section)) {
      sectionsSeen.push(section);
    }
  });

  let html = [];
  sectionsSeen.forEach(section => {
    let groupRoutes = groups[section];
    html.push(`  <div class="lp-sidebar-group">`);
    if (section) {
      html.push(`    <div class="lp-sidebar-group-title">${escapeHtml(section)}</div>`);
    }
    html.push(`    <ul class="lp-sidebar-list lp-sidebar-list-unstyled">`);
    groupRoutes.forEach(route => {
      let label = route.label || route.title;
      let resolvedPath = resolvePath(route.path);
      let isActive = currentRoute && normalizePath(currentRoute.path) === normalizePath(route.path);
      let activeClass = isActive ? ' active' : '';
      let ariaCurrent = isActive ? ' aria-current="page"' : '';
      html.push(`      <li><a href="${escapeHtml(resolvedPath)}" class="lp-sidebar-link${activeClass}"${ariaCurrent}>${escapeHtml(label)}</a></li>`);
    });
    html.push(`    </ul>`);
    html.push(`  </div>`);
  });

  return html.join('\n');
}

export function renderPager(routes, currentRoute, siteConfig) {
  if (!routes || routes.length === 0 || !currentRoute) {
    return '';
  }
  let basePath = siteConfig ? siteConfig.basePath : '/';
  let { resolvePath } = createUrlHelpers({ basePath });

  let index = routes.findIndex(r => normalizePath(r.path) === normalizePath(currentRoute.path));
  if (index === -1) {
    return '';
  }

  let prev = index > 0 ? routes[index - 1] : null;
  let next = index < routes.length - 1 ? routes[index + 1] : null;

  let prevHtml = '';
  if (prev) {
    let resolvedPath = resolvePath(prev.path);
    prevHtml = `
    <a href="${escapeHtml(resolvedPath)}" class="lp-pager-link prev">
      <span class="lp-pager-label">← Previous</span>
      <span class="lp-pager-title">${escapeHtml(prev.title)}</span>
    </a>`;
  } else {
    prevHtml = `<div class="lp-pager-placeholder"></div>`;
  }

  let nextHtml = '';
  if (next) {
    let resolvedPath = resolvePath(next.path);
    nextHtml = `
    <a href="${escapeHtml(resolvedPath)}" class="lp-pager-link next">
      <span class="lp-pager-label">Next →</span>
      <span class="lp-pager-title">${escapeHtml(next.title)}</span>
    </a>`;
  } else {
    nextHtml = `<div class="lp-pager-placeholder"></div>`;
  }

  return `
  <nav class="lp-pager">
    ${prevHtml}
    ${nextHtml}
  </nav>
`;
}

export function renderDocsPage({ siteConfig, routes, currentRoute, contentHtml, toc }) {
  if (!siteConfig) {
    throw new Error('siteConfig is required for rendering a docs page.');
  }
  if (!routes || !Array.isArray(routes)) {
    throw new Error('routes is required and must be an array.');
  }
  if (!currentRoute || typeof currentRoute !== 'object') {
    throw new Error('currentRoute is required.');
  }
  if (contentHtml === undefined) {
    throw new Error('contentHtml is required.');
  }

  let resolvedToc = toc;
  if (!resolvedToc) {
    resolvedToc = extractTOC(contentHtml);
  }

  let tocMarkup = '';
  let mobileTocMarkup = '';
  if (Array.isArray(resolvedToc)) {
    tocMarkup = renderTOC(resolvedToc, currentRoute, siteConfig);
    mobileTocMarkup = renderMobileTOC(resolvedToc, currentRoute, siteConfig);
  } else if (typeof resolvedToc === 'string') {
    tocMarkup = resolvedToc;
  }

  let sidebarMarkup = renderSidebar(routes, currentRoute, siteConfig);
  let pagerMarkup = renderPager(routes, currentRoute, siteConfig);

  let derivedIndex = buildSearchIndex(routes);
  let searchDialogHtml = renderSearchDialog({
    basePath: siteConfig.basePath,
    searchIndex: derivedIndex,
    placeholder: siteConfig.searchPlaceholder
  });

  let symbioteAttr = '';
  if (siteConfig.symbioteTokenBridge === true) {
    symbioteAttr = ' data-lp-symbiote="true"';
  }

  return `<!DOCTYPE html>
<html lang="${escapeHtml(siteConfig.language || 'en')}" data-theme-key="${escapeHtml(siteConfig.themeStorageKey || 'lp-theme')}"${symbioteAttr}>
<head>
${renderHead(siteConfig, currentRoute.title, currentRoute.path)}
</head>
<body class="lp-docs-page">
  <a href="#main-content" class="lp-skip-link">Skip to content</a>
  ${renderHeader(siteConfig, currentRoute.path)}
  <main id="main-content" class="lp-main" tabindex="-1">
    <div class="lp-docs-layout">
      <details class="lp-mobile-nav">
        <summary>Documentation Navigation</summary>
        <div class="lp-sidebar">
          ${sidebarMarkup}
        </div>
      </details>

      <aside class="lp-desktop-sidebar">
        <div class="lp-sidebar">
          ${sidebarMarkup}
        </div>
      </aside>

      ${mobileTocMarkup}

      <div class="lp-content">
        <article class="lp-article">
          ${contentHtml}
        </article>
        ${pagerMarkup}
      </div>

      ${tocMarkup}
    </div>
  </main>
  ${renderFooter(siteConfig)}
  ${searchDialogHtml}
</body>
</html>`;
}
