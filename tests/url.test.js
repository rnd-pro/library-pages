import { test } from 'node:test';
import assert from 'node:assert';
import {
  readPagesEnv,
  normalizePath,
  createUrlHelpers,
  normalizeRoutes,
} from '../url/index.js';

test('normalizePath - folder path should have starting and trailing slash', () => {
  assert.strictEqual(normalizePath('docs'), '/docs/');
  assert.strictEqual(normalizePath('/docs'), '/docs/');
  assert.strictEqual(normalizePath('docs/'), '/docs/');
  assert.strictEqual(normalizePath('/docs/'), '/docs/');
  assert.strictEqual(normalizePath(''), '/');
  assert.strictEqual(normalizePath('/'), '/');
});

test('normalizePath - file path should have starting slash and NO trailing slash', () => {
  assert.strictEqual(normalizePath('styles.css'), '/styles.css');
  assert.strictEqual(normalizePath('/styles.css'), '/styles.css');
  assert.strictEqual(normalizePath('assets/logo.png'), '/assets/logo.png');
  assert.strictEqual(normalizePath('/assets/logo.png'), '/assets/logo.png');
});

test('normalizePath - anchor and query paths should be preserved as-is', () => {
  assert.strictEqual(normalizePath('#anchor'), '#anchor');
  assert.strictEqual(normalizePath('?query=1'), '?query=1');
});

test('readPagesEnv - custom variables', () => {
  let env = {
    PAGES_BASE_PATH: 'my-custom-path',
    PAGES_BASE_URL: 'https://my-domain.com/subpath',
  };
  let result = readPagesEnv(env);
  assert.strictEqual(result.basePath, '/my-custom-path/');
  assert.strictEqual(result.baseUrl, 'https://my-domain.com/subpath');
});

test('readPagesEnv - fallback to GITHUB_REPOSITORY', () => {
  let env = {
    GITHUB_REPOSITORY: 'rnd-pro/library-pages',
  };
  let result = readPagesEnv(env);
  assert.strictEqual(result.basePath, '/library-pages/');
  assert.strictEqual(result.baseUrl, 'https://rnd-pro.github.io/library-pages');
});

test('readPagesEnv - empty fallback', () => {
  let result = readPagesEnv({});
  assert.strictEqual(result.basePath, '/');
  assert.strictEqual(result.baseUrl, '');
});

test('createUrlHelpers - resolvePath and resolveUrl without base settings', () => {
  let helpers = createUrlHelpers();
  assert.strictEqual(helpers.resolvePath('docs'), '/docs/');
  assert.strictEqual(helpers.resolvePath('/docs/'), '/docs/');
  assert.strictEqual(helpers.resolvePath('logo.png'), '/logo.png');
  assert.strictEqual(helpers.resolvePath('#anchor'), '#anchor');
  assert.strictEqual(helpers.resolvePath('https://external.com'), 'https://external.com');

  assert.strictEqual(helpers.resolveUrl('docs'), '/docs/');
});

test('createUrlHelpers - resolvePath with basePath', () => {
  let helpers = createUrlHelpers({ basePath: '/my-repo' });
  assert.strictEqual(helpers.resolvePath('docs'), '/my-repo/docs/');
  assert.strictEqual(helpers.resolvePath('/docs/'), '/my-repo/docs/');
  assert.strictEqual(helpers.resolvePath('logo.png'), '/my-repo/logo.png');
  assert.strictEqual(helpers.resolvePath(''), '/my-repo/');
  assert.strictEqual(helpers.resolvePath('/'), '/my-repo/');
});

test('createUrlHelpers - resolveUrl with basePath and baseUrl', () => {
  let helpers = createUrlHelpers({
    basePath: '/my-repo',
    baseUrl: 'https://owner.github.io/my-repo',
  });
  assert.strictEqual(helpers.resolveUrl('docs'), 'https://owner.github.io/my-repo/docs/');
  assert.strictEqual(helpers.resolveUrl('logo.png'), 'https://owner.github.io/my-repo/logo.png');
  assert.strictEqual(helpers.resolveUrl('https://external.com'), 'https://external.com');
});

test('createUrlHelpers - resolveUrl with baseUrl but no path suffix mismatch', () => {
  let helpers = createUrlHelpers({
    basePath: '/my-repo',
    baseUrl: 'https://owner.github.io',
  });
  assert.strictEqual(helpers.resolveUrl('docs'), 'https://owner.github.io/my-repo/docs/');
  assert.strictEqual(helpers.resolveUrl('logo.png'), 'https://owner.github.io/my-repo/logo.png');
});

test('createUrlHelpers - idempotency and scheme-safety checks', () => {
  let helpers = createUrlHelpers({ basePath: '/my-repo/', baseUrl: 'https://owner.github.io/my-repo' });
  // Pre-resolved path should not be duplicated
  assert.strictEqual(helpers.resolvePath('/my-repo/docs/'), '/my-repo/docs/');
  assert.strictEqual(helpers.resolveUrl('/my-repo/docs/'), 'https://owner.github.io/my-repo/docs/');

  // Scheme safety checks
  assert.strictEqual(helpers.resolvePath('//external-protocol.com/image.png'), '//external-protocol.com/image.png');
  assert.strictEqual(helpers.resolvePath('mailto:test@example.com'), 'mailto:test@example.com');
  assert.strictEqual(helpers.resolveUrl('//external-protocol.com/image.png'), '//external-protocol.com/image.png');
  assert.strictEqual(helpers.resolveUrl('mailto:test@example.com'), 'mailto:test@example.com');
});

test('normalizeRoutes - validates unique routes', () => {
  let routes = [
    { path: 'docs', title: 'Docs' },
    { path: '/api', title: 'API' },
  ];
  let normalized = normalizeRoutes(routes);
  assert.strictEqual(normalized[0].path, '/docs/');
  assert.strictEqual(normalized[1].path, '/api/');

  // Duplicate path check
  assert.throws(() => {
    normalizeRoutes([
      { path: 'docs', title: 'Docs 1' },
      { path: '/docs/', title: 'Docs 2' },
    ]);
  }, /Duplicate route path found/);
});
