import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  defineSiteConfig,
  defineDocsRoutes,
  ensureHeadingAnchors,
  renderPage,
  renderHead,
  renderHeader,
  renderDocsPage,
  extractTOC,
  renderTOC,
  renderSidebar,
  renderPager,
  renderThemeBoot,
  renderStyles,
} from '../shell/index.js';

test('defineSiteConfig - validations', () => {
  // Should throw on empty config
  assert.throws(() => defineSiteConfig(null), /must be a non-null object/);
  assert.throws(() => defineSiteConfig([]), /must be a non-null object/);

  // Should throw on missing brand
  assert.throws(() => defineSiteConfig({}), /must contain a "brand" object/);
  assert.throws(() => defineSiteConfig({ brand: {} }), /Brand title must be a non-empty string/);
  assert.throws(() => defineSiteConfig({ brand: { title: '  ' } }), /Brand title must be a non-empty string/);

  // Valid config should pass
  let validConfig = {
    brand: { title: 'Test Library', logo: '/logo.svg' },
    metadata: { description: 'A library test site', baseUrl: 'https://test.js' },
    navigation: [
      { label: 'Home', path: '/' },
      { label: 'Docs', path: '/docs/' },
    ],
    footer: {
      copyright: 'Custom Copyright',
      links: [{ label: 'GitHub', path: 'https://github.com' }],
    },
    clientEntryPath: '/client.js',
    themeStorageKey: 'my-custom-theme-key',
    tokenOverrides: {
      '--lp-color-primary': '#ff0055',
    },
  };

  let processed = defineSiteConfig(validConfig);
  assert.equal(processed.brand.title, 'Test Library');
  assert.equal(processed.themeStorageKey, 'my-custom-theme-key');

  // Should be deep frozen
  assert.ok(Object.isFrozen(processed));
  assert.ok(Object.isFrozen(processed.brand));
  assert.ok(Object.isFrozen(processed.navigation));
  assert.ok(Object.isFrozen(processed.footer));

  // Modifying frozen object should fail in strict mode (or do nothing)
  assert.throws(() => {
    processed.brand.title = 'Changed';
  }, TypeError);
});

test('defineDocsRoutes - validations & duplicate checks', () => {
  // Should throw on invalid type
  assert.throws(() => defineDocsRoutes(null), /must be an array/);

  // Should throw on invalid route item
  assert.throws(() => defineDocsRoutes([null]), /must be an object/);
  assert.throws(() => defineDocsRoutes([{ path: '/' }]), /must contain a non-empty string title/);
  assert.throws(() => defineDocsRoutes([{ title: 'Doc' }]), /must contain a non-empty string path/);

  // Duplicate path detection
  let duplicateRoutes = [
    { path: '/getting-started', title: 'Start' },
    { path: '/getting-started', title: 'Again' },
  ];
  assert.throws(() => defineDocsRoutes(duplicateRoutes), /Duplicate documentation path found/);

  // Should normalize path and freeze routes
  let validRoutes = [
    { path: 'getting-started', title: 'Getting Started', section: 'Guide' },
    { path: '/api', title: 'API Reference', section: 'Reference' },
  ];
  let processed = defineDocsRoutes(validRoutes);

  assert.equal(processed.length, 2);
  assert.equal(processed[0].path, '/getting-started/'); // prepended slash and normalized trailing slash
  assert.equal(processed[1].path, '/api/');

  assert.ok(Object.isFrozen(processed));
  assert.ok(Object.isFrozen(processed[0]));
});

test('defineDocsRoutes - defaultSection option fallback', () => {
  // Should validate defaultSection option
  assert.throws(() => defineDocsRoutes([], { defaultSection: 123 }), /defaultSection must be a non-empty string/);
  assert.throws(() => defineDocsRoutes([], { defaultSection: ' ' }), /defaultSection must be a non-empty string/);
  assert.throws(() => defineDocsRoutes([], null), /Options must be a valid object/);

  let routes = [
    { path: '/doc1', title: 'Doc One' },
    { path: '/doc2', title: 'Doc Two', section: 'Explicit Section' },
  ];
  let processed = defineDocsRoutes(routes, { defaultSection: 'Fallback Section' });
  assert.strictEqual(processed[0].section, 'Fallback Section');
  assert.strictEqual(processed[1].section, 'Explicit Section');
});


test('renderThemeBoot - returns valid script tag', () => {
  let script = renderThemeBoot('test-storage-key');
  assert.ok(script.includes('<script>'));
  assert.ok(script.includes('test-storage-key'));
  assert.ok(script.includes('localStorage.getItem'));
});

test('renderThemeBoot - storage key contract validations', () => {
  // Reject injection-bearing or empty keys
  assert.throws(() => renderThemeBoot(''), /themeStorageKey must be a valid alphanumeric\/hyphen\/underscore string/);
  assert.throws(() => renderThemeBoot('; alert(1); //'), /themeStorageKey must be a valid alphanumeric\/hyphen\/underscore string/);
  assert.throws(() => renderThemeBoot('lp-theme;'), /themeStorageKey must be a valid alphanumeric\/hyphen\/underscore string/);
  assert.throws(() => renderThemeBoot(null), /themeStorageKey must be a valid alphanumeric\/hyphen\/underscore string/);
  assert.throws(() => renderThemeBoot({}), /themeStorageKey must be a valid alphanumeric\/hyphen\/underscore string/);

  // Accept valid storage keys
  assert.doesNotThrow(() => renderThemeBoot('lp-theme'));
  assert.doesNotThrow(() => renderThemeBoot('lp_theme_1'));
  assert.doesNotThrow(() => renderThemeBoot('custom-theme-key'));
  assert.doesNotThrow(() => renderThemeBoot(undefined)); // defaults to lp-theme
});

function extractThemeBootBody(scriptHtml) {
  let match = scriptHtml.match(/^<script>\n([\s\S]*)\n<\/script>$/);
  assert.ok(match, 'theme boot markup should be a single plain inline script element');
  return match[1];
}

function runThemeBoot({ storedTheme = null, storageThrows = false, prefersDark = false, mediaThrows = false } = {}) {
  let classes = new Set();
  let attributes = {};
  let calls = [];
  let sandbox = {
    document: {
      documentElement: {
        classList: {
          add: (...names) => {
            calls.push(['classList.add', ...names]);
            names.forEach(name => classes.add(name));
          },
          remove: (...names) => {
            names.forEach(name => classes.delete(name));
          },
          contains: (name) => classes.has(name),
        },
        setAttribute: (name, value) => {
          calls.push(['setAttribute', name, value]);
          attributes[name] = value;
        },
        getAttribute: (name) => (name in attributes ? attributes[name] : null),
      },
    },
    localStorage: {
      getItem: (key) => {
        calls.push(['localStorage.getItem', key]);
        if (storageThrows) {
          throw new Error('SecurityError: storage access denied');
        }
        return storedTheme;
      },
    },
    window: {
      matchMedia: (query) => {
        if (mediaThrows) {
          throw new Error('NotSupportedError: media query denied');
        }
        return { matches: prefersDark && query.includes('dark') };
      },
    },
  };
  vm.runInNewContext(extractThemeBootBody(renderThemeBoot('lp-theme')), sandbox);
  return { classes, attributes, calls };
}

test('renderThemeBoot - deterministic bootstrap execution against stub DOM/storage/media scenarios', () => {
  // A valid stored theme wins over the system preference
  let storedDark = runThemeBoot({ storedTheme: 'dark', prefersDark: false });
  assert.equal(storedDark.attributes['data-theme'], 'dark');
  assert.ok(storedDark.classes.has('dark'));
  assert.ok(!storedDark.classes.has('light'));

  let storedLight = runThemeBoot({ storedTheme: 'light', prefersDark: true });
  assert.equal(storedLight.attributes['data-theme'], 'light');
  assert.ok(storedLight.classes.has('light'));
  assert.ok(!storedLight.classes.has('dark'));

  // Invalid or missing stored values fall back to the system dark preference, then light
  let invalidStored = runThemeBoot({ storedTheme: 'solarized', prefersDark: true });
  assert.equal(invalidStored.attributes['data-theme'], 'dark');
  assert.ok(invalidStored.classes.has('dark'));

  let unsetStored = runThemeBoot({ storedTheme: null, prefersDark: false });
  assert.equal(unsetStored.attributes['data-theme'], 'light');
  assert.ok(unsetStored.classes.has('light'));

  // Storage failure still resolves the system preference
  let storageDenied = runThemeBoot({ storageThrows: true, prefersDark: true });
  assert.equal(storageDenied.attributes['data-theme'], 'dark');
  assert.ok(storageDenied.classes.has('dark'));

  // js-active is added before any fallible work
  for (let run of [storedDark, storageDenied]) {
    let jsActiveAt = run.calls.findIndex(call => call[0] === 'classList.add' && call[1] === 'js-active');
    let storageAt = run.calls.findIndex(call => call[0] === 'localStorage.getItem');
    assert.ok(jsActiveAt !== -1, 'js-active class is applied');
    assert.ok(storageAt === -1 || jsActiveAt < storageAt, 'js-active is added before fallible storage access');
  }

  // Storage and media both failing still lands on the light fallback with a set data-theme
  let hardFailure = runThemeBoot({ storageThrows: true, mediaThrows: true });
  assert.equal(hardFailure.attributes['data-theme'], 'light');
  assert.ok(hardFailure.classes.has('light'));
  assert.ok(hardFailure.classes.has('js-active'));
});

test('renderThemeBoot - bootstrap body parses standalone and uses binding-free catch blocks', () => {
  let script = renderThemeBoot('lp-theme');
  assert.doesNotMatch(
    script,
    /catch\s*\(/,
    'catch bindings let minifiers collide renamed declarations with the binding scope; use binding-free catch blocks'
  );
  assert.doesNotThrow(
    () => new vm.Script(extractThemeBootBody(script)),
    'bootstrap body must parse as a standalone script after minifier-safe authoring'
  );
});

test('Progressive header controls - markup and CSS rules assertions', () => {
  let siteConfig = defineSiteConfig({
    brand: { title: 'Aesthetic Lib' },
  });

  // 1. Assert HTML markup does not contain hidden attribute
  let headerHtml = renderHeader(siteConfig);
  assert.ok(!headerHtml.includes('data-search-trigger title="Search (Cmd+K)" aria-label="Search" hidden'), 'search trigger should not have hidden attribute');
  assert.ok(!headerHtml.includes('data-theme-toggle title="Toggle Theme" aria-label="Toggle Theme" hidden'), 'theme toggle should not have hidden attribute');
  assert.ok(headerHtml.includes('data-search-trigger'), 'should render search trigger');
  assert.ok(headerHtml.includes('data-theme-toggle'), 'should render theme toggle');

  // 2. Assert CSS rules alone hide them before .js-active and reveal them under .js-active without !important
  let styles = renderStyles(siteConfig);

  // Find display rules for search trigger and theme toggle
  // Assert they are hidden (display: none) by default
  assert.ok(styles.includes('.lp-btn[data-search-trigger],\n.lp-btn[data-theme-toggle] {\n  display: none;\n}'), 'progressive buttons must be display: none by default');

  // Assert they are shown under .js-active
  assert.ok(styles.includes('.js-active .lp-btn[data-search-trigger],\n.js-active .lp-btn[data-theme-toggle] {\n  display: inline-flex;\n}'), 'progressive buttons must be display: inline-flex under .js-active');

  // Assert no !important is used to reveal them
  let jsActiveMatch = styles.match(/\.js-active\s+\.lp-btn\[data-search-trigger\][^{]*\{([^}]+)\}/) ||
                      styles.match(/\.js-active\s+\.lp-btn\[data-search-trigger\],\s*\.js-active\s+\.lp-btn\[data-theme-toggle\]\s*\{([^}]+)\}/);
  if (jsActiveMatch) {
    assert.ok(!jsActiveMatch[1].includes('!important'), 'reveal rule must not use !important');
  }
});


test('renderHeader - static mobile details navigation mirrors desktop semantics without JS gating', () => {
  let siteConfig = defineSiteConfig({
    brand: { title: 'Nav Lib' },
    basePath: '/docs/',
    navigation: [
      { label: 'Home', path: '/' },
      { label: 'Guide', path: '/guide' },
    ],
  });

  let headerHtml = renderHeader(siteConfig, '/guide/');

  // Desktop navigation markup stays as before
  assert.ok(headerHtml.includes('<nav class="lp-nav">'), 'desktop nav markup is unchanged');

  // Exactly one static details navigation, not hidden behind an attribute or JS gate
  let detailsCount = (headerHtml.match(/<details class="lp-header-nav">/g) || []).length;
  assert.equal(detailsCount, 1, 'exactly one static mobile details navigation is rendered');
  assert.ok(
    !/<details class="lp-header-nav"[^>]*\shidden/.test(headerHtml),
    'mobile details navigation does not rely on a hidden attribute'
  );

  let detailsStart = headerHtml.indexOf('<details class="lp-header-nav">');
  let detailsEnd = headerHtml.indexOf('</details>') + '</details>'.length;
  let mobileNavHtml = headerHtml.slice(detailsStart, detailsEnd);

  // Accessible summary and contained nav landmark
  let summaryMatch = mobileNavHtml.match(/<summary>([^<]+)<\/summary>/);
  assert.ok(summaryMatch && summaryMatch[1].trim().length > 0, 'summary exposes an accessible name');
  assert.ok(
    /<nav class="lp-header-nav-menu" aria-label="[^"]+">/.test(mobileNavHtml),
    'contained nav exposes an accessible label'
  );

  // Same base-path resolution, active class, and aria-current semantics as the desktop nav
  assert.ok(
    mobileNavHtml.includes('href="/docs/guide/" class="lp-nav-link active" aria-current="page"'),
    'active mobile link carries the active class and aria-current'
  );
  assert.ok(
    mobileNavHtml.includes('href="/docs/" class="lp-nav-link"'),
    'inactive mobile link resolves through the base path'
  );
});

test('renderHeader - omits mobile details navigation when navigation is empty', () => {
  let siteConfig = defineSiteConfig({ brand: { title: 'No Nav' } });
  let headerHtml = renderHeader(siteConfig);
  assert.ok(!headerHtml.includes('lp-header-nav'), 'no mobile details navigation without configured navigation');
});


test('extractTOC - correctly extracts headers with IDs', () => {
  let html = `
    <div>
      <h2 id="first-header">First Header</h2>
      <p>Some text</p>
      <h3 id="sub-header">Sub Header with <em>markup</em></h3>
      <h2>Header without ID (ignored)</h2>
      <h2 id="second-header">Second Header</h2>
    </div>
  `;

  let toc = extractTOC(html);
  assert.equal(toc.length, 3);

  assert.equal(toc[0].id, 'first-header');
  assert.equal(toc[0].text, 'First Header');
  assert.equal(toc[0].depth, 2);

  assert.equal(toc[1].id, 'sub-header');
  assert.equal(toc[1].text, 'Sub Header with markup'); // stripped HTML tag
  assert.equal(toc[1].depth, 3);

  assert.equal(toc[2].id, 'second-header');
  assert.equal(toc[2].text, 'Second Header');
  assert.equal(toc[2].depth, 2);
});

test('renderTOC - returns formatted list HTML', () => {
  let toc = [
    { id: 'h1', text: 'First', depth: 2 },
    { id: 'h2', text: 'Second', depth: 3 },
  ];
  let html = renderTOC(toc);
  assert.ok(html.includes('<aside class="lp-toc">'));
  assert.ok(html.includes('<nav class="lp-toc-outline" aria-label="On this page">'));
  assert.ok(html.includes('<div class="lp-toc-marker" aria-hidden="true"></div>'));
  assert.ok(html.includes('<div class="lp-toc-title">On this page</div>'));
  assert.ok(html.includes('href="/#h1"'));
  assert.ok(html.includes('class="lp-toc-item depth-2"'));
  assert.ok(html.includes('class="lp-toc-item depth-3"'));

  // Test custom base and route path
  let htmlCustom = renderTOC(toc, { path: '/guide/' }, { basePath: '/my-base/' });
  assert.ok(htmlCustom.includes('href="/my-base/guide/#h1"'));
  assert.ok(htmlCustom.includes('href="/my-base/guide/#h2"'));
});


test('renderSidebar - groups routes by section correctly', () => {
  let routes = [
    { path: '/intro', title: 'Intro', section: 'Start' },
    { path: '/setup', title: 'Setup', section: 'Start' },
    { path: '/config', title: 'Config', section: 'Advanced' },
  ];

  let html = renderSidebar(routes, { path: '/setup' });
  assert.ok(html.includes('class="lp-sidebar-group-title">Start</div>'));
  assert.ok(html.includes('class="lp-sidebar-group-title">Advanced</div>'));
  assert.ok(html.includes('href="/intro/" class="lp-sidebar-link"'));
  assert.ok(html.includes('href="/setup/" class="lp-sidebar-link active"'));
});

test('renderPager - generates next/prev links correctly', () => {
  let routes = [
    { path: '/page1', title: 'Page One' },
    { path: '/page2', title: 'Page Two' },
    { path: '/page3', title: 'Page Three' },
  ];

  // Middle page (both prev and next exist)
  let pager1 = renderPager(routes, { path: '/page2' });
  assert.ok(pager1.includes('href="/page1/"'));
  assert.ok(pager1.includes('href="/page3/"'));
  assert.ok(pager1.includes('Page One'));
  assert.ok(pager1.includes('Page Three'));

  // First page (prev doesn't exist)
  let pager2 = renderPager(routes, { path: '/page1' });
  assert.ok(!pager2.includes('href="/page0/"'));
  assert.ok(pager2.includes('href="/page2/"'));

  // Last page (next doesn't exist)
  let pager3 = renderPager(routes, { path: '/page3' });
  assert.ok(pager3.includes('href="/page2/"'));
  assert.ok(!pager3.includes('href="/page4/"'));
});

test('renderPage - produces full valid HTML page structure', () => {
  let siteConfig = defineSiteConfig({
    brand: { title: 'Aesthetic Lib' },
    clientEntryPath: '/app.js',
    tokenOverrides: { '--lp-color-primary': 'red' },
  });

  let html = renderPage({
    siteConfig,
    pageTitle: 'Test Page',
    contentHtml: '<p>Welcome</p>',
    currentPath: '/home',
  });

  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('<title>Test Page - Aesthetic Lib</title>'));
  assert.ok(html.includes('data-theme-key="lp-theme"'));
  assert.ok(html.includes('src="/app.js"'));
  assert.ok(html.includes('<p>Welcome</p>'));
  assert.ok(html.includes('class="lp-footer"'));
  assert.ok(html.includes('id="lp-search-dialog"'));
  assert.ok(html.includes('--lp-color-primary: red;'));
});

test('renderDocsPage - produces complete docs page structure', () => {
  let siteConfig = defineSiteConfig({
    brand: { title: 'Aesthetic Docs' },
  });

  let routes = defineDocsRoutes([
    { path: '/doc1', title: 'Doc One', section: 'main menu' },
    { path: '/doc2', title: 'Doc Two', section: 'main menu' },
  ]);

  let html = renderDocsPage({
    siteConfig,
    routes,
    currentRoute: routes[0],
    contentHtml: '<h2 id="sec1">Section 1</h2><p>Content</p>',
  });

  assert.ok(html.includes('<title>Doc One - Aesthetic Docs</title>'));
  assert.ok(html.includes('class="lp-docs-layout"'));
  assert.ok(html.includes('class="lp-desktop-sidebar"'));
  assert.ok(html.includes('href="/doc2/"'));
  assert.ok(html.includes('href="/doc1/#sec1"')); // TOC links
  assert.ok(html.includes('Section 1'));
  assert.ok(html.includes('Next →')); // Pager

  // C6 specific assertions
  assert.ok(html.includes('class="lp-mobile-toc"'), 'Mobile TOC strip is rendered');
  assert.ok(html.includes('class="lp-search-label"'), 'Header search label has correct class');
  assert.ok(html.includes('main menu'), 'Sidebar group title preserves product-authored casing');
});


test('CSS Stylesheet - prefers-reduced-motion and Symbiote mapping coverage', () => {
  let styles = renderStyles({});

  // 1. prefers-reduced-motion media query coverage
  assert.ok(styles.includes('prefers-reduced-motion'), 'Should contain prefers-reduced-motion media query');
  assert.ok(styles.includes('transition-duration: 0s'), 'Should reset transition duration under reduced motion');
  assert.ok(styles.includes('transition-delay: 0s'), 'Should reset transition delay under reduced motion');

  // 2. Symbiote mapping rules when [data-lp-symbiote="true"] is applied
  assert.ok(styles.includes('[data-lp-symbiote="true"]'), 'Should target [data-lp-symbiote="true"] selector');
  assert.ok(styles.includes('--lp-font-sans: var(--sn-font'), 'Should bridge --lp-font-sans');
  assert.ok(styles.includes('--lp-font-mono: var(--sn-font-mono'), 'Should bridge --lp-font-mono');
  assert.ok(styles.includes('--lp-color-bg: var(--sn-sys-surface'), 'Should bridge --lp-color-bg');
  assert.ok(styles.includes('--lp-color-text: var(--sn-sys-on-surface'), 'Should bridge --lp-color-text');
  assert.ok(styles.includes('--lp-color-text-muted: var(--sn-sys-on-surface-dim'), 'Should bridge --lp-color-text-muted');
  assert.ok(styles.includes('--lp-color-bg-muted: var(--sn-sys-surface-panel'), 'Should bridge --lp-color-bg-muted');
  assert.ok(styles.includes('--lp-color-primary: var(--sn-sys-accent'), 'Should bridge --lp-color-primary');
  assert.ok(styles.includes('--lp-color-border: var(--sn-border'), 'Should bridge --lp-color-border');
  assert.ok(styles.includes('--lp-color-outline: var(--sn-outline-color'), 'Should bridge --lp-color-outline');
});


test('CSS Stylesheet - AHP design baseline compliance', () => {
  let styles = renderStyles({});

  // 1. Opaque sticky header height and positioning
  assert.ok(styles.includes('height: var(--lp-header-height)'), 'Header height matches baseline height');
  assert.ok(styles.includes('--lp-header-height: 64px;'), 'Header height defined as 64px');
  assert.ok(styles.includes('position: sticky'), 'Header is sticky');
  assert.ok(styles.includes('top: 0'), 'Header is at top');

  // 2. Header border behavior on scroll
  assert.ok(styles.includes('border-bottom: 1px solid transparent'), 'Header default border is transparent');
  assert.ok(styles.includes('body[data-scrolled="true"] .lp-header'), 'Header border appears when scrolled');

  // 3. No header shadow or blur
  let headerBlock = styles.match(/\.lp-header\s*\{([^}]+)\}/)[1];
  assert.ok(!headerBlock.includes('box-shadow'), 'Header should not have box shadow');
  assert.ok(!headerBlock.includes('filter'), 'Header should not have filter/blur');
  assert.ok(!headerBlock.includes('backdrop-filter'), 'Header should not have backdrop filter');

  // 4. Exact unified theme values with lp aliases into the semantic palette
  assert.ok(styles.includes('--page: #ffffff;'), 'Base page color must be #ffffff');
  assert.ok(styles.includes('--ink: #3d3d45;'), 'Base ink color must be #3d3d45');
  assert.ok(styles.includes('--brand: #4058bd;'), 'Base brand color must be #4058bd');
  assert.ok(styles.includes('--lp-color-bg: var(--page);'), 'lp bg aliases the semantic page token');
  assert.ok(styles.includes('--lp-color-text: var(--ink);'), 'lp text aliases the semantic ink token');
  assert.ok(styles.includes('--lp-color-primary: var(--brand);'), 'lp primary aliases the semantic brand token');
  assert.ok(styles.includes('--lp-color-border: var(--line);'), 'lp border aliases the semantic line token');

  // 5. Inter/system font stack
  assert.ok(styles.includes('--lp-font-sans:') && styles.includes('Inter'), 'sans-serif font stack contains Inter');

  // 6. Search control trigger sizing and radius
  assert.ok(styles.includes('.lp-btn[data-search-trigger]'), 'Must target search trigger specifically');
  assert.ok(styles.includes('height: 40px') && styles.includes('border-radius: 8px'), 'Search control is 40px high with 8px radius');

  // 7. Stable brand at mobile widths
  assert.ok(styles.includes('flex-shrink: 0'), 'Brand elements have stable layout');
  assert.ok(styles.includes('text-overflow: ellipsis'), 'Brand title handles overflow gracefully');
  let mobileMediaQueryBlock = styles.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]+?)\n\}/)[1];
  assert.ok(mobileMediaQueryBlock.includes('.lp-nav'), 'Mobile media query styles navigation');
  assert.ok(mobileMediaQueryBlock.includes('display: none'), 'Header navigation hidden on mobile widths');

  // 8. Soft left rail and right TOC dividers
  assert.ok(styles.includes('border-right: 1px solid var(--lp-color-border)'), 'Desktop sidebar has a fine divider');
  assert.ok(styles.includes('border-left: 1px solid var(--lp-color-border)'), 'TOC sidebar has a fine divider');

  // 9. Left-aligned readable content (tokenized article max-width)
  assert.ok(styles.includes('max-width: var(--lp-content-max-width)'), 'Article max-width uses --lp-content-max-width token');
  assert.ok(styles.includes('margin-left: 0'), 'Article is left-aligned');

  // 10. Correct list resets
  assert.ok(styles.includes('.lp-toc-list'), 'TOC list selector is defined');
  assert.ok(styles.includes('.lp-sidebar-list'), 'Sidebar list selector is defined');
  assert.ok(styles.includes('.lp-search-results-list'), 'Search results list selector is defined');

  // 11. Pager controls transparent layout (no card framing)
  let pagerLinkBlock = styles.match(/\.lp-pager-link\s*\{([^}]+)\}/)[1];
  assert.ok(pagerLinkBlock.includes('border: none'), 'Pager link border is none');
  assert.ok(pagerLinkBlock.includes('background: transparent'), 'Pager link background is transparent');

  // 12. No !important outside reduced motion
  let nonReducedMotionStyles = styles.split('prefers-reduced-motion')[0];
  assert.ok(!nonReducedMotionStyles.includes('!important'), 'Should not use !important outside reduced motion rules');

  // 13. Symbiote overlay mapping is present
  assert.ok(styles.includes('--lp-color-overlay: var(--sn-sys-surface-overlay'), 'Should bridge overlay surface');

  // 14. Full-width layout
  assert.ok(styles.includes('max-width: none'), 'Layout is full-width');

  // 15. 272px rail
  assert.ok(styles.includes('--lp-sidebar-width: 272px;'), 'Sidebar width is 272px');

  // 16. Mobile TOC style
  assert.ok(styles.includes('.lp-mobile-toc'), 'Mobile TOC selector is defined');

  // 17. Search label style
  assert.ok(styles.includes('.lp-search-label'), 'Search label selector is defined');

  // 18. Pre-section h2 border (border-top) and no bottom border
  let h2Block = styles.match(/\.lp-article\s+h2\s*\{([^}]+)\}/)[1];
  assert.ok(h2Block.includes('border-top: 1px solid var(--lp-color-border)'), 'h2 section divider is top border');
  assert.ok(!h2Block.includes('border-bottom'), 'h2 has no bottom border');

  // 19. No uppercase transform on group titles
  let groupTitleBlock = styles.match(/\.lp-sidebar-group-title\s*\{([^}]+)\}/)[1];
  assert.ok(!groupTitleBlock.includes('text-transform: uppercase'), 'Sidebar group titles are not forced to uppercase');
  assert.ok(!groupTitleBlock.includes('letter-spacing'), 'Sidebar group titles do not have wide tracking');
});


test('defineSiteConfig - metadata.icon and pageStyles acceptance and rejection', () => {
  let accepted = defineSiteConfig({
    brand: { title: 'Head Fields' },
    metadata: { icon: '/favicon.svg' },
    pageStyles: '.lp-page-container > h1 { letter-spacing: 0.01em; }',
  });
  assert.equal(accepted.metadata.icon, '/favicon.svg');
  assert.equal(accepted.pageStyles, '.lp-page-container > h1 { letter-spacing: 0.01em; }');
  assert.ok(Object.isFrozen(accepted.metadata));

  assert.throws(
    () => defineSiteConfig({ brand: { title: 'T' }, metadata: { icon: '' } }),
    /Metadata icon must be a non-empty string/
  );
  assert.throws(
    () => defineSiteConfig({ brand: { title: 'T' }, metadata: { icon: '   ' } }),
    /Metadata icon must be a non-empty string/
  );
  assert.throws(
    () => defineSiteConfig({ brand: { title: 'T' }, metadata: { icon: 42 } }),
    /Metadata icon must be a non-empty string/
  );

  assert.throws(
    () => defineSiteConfig({ brand: { title: 'T' }, pageStyles: 42 }),
    /pageStyles must be a string/
  );
  assert.throws(
    () => defineSiteConfig({ brand: { title: 'T' }, pageStyles: 'a { color: red; } </style><script>alert(1)</script>' }),
    /pageStyles must not contain/
  );
});

test('defineSiteConfig - pageStyles accepts full CSS syntax and rejects mixed-case closing style', () => {
  let css = '@media (min-width: 900px) { .lp-article > pre > code { font-size: 0.9em; } }';
  let accepted = defineSiteConfig({ brand: { title: 'T' }, pageStyles: css });
  assert.equal(accepted.pageStyles, css);

  assert.throws(
    () => defineSiteConfig({ brand: { title: 'T' }, pageStyles: 'a { color: red; } </StYlE>' }),
    /pageStyles must not contain/
  );
});

test('renderHead - omits favicon and page styles when fields are absent', () => {
  let siteConfig = defineSiteConfig({ brand: { title: 'Defaults' } });
  let head = renderHead(siteConfig);
  assert.ok(!head.includes('rel="icon"'), 'no favicon link without metadata.icon');
  let styleTags = head.match(/<style>/g) || [];
  assert.equal(styleTags.length, 1, 'only the package baseline style tag is emitted');
});

test('renderHead - resolves favicon through base path and escapes the attribute', () => {
  let siteConfig = defineSiteConfig({
    brand: { title: 'Icons' },
    basePath: '/docs/',
    metadata: { icon: '/favicon.svg' },
  });
  let head = renderHead(siteConfig);
  assert.ok(head.includes('<link rel="icon" href="/docs/favicon.svg">'));

  let quoted = defineSiteConfig({
    brand: { title: 'Icons' },
    metadata: { icon: '/icons/a"b.svg' },
  });
  let quotedHead = renderHead(quoted);
  assert.ok(quotedHead.includes('href="/icons/a&quot;b.svg"'));
  assert.ok(!quotedHead.includes('href="/icons/a"b.svg"'));
});

test('renderHead - passes data-URI favicons through unchanged', () => {
  let icon = 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22/%3E';
  let siteConfig = defineSiteConfig({
    brand: { title: 'Icons' },
    basePath: '/docs/',
    metadata: { icon },
  });
  let head = renderHead(siteConfig);
  assert.ok(head.includes(`<link rel="icon" href="${icon}">`));
});

test('renderHead - emits page styles after baseline CSS and before theme boot', () => {
  let siteConfig = defineSiteConfig({
    brand: { title: 'Styled' },
    pageStyles: '.lp-page-container > h1 { letter-spacing: 0.01em; }',
  });
  let head = renderHead(siteConfig);
  assert.ok(head.includes('<style>.lp-page-container > h1 { letter-spacing: 0.01em; }</style>'));

  let baselineEnd = head.indexOf('</style>');
  let pageStyleAt = head.indexOf('<style>.lp-page-container');
  let themeBootAt = head.indexOf('<script>');
  assert.ok(baselineEnd !== -1 && pageStyleAt > baselineEnd, 'page styles follow the package baseline CSS');
  assert.ok(themeBootAt !== -1 && pageStyleAt < themeBootAt, 'page styles precede the theme boot script');
});

test('renderHead - defensively rejects invalid pageStyles at render time', () => {
  let closingSequence = {
    brand: { title: 'Raw' },
    basePath: '/',
    themeStorageKey: 'lp-theme',
    pageStyles: 'a { color: red; } </STYLE><script>alert(1)</script>',
  };
  assert.throws(() => renderHead(closingSequence), /pageStyles must not contain/);

  let wrongType = {
    brand: { title: 'Raw' },
    basePath: '/',
    themeStorageKey: 'lp-theme',
    pageStyles: 42,
  };
  assert.throws(() => renderHead(wrongType), /pageStyles must be a string/);

  let nullStyles = {
    brand: { title: 'Raw' },
    basePath: '/',
    themeStorageKey: 'lp-theme',
    pageStyles: null,
  };
  assert.throws(() => renderHead(nullStyles), /pageStyles must be a string/);
});

test('defineSiteConfig - validates the optional stack section', () => {
  let base = {
    brand: { title: 'Test Library' },
    stack: {
      title: 'Part of the Symbiote stack',
      items: [
        { label: 'symbiote-workspace', description: 'Flagship track.', path: 'https://example.test/workspace/' },
        { label: 'This library', description: 'You are here.', current: true },
      ],
    },
  };
  let processed = defineSiteConfig(base);
  assert.equal(processed.stack.items.length, 2);
  assert.ok(Object.isFrozen(processed.stack));

  assert.throws(() => defineSiteConfig({ brand: { title: 'x' }, stack: [] }), /stack must be an object/);
  assert.throws(() => defineSiteConfig({ brand: { title: 'x' }, stack: { title: ' ', items: [{ label: 'a', description: 'b', path: '/' }] } }), /Stack title/);
  assert.throws(() => defineSiteConfig({ brand: { title: 'x' }, stack: { title: 'T', items: [] } }), /non-empty array/);
  assert.throws(() => defineSiteConfig({ brand: { title: 'x' }, stack: { title: 'T', items: [{ label: 'a', description: 'b' }] } }), /must have a "path" unless it is marked "current"/);
  assert.throws(() => defineSiteConfig({ brand: { title: 'x' }, stack: { title: 'T', items: [{ label: ' ', description: 'b', path: '/' }] } }), /"label" \(string\) and "description"/);
});

test('renderPage - renders the stack section only when configured', () => {
  let withoutStack = defineSiteConfig({ brand: { title: 'Solo' }, basePath: '/lib/' });
  let plain = renderPage({ siteConfig: withoutStack, contentHtml: '<p>x</p>', currentPath: '/' });
  assert.ok(!plain.includes('class="lp-stack"'));

  let withStack = defineSiteConfig({
    brand: { title: 'Solo' },
    basePath: '/lib/',
    stack: {
      title: 'Part of the <Symbiote> stack',
      tagline: 'One stack, three libraries.',
      items: [
        { label: 'symbiote-workspace', description: 'Flagship & primary track.', path: 'https://example.test/workspace/' },
        { label: 'Docs home', description: 'Local link.', path: '/docs/' },
        { label: 'Solo', description: 'You are here.', current: true },
      ],
    },
  });
  let html = renderPage({ siteConfig: withStack, contentHtml: '<p>x</p>', currentPath: '/' });
  assert.ok(html.includes('class="lp-stack"'));
  assert.ok(html.includes('aria-label="Part of the &lt;Symbiote&gt; stack"'));
  assert.ok(html.includes('One stack, three libraries.'));
  assert.ok(html.includes('Flagship &amp; primary track.'));
  assert.ok(html.includes('href="https://example.test/workspace/"'));
  assert.ok(html.includes('href="/lib/docs/"'));
  assert.ok(html.includes('aria-current="true"'));
  let stackIndex = html.indexOf('class="lp-stack"');
  assert.ok(stackIndex > html.indexOf('class="lp-page-container"'));
  assert.ok(stackIndex < html.indexOf('class="lp-footer"'));
});

test('renderStyles - ships the shared landing patterns and reference motion utilities', () => {
  let css = renderStyles({});
  for (let cls of ['.lp-hero-title', '.lp-hero-accent', '.lp-cta-primary', '.lp-eyebrow', '.lp-section-title', '.lp-story-row', '.lp-anim-dash', '.lp-anim-pulse']) {
    assert.ok(css.includes(cls), `baseline styles must ship ${cls}`);
  }
  assert.match(css, /prefers-reduced-motion: no-preference[\s\S]*\.js-active \.lp-anim-dash/);
  assert.match(css, /\.lp-article img \{[^}]*max-width: 100%/);
});

test('renderStyles - ships the unified default theme with semantic aliases', () => {
  let css = renderStyles({});
  assert.match(css, /--brand: #4058bd/);
  assert.match(css, /--lp-color-primary: var\(--brand\)/);
  assert.match(css, /--lp-color-bg: var\(--page\)/);
  assert.match(css, /\[data-theme="dark"\], \.dark \{[^}]*--brand: #8192ff/);
  assert.match(css, /\.lp-article blockquote/);
  assert.match(css, /\.lp-article table/);
});

test('renderStyles - bridges article code blocks into the semantic syntax palette', () => {
  let css = renderStyles({});
  assert.match(css, /\.lp-article code-block \{[^}]*--sn-syntax-keyword: var\(--brand\)/);
  assert.match(css, /\.lp-article code-block \{[^}]*--sn-sys-surface: var\(--surface-code\)/);
});

test('renderStyles - semantic font tokens stay concrete to avoid the symbiote bridge cycle', () => {
  let css = renderStyles({});
  const sans = css.match(/--sans:\s*([^;]+);/);
  const mono = css.match(/--mono:\s*([^;]+);/);
  assert.ok(sans && !sans[1].includes('var(--lp-font'), '--sans must not alias --lp-font-sans');
  assert.ok(mono && !mono[1].includes('var(--lp-font'), '--mono must not alias --lp-font-mono');
  assert.ok(sans[1].includes('Inter'), '--sans carries the shared Inter stack');
});

test('ensureHeadingAnchors - generates ids, keeps existing ones, adds hover anchors', () => {
  let html = '<h2>Getting Started</h2><h2 id="kept">Kept</h2><h3>Getting Started</h3><h2>Getting Started</h2>';
  let out = ensureHeadingAnchors(html);
  assert.match(out, /<h2 id="getting-started">Getting Started <a class="lp-anchor" href="#getting-started"/);
  assert.match(out, /<h2 id="kept">Kept <a class="lp-anchor" href="#kept"/);
  assert.match(out, /id="getting-started-2"/);
  assert.match(out, /id="getting-started-3"/);
  assert.equal(ensureHeadingAnchors(out), out, 'idempotent on already-anchored content');
});

test('renderDocsPage - renders desktop TOC data, edit link, and anchored headings', () => {
  let cfg = defineSiteConfig({
    brand: { title: 'T' },
    basePath: '/lib/',
    editBaseUrl: 'https://github.com/o/r/edit/main/docs/',
  });
  let routes = defineDocsRoutes([
    { path: '/docs/', title: 'One', section: 'S', editPath: 'one.md' },
    { path: '/docs/two/', title: 'Two', section: 'S', editPath: 'two.md' },
  ]);
  let html = renderDocsPage({
    siteConfig: cfg,
    routes,
    currentRoute: routes[0],
    contentHtml: '<h2>Alpha Beta</h2><p>x</p>',
  });
  assert.match(html, /class="lp-anchor" href="#alpha-beta"/);
  assert.match(html, /lp-toc-link">Alpha Beta</, 'TOC text carries no anchor suffix');
  assert.match(html, /class="lp-edit-link" href="https:\/\/github\.com\/o\/r\/edit\/main\/docs\/one\.md"/);
  assert.match(html, /Edit this page on GitHub/);

  let noEdit = renderDocsPage({
    siteConfig: defineSiteConfig({ brand: { title: 'T' } }),
    routes,
    currentRoute: routes[0],
    contentHtml: '<p>x</p>',
  });
  assert.ok(!noEdit.includes('class="lp-edit-link"'));
});

test('renderHeader - highlights the owning nav section by path prefix', () => {
  let cfg = defineSiteConfig({
    brand: { title: 'T' },
    navigation: [
      { label: 'Home', path: '/' },
      { label: 'Guide', path: '/docs/' },
      { label: 'GitHub', path: 'https://github.com/x' },
    ],
  });
  let deep = renderHeader(cfg, '/docs/guide/');
  assert.match(deep, /class="lp-nav-link active" aria-current="page">Guide/);
  assert.ok(!/class="lp-nav-link active"[^>]*>Home/.test(deep), 'Home is not active on docs pages');
  assert.ok(!/class="lp-nav-link active"[^>]*>GitHub/.test(deep), 'External links never activate');
  let home = renderHeader(cfg, '/');
  assert.match(home, /class="lp-nav-link active" aria-current="page">Home/);
});

test('renderStyles - ships desktop outline, anchor, and edit-link styles', () => {
  let css = renderStyles({});
  assert.match(css, /@media \(min-width: 1280px\) \{[\s\S]*?\.lp-toc \{[\s\S]*?display: block/);
  assert.match(css, /\.lp-anchor \{/);
  assert.match(css, /\.lp-edit-link \{/);
  assert.match(css, /\.lp-toc-outline \{[^}]*border-left: 1px solid var\(--lp-color-border\)/, 'Outline rail divider');
  assert.match(css, /\.lp-toc-marker \{[^}]*transition: top 0\.25s cubic-bezier\(0, 1, 0\.5, 1\)/, 'Marker slides with the reference easing');
  assert.match(css, /\.lp-toc-marker\.is-visible \{[^}]*display: block/, 'Marker appears only when the spy activates it');
  assert.match(css, /\.lp-toc-link \{[^}]*line-height: 2rem/, 'Outline links use the 32px reference rhythm');
  assert.match(css, /html \{[^}]*scroll-padding-top: calc\(var\(--lp-header-height\) \+ 24px\)/, 'Anchor jumps clear the sticky header');
});

test('renderStyles - ships the shared card grid pattern', () => {
  let css = renderStyles({});
  assert.match(css, /\.lp-card-grid \{[^}]*repeat\(auto-fill, minmax\(280px, 1fr\)\)/);
  assert.match(css, /a\.lp-card:hover \{[^}]*border-color: var\(--lp-color-primary\)/);
});
