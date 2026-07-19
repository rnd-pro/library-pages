import test from 'node:test';
import assert from 'node:assert/strict';

test('Entrypoints - Node-safe and DOM-free', async () => {
  // Ensure DOM globals are not defined at the global scope
  assert.strictEqual(typeof globalThis.window, 'undefined');
  assert.strictEqual(typeof globalThis.document, 'undefined');

  // Dynamically import all Node-safe entrypoints to verify import isolation
  const root = await import('../index.js');
  const shell = await import('../shell/index.js');
  const url = await import('../url/index.js');
  const search = await import('../search/index.js');
  const jsda = await import('../jsda/index.js');
  const testing = await import('../testing/index.js');

  // Verify that root exposes the correct public contracts
  assert.ok(root.defineSiteConfig, 'root must export defineSiteConfig');
  assert.ok(root.defineDocsRoutes, 'root must export defineDocsRoutes');
  assert.ok(root.renderPage, 'root must export renderPage');
  assert.ok(root.renderDocsPage, 'root must export renderDocsPage');
  assert.ok(root.readPagesEnv, 'root must export readPagesEnv');
  assert.ok(root.createUrlHelpers, 'root must export createUrlHelpers');
  assert.ok(root.buildSearchIndex, 'root must export buildSearchIndex');
  assert.ok(root.renderSearchDialog, 'root must export renderSearchDialog');
  assert.ok(root.createPagesJsdaConfig, 'root must export createPagesJsdaConfig');
  assert.ok(root.createArtifactChecks, 'root must export createArtifactChecks');
  assert.ok(root.assertPagesOutput, 'root must export assertPagesOutput');

  // Verify that root does not re-export browser-only enhanceLibraryPages
  assert.strictEqual(root.enhanceLibraryPages, undefined, 'root must NOT export enhanceLibraryPages');

  // Verify subpath entries separately
  assert.ok(shell.defineSiteConfig, 'shell must export defineSiteConfig');
  assert.ok(url.createUrlHelpers, 'url must export createUrlHelpers');
  assert.ok(search.buildSearchIndex, 'search must export buildSearchIndex');
  assert.ok(jsda.createPagesJsdaConfig, 'jsda must export createPagesJsdaConfig');
  assert.ok(testing.assertPagesOutput, 'testing must export assertPagesOutput');
});
