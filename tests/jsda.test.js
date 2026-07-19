import { test } from 'node:test';
import assert from 'node:assert';
import { createPagesJsdaConfig } from '../jsda/index.js';

test('createPagesJsdaConfig defaults', () => {
  let cfg = createPagesJsdaConfig();
  assert.strictEqual(cfg.static.sourceDir, './src/static');
  assert.strictEqual(cfg.static.outputDir, './dist');
  assert.deepStrictEqual(cfg.static.entryPatterns, ['index.js', 'index.*.js', '**/index.js', '**/index.*.js']);
  assert.deepStrictEqual(cfg.static.copy, []);
  assert.strictEqual(cfg.bundle.js, true);
  assert.strictEqual(cfg.bundle.css, true);
  assert.deepStrictEqual(cfg.bundle.exclude, []);
  assert.strictEqual(cfg.minify.js, true);
  assert.strictEqual(cfg.minify.css, true);
  assert.strictEqual(cfg.minify.html, true);
  assert.strictEqual(cfg.minify.svg, true);
  assert.deepStrictEqual(cfg.minify.exclude, []);
  assert.deepStrictEqual(cfg.importmap.packageList, []);
});

test('createPagesJsdaConfig with options', () => {
  let cfg = createPagesJsdaConfig({
    sourceDir: './custom-src',
    outputDir: './custom-out',
    entryPatterns: ['app.js'],
    copy: [{ from: 'foo', to: 'bar' }],
    bundleExclude: ['react'],
    minifyExclude: ['jquery'],
    importmapPackageList: ['@symbiotejs/symbiote'],
  });

  assert.strictEqual(cfg.static.sourceDir, './custom-src');
  assert.strictEqual(cfg.static.outputDir, './custom-out');
  assert.deepStrictEqual(cfg.static.entryPatterns, ['app.js']);
  assert.deepStrictEqual(cfg.static.copy, [{ from: 'foo', to: 'bar' }]);
  assert.deepStrictEqual(cfg.bundle.exclude, ['react']);
  assert.deepStrictEqual(cfg.minify.exclude, ['jquery']);
  assert.deepStrictEqual(cfg.importmap.packageList, ['@symbiotejs/symbiote']);
});

test('createPagesJsdaConfig throws on invalid options', () => {
  assert.throws(() => createPagesJsdaConfig(null), /Options must be an object/);
  assert.throws(() => createPagesJsdaConfig('invalid'), /Options must be an object/);
});
