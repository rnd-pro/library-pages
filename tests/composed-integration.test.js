import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import {
  defineSiteConfig,
  defineDocsRoutes,
  renderDocsPage,
  renderPage,
  renderStyles,
} from '../shell/index.js';
import { normalizePath, createUrlHelpers } from '../url/index.js';
import { enhanceLibraryPages } from '../client/index.js';

test('URL normalization and resolution behavior', () => {
  assert.strictEqual(normalizePath('/guide'), '/guide/');
  assert.strictEqual(normalizePath('/guide/'), '/guide/');
  assert.strictEqual(normalizePath('/guide?foo=bar'), '/guide/?foo=bar');
  assert.strictEqual(normalizePath('/guide#anchor'), '/guide/#anchor');
  assert.strictEqual(normalizePath('/guide?foo=bar#anchor'), '/guide/?foo=bar#anchor');
  assert.strictEqual(normalizePath('styles.css?v=2'), '/styles.css?v=2');
  assert.strictEqual(normalizePath('/assets/logo.png#icon'), '/assets/logo.png#icon');

  let helpers = createUrlHelpers({ basePath: '/synthetic-project/' });
  assert.strictEqual(helpers.resolvePath('mailto:info@rnd-pro.com'), 'mailto:info@rnd-pro.com');
  assert.strictEqual(helpers.resolvePath('tel:+1234567'), 'tel:+1234567');
  assert.strictEqual(helpers.resolvePath('//external.com/logo.png'), '//external.com/logo.png');
  assert.strictEqual(helpers.resolvePath('https://external.com/docs'), 'https://external.com/docs');
  assert.strictEqual(helpers.resolvePath('http://external.com/docs'), 'http://external.com/docs');

  assert.strictEqual(helpers.resolvePath('/synthetic-project/guide'), '/synthetic-project/guide/');
  assert.strictEqual(helpers.resolvePath('/synthetic-project/guide/'), '/synthetic-project/guide/');
  assert.strictEqual(helpers.resolvePath('synthetic-project/guide'), '/synthetic-project/guide/');
  assert.strictEqual(helpers.resolvePath('/synthetic-project/assets/logo.png'), '/synthetic-project/assets/logo.png');
  assert.strictEqual(helpers.resolvePath('docs'), '/synthetic-project/docs/');
});

test('XSS and token key/value validations', () => {
  assert.throws(() => {
    defineSiteConfig({
      brand: { title: 'Test' },
      tokenOverrides: {
        '--color-primary': 'red'
      }
    });
  }, /Invalid token override key/);

  assert.throws(() => {
    defineSiteConfig({
      brand: { title: 'Test' },
      tokenOverrides: {
        '--lp-color-primary': 'red; background: url(javascript:alert(1))'
      }
    });
  }, /Invalid token override value/);

  assert.throws(() => {
    defineSiteConfig({
      brand: { title: 'Test' },
      tokenOverrides: {
        '--lp-color-primary': 'red } body { background: red; }'
      }
    });
  }, /Invalid token override value/);

  assert.throws(() => {
    defineSiteConfig({
      brand: { title: 'Test' },
      tokenOverrides: {
        '--lp-color-primary': '<script>'
      }
    });
  }, /Invalid token override value/);
});

test('Mobile header navigation CSS restraint and composed no-JS lifecycle', () => {
  let siteConfig = defineSiteConfig({
    basePath: '/synthetic-project',
    brand: { title: 'Synthetic Lib' },
    navigation: [
      { label: 'Home', path: '/' },
      { label: 'Guide', path: '/guide' },
    ],
  });

  let styles = renderStyles(siteConfig);

  // Hidden above 900px by default and never gated behind .js-active
  assert.ok(
    styles.includes('.lp-header-nav {\n  display: none;'),
    'mobile header navigation is hidden by default above 900px'
  );
  assert.ok(
    !styles.match(/\.js-active[^{]*\.lp-header-nav/),
    'mobile header navigation visibility is never gated behind .js-active'
  );

  // Revealed inside the first 900px media block while the desktop nav stays hidden
  let mobileBlock = styles.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]+?)\n\}/)[1];
  let revealRule = mobileBlock.match(/\.lp-header-nav\s*\{([^}]+)\}/);
  assert.ok(revealRule, 'first 900px media block styles the details navigation');
  assert.ok(revealRule[1].includes('display: block'), 'first 900px media block reveals the details navigation');
  assert.ok(
    /\.lp-nav\s*\{[^}]*display:\s*none/.test(mobileBlock),
    'desktop nav remains hidden on mobile widths'
  );

  // Restraint: token-based, no !important, no animation, no blur, no shadow
  let headerNavRules = mobileBlock.match(/\.lp-header-nav[^{}]*\{[^}]+\}/g) || [];
  assert.ok(headerNavRules.length >= 3, 'mobile header navigation rules live inside the first 900px media block');
  for (let rule of headerNavRules) {
    assert.ok(!rule.includes('!important'), 'no !important in mobile header navigation rules');
    assert.ok(!rule.includes('animation'), 'no animation in mobile header navigation rules');
    assert.ok(!rule.includes('filter'), 'no blur or filter effects in mobile header navigation rules');
    assert.ok(!rule.includes('box-shadow'), 'no shadow in mobile header navigation rules');
  }

  // Composed no-JS lifecycle: complete, operable markup before any client enhancement
  let routes = defineDocsRoutes([
    { path: '/guide', title: 'Guide page', section: 'Main' },
  ]);
  let htmlContent = renderDocsPage({
    siteConfig,
    routes,
    currentRoute: routes[0],
    contentHtml: '<h2>Welcome to Guide</h2>',
  });

  let { document } = parseHTML(htmlContent);
  assert.ok(!document.documentElement.classList.contains('js-active'), 'parsed page starts without js-active');

  let details = document.querySelector('details.lp-header-nav');
  assert.ok(details, 'mobile details navigation exists in the composed page');

  let summary = details.querySelector('summary');
  assert.ok(summary && summary.textContent.trim().length > 0, 'summary exposes an accessible name');

  let menu = details.querySelector('nav.lp-header-nav-menu');
  assert.ok(menu, 'details contains the nav landmark');
  assert.ok(menu.getAttribute('aria-label'), 'contained nav exposes an accessible label');

  let activeLink = menu.querySelector('a.lp-nav-link.active');
  assert.ok(activeLink, 'active link is rendered without JS');
  assert.equal(activeLink.getAttribute('aria-current'), 'page');
  assert.equal(activeLink.getAttribute('href'), '/synthetic-project/guide/');

  details.setAttribute('open', '');
  assert.ok(details.hasAttribute('open'), 'details toggles declaratively without JS');
});

test('Composed integration client enhancement lifecycle', () => {
  let siteConfig = defineSiteConfig({
    basePath: '/synthetic-project',
    brand: { title: 'Synthetic Lib', logo: 'assets/logo.png' },
    metadata: { description: 'Synthetic Project description' },
    themeStorageKey: 'synthetic-theme-key',
    symbioteTokenBridge: true,
    navigation: [
      { label: 'Home', path: '/' },
      { label: 'Guide', path: '/guide' },
      { label: 'API', path: '/api' }
    ]
  });

  let routes = defineDocsRoutes([
    { path: '/guide', title: 'Guide page', section: 'Main' },
    { path: '/api', title: 'API reference', section: 'Main' }
  ]);

  let htmlContent = renderDocsPage({
    siteConfig,
    routes,
    currentRoute: routes[0],
    contentHtml: '<h2>Welcome to Guide</h2>'
  });

  let { window, document } = parseHTML(htmlContent);
  globalThis.window = window;
  globalThis.document = document;
  globalThis.CustomEvent = window.CustomEvent;

  let logo = document.querySelector('.lp-logo');
  assert.ok(logo);
  assert.strictEqual(logo.getAttribute('src'), '/synthetic-project/assets/logo.png');
  assert.strictEqual(document.documentElement.getAttribute('data-lp-symbiote'), 'true');

  let navLinks = document.querySelectorAll('.lp-nav-link');
  let guideNavLink = Array.from(navLinks).find(el => el.getAttribute('href') === '/synthetic-project/guide/');
  assert.ok(guideNavLink);
  assert.ok(guideNavLink.classList.contains('active'));

  let dialog = document.querySelector('[data-search-dialog]');
  assert.ok(dialog);
  assert.strictEqual(dialog.getAttribute('data-base-path'), '/synthetic-project/');
  assert.ok(dialog.getAttribute('aria-label'));

  let searchInput = dialog.querySelector('[data-search-input]');
  assert.ok(searchInput);
  assert.ok(searchInput.getAttribute('aria-label'));

  let resultsList = dialog.querySelector('[data-search-results]');
  assert.ok(resultsList);

  let resultsCount = dialog.querySelector('[data-search-count]');
  assert.ok(resultsCount);
  assert.ok(resultsCount.hasAttribute('hidden'));

  let scriptIndex = dialog.querySelector('script[data-search-index]');
  assert.ok(scriptIndex);

  dialog.open = false;
  let showModalCalled = false;
  let closeCalled = false;
  dialog.showModal = () => {
    dialog.open = true;
    showModalCalled = true;
  };
  dialog.close = () => {
    dialog.open = false;
    closeCalled = true;
    let closeEvent = new window.Event('close');
    dialog.dispatchEvent(closeEvent);
  };
  window.HTMLElement.prototype.scrollIntoView = () => {};

  let searchInputFocusCalled = false;
  searchInput.focus = () => {
    searchInputFocusCalled = true;
  };

  let triggerBtn = document.querySelector('[data-search-trigger]');
  assert.ok(triggerBtn);

  let triggerBtnFocusCalled = false;
  triggerBtn.focus = () => {
    triggerBtnFocusCalled = true;
  };

  Object.defineProperty(document, 'activeElement', {
    value: triggerBtn,
    writable: true,
    configurable: true
  });

  let storedTheme = null;
  globalThis.window.localStorage = {
    getItem: () => storedTheme,
    setItem: (key, val) => { storedTheme = val; }
  };

  let cleanup = () => {};
  try {
    cleanup = enhanceLibraryPages();

    assert.ok(document.documentElement.classList.contains('js-active'));

    let themeToggle = document.querySelector('[data-theme-toggle]');
    assert.ok(themeToggle);
    let clickThemeEvent = new window.Event('click', { bubbles: true });
    themeToggle.dispatchEvent(clickThemeEvent);
    assert.strictEqual(document.documentElement.getAttribute('data-theme'), 'dark');

    triggerBtn = document.querySelector('[data-search-trigger]');
    assert.ok(triggerBtn);

    let clickTriggerEvent = new window.Event('click', { bubbles: true });
    triggerBtn.dispatchEvent(clickTriggerEvent);

    assert.ok(showModalCalled);
    assert.ok(dialog.open);
    assert.ok(searchInputFocusCalled);

    dialog.close();
    assert.ok(closeCalled);
    assert.ok(triggerBtnFocusCalled);
  } finally {
    cleanup();
  }

  assert.ok(!document.documentElement.classList.contains('js-active'));
  assert.ok(!document.body.hasAttribute('data-scrolled'));

  let themeToggle = document.querySelector('[data-theme-toggle]');
  let clickThemeEvent = new window.Event('click', { bubbles: true });
  document.documentElement.removeAttribute('data-theme');
  themeToggle.dispatchEvent(clickThemeEvent);
  assert.strictEqual(document.documentElement.getAttribute('data-theme'), null);

  showModalCalled = false;
  let clickTriggerEvent = new window.Event('click', { bubbles: true });
  triggerBtn.dispatchEvent(clickTriggerEvent);
  assert.ok(!showModalCalled);

  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.CustomEvent;
});
