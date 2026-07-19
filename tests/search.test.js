import { test } from 'node:test';
import assert from 'node:assert';
import { parseHTML } from 'linkedom';
import { buildSearchIndex, renderSearchDialog } from '../search/index.js';
import { enhanceSearch } from '../client/search.js';
import { enhanceLibraryPages } from '../client/index.js';
import { defineSiteConfig, defineDocsRoutes, renderDocsPage } from '../shell/index.js';

test('buildSearchIndex creates searchText and preserves fields', () => {
  let routes = [
    { path: '/intro', title: 'Introduction', section: 'Guide', description: 'Getting started doc', headers: ['Setup', 'Run'] },
    { path: '/api', title: 'API Reference', section: 'API', description: 'Function list' },
  ];
  let index = buildSearchIndex(routes);

  assert.strictEqual(index.length, 2);
  assert.strictEqual(index[0].path, '/intro/');
  assert.strictEqual(index[0].title, 'Introduction');
  assert.strictEqual(index[0].section, 'Guide');
  assert.strictEqual(index[0].description, 'Getting started doc');
  assert.deepStrictEqual(index[0].headers, ['Setup', 'Run']);
  assert.ok(index[0].searchText.includes('introduction'));
});

test('renderSearchDialog returns basic HTML structure', () => {
  let html = renderSearchDialog({ basePath: '/docs-sub', placeholder: 'Find in docs...' });
  assert.ok(html.includes('id="lp-search-dialog"'));
  assert.ok(html.includes('data-base-path="/docs-sub/"'));
  assert.ok(html.includes('placeholder="Find in docs..."'));
  assert.ok(html.includes('<script type="application/json" class="lp-search-index-data" data-search-index>[]</script>'));

  // Test explicit array works
  let htmlWithArr = renderSearchDialog({ searchIndex: [{ path: '/a', title: 'A' }] });
  assert.ok(htmlWithArr.includes('data-search-index>[{"path":"/a","title":"A"}]</script>'));

  // Reject a non-array explicit search index
  assert.throws(() => renderSearchDialog({ searchIndex: {} }), TypeError);
  assert.throws(() => renderSearchDialog({ searchIndex: 'not-an-array' }), TypeError);
  assert.throws(() => renderSearchDialog({ searchIndex: null }), TypeError);
});

test('enhanceSearch validates dialog methods and does not throw', () => {
  let { window, document } = parseHTML('<div></div>');
  globalThis.window = window;
  globalThis.document = document;

  let element = document.createElement('div');
  let cleanup = enhanceSearch(element);
  assert.strictEqual(typeof cleanup, 'function');
  cleanup();

  delete globalThis.window;
  delete globalThis.document;
});

test('enhanceSearch handles search interactions and fulfills behavior contracts', () => {
  let html = `
    <!DOCTYPE html>
    <html>
      <body>
        <button id="external-trigger" data-search-trigger>Search</button>
        ${renderSearchDialog({ basePath: '/my-sub-path' })}
      </body>
    </html>
  `;

  let { window, document } = parseHTML(html);
  globalThis.window = window;
  globalThis.document = document;
  globalThis.CustomEvent = window.CustomEvent;

  let dialog = window.document.querySelector('[data-search-dialog]');
  let searchInput = window.document.querySelector('[data-search-input]');
  let resultsList = window.document.querySelector('[data-search-results]');
  let resultsCount = window.document.querySelector('[data-search-count]');
  let triggerBtn = window.document.getElementById('external-trigger');

  dialog.open = false;
  let showModalCount = 0;
  let closeCount = 0;

  dialog.showModal = () => {
    dialog.open = true;
    showModalCount++;
  };
  dialog.close = () => {
    dialog.open = false;
    closeCount++;
    let closeEvent = new window.Event('close');
    dialog.dispatchEvent(closeEvent);
  };

  window.HTMLElement.prototype.scrollIntoView = () => {};

  let searchIndex = buildSearchIndex([
    { path: '/getting-started', title: 'Getting Started', section: 'Guide', description: 'Install package' },
    { path: '/api/config', title: 'Config Reference', section: 'API', description: 'Configure settings', headers: ['environment', 'variables'] },
  ]);

  let cleanup = enhanceSearch(dialog, searchIndex);

  let kEvent = new window.Event('keydown', { bubbles: true });
  kEvent.key = 'k';
  kEvent.ctrlKey = true;
  window.document.dispatchEvent(kEvent);
  assert.strictEqual(showModalCount, 1);
  assert.ok(dialog.open);

  dialog.close();
  assert.strictEqual(dialog.open, false);

  dialog.open = true;
  showModalCount = 0;
  let clickEvent = new window.Event('click', { bubbles: true });
  triggerBtn.dispatchEvent(clickEvent);
  assert.strictEqual(showModalCount, 0);

  dialog.open = false;
  triggerBtn.dispatchEvent(clickEvent);
  assert.strictEqual(showModalCount, 1);

  searchInput.value = 'config';
  let inputEvent = new window.Event('input', { bubbles: true });
  searchInput.dispatchEvent(inputEvent);

  let items = resultsList.querySelectorAll('.lp-search-result-item');
  assert.strictEqual(items.length, 1);
  assert.ok(items[0].textContent.includes('Config Reference'));

  let downEvent = new window.Event('keydown', { bubbles: true });
  downEvent.key = 'ArrowDown';
  searchInput.dispatchEvent(downEvent);
  assert.strictEqual(items[0].getAttribute('aria-selected'), 'true');
  assert.strictEqual(searchInput.getAttribute('aria-activedescendant'), items[0].id);

  searchInput.value = '';
  searchInput.dispatchEvent(inputEvent);
  assert.strictEqual(searchInput.getAttribute('aria-activedescendant'), null);

  cleanup();
  assert.strictEqual(searchInput.getAttribute('aria-activedescendant'), null);

  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.CustomEvent;
});

test('enhanceSearch guards against malformed search index items', () => {
  let html = `
    <!DOCTYPE html>
    <html>
      <body>
        ${renderSearchDialog()}
      </body>
    </html>
  `;
  let { window, document } = parseHTML(html);
  globalThis.window = window;
  globalThis.document = document;

  let dialog = window.document.querySelector('[data-search-dialog]');
  let searchInput = window.document.querySelector('[data-search-input]');
  let resultsList = window.document.querySelector('[data-search-results]');

  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };

  let malformedIndex = [
    null,
    undefined,
    {},
    { searchText: 123 },
    { searchText: 'correct', path: '/ok', title: 'Valid Item' },
    { searchText: 'bad path', path: null, title: 'No Path' },
    { searchText: 'bad title', path: '/ok', title: {} }
  ];

  let cleanup = enhanceSearch(dialog, malformedIndex);
  searchInput.value = 'correct';
  let inputEvent = new window.Event('input', { bubbles: true });
  assert.doesNotThrow(() => {
    searchInput.dispatchEvent(inputEvent);
  });

  let items = resultsList.querySelectorAll('.lp-search-result-item');
  assert.strictEqual(items.length, 1);
  assert.ok(items[0].textContent.includes('Valid Item'));

  cleanup();
  delete globalThis.window;
  delete globalThis.document;
});

test('enhanceSearch cleanup is idempotent and does not invoke focus restoration twice', () => {
  let html = `
    <!DOCTYPE html>
    <html>
      <body>
        <button id="trigger" data-search-trigger>Trigger</button>
        ${renderSearchDialog()}
      </body>
    </html>
  `;
  let { window, document } = parseHTML(html);
  globalThis.window = window;
  globalThis.document = document;

  let dialog = window.document.querySelector('[data-search-dialog]');
  let trigger = window.document.getElementById('trigger');

  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => {
    dialog.open = false;
    let closeEvent = new window.Event('close');
    dialog.dispatchEvent(closeEvent);
  };

  let focusCount = 0;
  trigger.focus = () => {
    focusCount++;
  };

  Object.defineProperty(document, 'activeElement', {
    value: trigger,
    writable: true,
    configurable: true
  });

  let cleanup = enhanceSearch(dialog, []);

  let clickEvent = new window.Event('click', { bubbles: true });
  trigger.dispatchEvent(clickEvent);

  cleanup();
  assert.strictEqual(focusCount, 1);

  cleanup();
  assert.strictEqual(focusCount, 1);

  delete globalThis.window;
  delete globalThis.document;
});

test('composed client integration matches behavior contracts', () => {
  let siteConfig = defineSiteConfig({
    brand: { title: 'Test Library', logo: '/logo.svg' },
    metadata: { description: 'A library test site', baseUrl: 'https://test.js' },
    themeStorageKey: 'my-custom-theme-key',
  });
  let routes = defineDocsRoutes([
    { path: '/intro', title: 'Introduction', section: 'Guide', description: 'Getting started doc', headers: ['Setup', 'Run'] },
    { path: '/api', title: 'API Reference', section: 'API', description: 'Function list' },
  ]);
  let html = renderDocsPage({
    siteConfig,
    routes,
    currentRoute: routes[0],
    contentHtml: '<h2 id="sec1">Section 1</h2><p>Content</p>',
  });

  let { window, document } = parseHTML(html);
  globalThis.window = window;
  globalThis.document = document;
  globalThis.CustomEvent = window.CustomEvent;

  let dialog = window.document.querySelector('[data-search-dialog]');
  let themeToggle = window.document.querySelector('[data-theme-toggle]');

  dialog.open = false;
  let showModalCount = 0;
  dialog.showModal = () => {
    dialog.open = true;
    showModalCount++;
  };
  dialog.close = () => {
    dialog.open = false;
    let closeEvent = new window.Event('close');
    dialog.dispatchEvent(closeEvent);
  };
  window.HTMLElement.prototype.scrollIntoView = () => {};

  globalThis.window.scrollY = 0;
  let storedTheme = null;
  globalThis.window.localStorage = {
    getItem: () => storedTheme,
    setItem: (k, v) => { storedTheme = v; }
  };

  let cleanup = enhanceLibraryPages();
  assert.ok(window.document.documentElement.classList.contains('js-active'));

  let clickThemeEvent = new window.Event('click', { bubbles: true });
  themeToggle.dispatchEvent(clickThemeEvent);
  assert.strictEqual(window.document.documentElement.getAttribute('data-theme'), 'dark');

  let triggerBtn = window.document.querySelector('[data-search-trigger]');
  let clickTriggerEvent = new window.Event('click', { bubbles: true });
  triggerBtn.dispatchEvent(clickTriggerEvent);
  assert.strictEqual(showModalCount, 1);

  cleanup();
  assert.ok(!window.document.documentElement.classList.contains('js-active'));

  showModalCount = 0;
  triggerBtn.dispatchEvent(clickTriggerEvent);
  assert.strictEqual(showModalCount, 0);

  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.CustomEvent;
});
