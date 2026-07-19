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

/**
 * Ensures every h2/h3 in trusted build-time content has a stable id and a
 * hover anchor link. Existing ids are preserved; generated ids are slugified
 * from the heading text and deduplicated.
 * @param {string} contentHtml
 * @returns {string}
 */
export function ensureHeadingAnchors(contentHtml) {
  let seen = new Set();
  return contentHtml.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, inner) => {
    let idMatch = attrs.match(/\sid=(?:"([^"]*)"|'([^']*)')/i);
    let id = idMatch ? (idMatch[1] || idMatch[2]) : null;
    if (id) {
      seen.add(id);
    } else {
      let text = inner.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
      let slug = text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      id = slug || `section`;
      let unique = id;
      let counter = 2;
      while (seen.has(unique)) {
        unique = `${id}-${counter}`;
        counter += 1;
      }
      id = unique;
      seen.add(id);
      attrs = `${attrs} id="${id}"`;
    }
    if (inner.includes('lp-anchor')) {
      return `<h${level}${attrs}>${inner}</h${level}>`;
    }
    return `<h${level}${attrs}>${inner} <a class="lp-anchor" href="#${id}" aria-label="Link to this section">#</a></h${level}>`;
  });
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
    let text = match[3]
      .replace(/<a class="lp-anchor"[\s\S]*?<\/a>/g, '')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();
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
    <nav class="lp-toc-outline" aria-label="On this page">
      <div class="lp-toc-marker" aria-hidden="true"></div>
      <div class="lp-toc-title">On this page</div>
      <ul class="lp-toc-list">
      ${items}
      </ul>
    </nav>
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

  contentHtml = ensureHeadingAnchors(contentHtml);

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

  let editMarkup = '';
  if (siteConfig.editBaseUrl && currentRoute.editPath) {
    let editHref = `${siteConfig.editBaseUrl}${currentRoute.editPath}`;
    editMarkup = `<div class="lp-doc-footer">
      <a class="lp-edit-link" href="${escapeHtml(editHref)}" target="_blank" rel="noopener noreferrer">Edit this page on GitHub</a>
    </div>`;
  }

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
        ${editMarkup}
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
