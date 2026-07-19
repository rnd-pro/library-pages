import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { createArtifactChecks } from '../testing/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let checks = createArtifactChecks({ parseHTML });

test('checkNoBase validation', () => {
  let { document: validDoc } = parseHTML('<html><head></head><body></body></html>');
  assert.doesNotThrow(() => checks.checkNoBase(validDoc));

  let { document: invalidDoc } = parseHTML('<html><head><base href="/"></head><body></body></html>');
  assert.throws(() => checks.checkNoBase(invalidDoc), /Absence of <base> tag violation/);
});

test('checkCanonical validation', () => {
  let { document: validDoc } = parseHTML('<html><head><link rel="canonical" href="https://rnd-pro.github.io/"></head><body></body></html>');
  assert.doesNotThrow(() => checks.checkCanonical(validDoc, { expectedUrl: 'https://rnd-pro.github.io/' }));
  assert.throws(() => checks.checkCanonical(validDoc, { expectedUrl: 'https://rnd-pro.github.io/other' }), /Canonical URL mismatch/);

  let { document: missingDoc } = parseHTML('<html><head></head><body></body></html>');
  assert.throws(() => checks.checkCanonical(missingDoc, { expectedUrl: 'https://rnd-pro.github.io/' }), /Canonical URL violation/);
});

test('checkBasePathSafety validation', () => {
  let { document: validDoc } = parseHTML('<html><body><script src="/sub/index.js"></script><a href="/sub/page">Link</a></body></html>');
  assert.doesNotThrow(() => checks.checkBasePathSafety(validDoc, { basePath: '/sub/' }));

  let { document: invalidDoc } = parseHTML('<html><body><script src="/other/index.js"></script></body></html>');
  assert.throws(() => checks.checkBasePathSafety(invalidDoc, { basePath: '/sub/' }), /Base-path safety violation/);

  let { document: dblSlashDoc } = parseHTML('<html><body><script src="/sub//index.js"></script></body></html>');
  assert.throws(() => checks.checkBasePathSafety(dblSlashDoc, { basePath: '/sub/' }), /contains double slashes/);
});

test('checkForbiddenSelectors validation', () => {
  let { document: validDoc } = parseHTML('<html><body><div class="good"></div><style>.good { color: red; }</style></body></html>');
  assert.doesNotThrow(() => checks.checkForbiddenSelectors(validDoc));

  let { document: badClassDoc } = parseHTML('<html><body><div class="cb-code-block"></div></body></html>');
  assert.throws(() => checks.checkForbiddenSelectors(badClassDoc), /Forbidden selector violation/);

  let { document: badIdDoc } = parseHTML('<html><body><div id="cb-block"></div></body></html>');
  assert.throws(() => checks.checkForbiddenSelectors(badIdDoc), /Forbidden selector violation/);

  let { document: badAttrDoc } = parseHTML('<html><body><div cb-custom="true"></div></body></html>');
  assert.throws(() => checks.checkForbiddenSelectors(badAttrDoc), /Forbidden selector violation/);

  let { document: badStyleDoc } = parseHTML('<html><head><style>.cb-code-block {}</style></head><body></body></html>');
  assert.throws(() => checks.checkForbiddenSelectors(badStyleDoc), /Forbidden selector violation/);
});

test('checkSearchHooks validation', () => {
  let { document: validDoc } = parseHTML(`
    <html>
      <body>
        <button data-search-trigger>Search</button>
        <dialog data-search-dialog>
          <input type="search" data-search-input>
          <div data-search-count></div>
          <ul data-search-results></ul>
          <script data-search-index></script>
        </dialog>
      </body>
    </html>
  `);
  assert.doesNotThrow(() => checks.checkSearchHooks(validDoc));

  let { document: missingDialogDoc } = parseHTML(`
    <html>
      <body>
        <button data-search-trigger>Search</button>
      </body>
    </html>
  `);
  assert.throws(() => checks.checkSearchHooks(missingDialogDoc), /Search hooks violation: no search dialog found with \[data-search-dialog\]/);

  let { document: missingTriggerDoc } = parseHTML(`
    <html>
      <body>
        <dialog data-search-dialog>
          <input type="search" data-search-input>
          <div data-search-count></div>
          <ul data-search-results></ul>
          <script data-search-index></script>
        </dialog>
      </body>
    </html>
  `);
  assert.throws(() => checks.checkSearchHooks(missingTriggerDoc), /Search hooks violation: no search trigger found with \[data-search-trigger\]/);

  let { document: missingInputDoc } = parseHTML(`
    <html>
      <body>
        <button data-search-trigger>Search</button>
        <dialog data-search-dialog>
          <div data-search-count></div>
          <ul data-search-results></ul>
          <script data-search-index></script>
        </dialog>
      </body>
    </html>
  `);
  assert.throws(() => checks.checkSearchHooks(missingInputDoc), /Search hooks violation: no search input found with \[data-search-input\] inside dialog/);

  let { document: missingResultsDoc } = parseHTML(`
    <html>
      <body>
        <button data-search-trigger>Search</button>
        <dialog data-search-dialog>
          <input type="search" data-search-input>
          <div data-search-count></div>
          <script data-search-index></script>
        </dialog>
      </body>
    </html>
  `);
  assert.throws(() => checks.checkSearchHooks(missingResultsDoc), /Search hooks violation: no search results list found with \[data-search-results\]/);

  let { document: missingCountDoc } = parseHTML(`
    <html>
      <body>
        <button data-search-trigger>Search</button>
        <dialog data-search-dialog>
          <input type="search" data-search-input>
          <ul data-search-results></ul>
          <script data-search-index></script>
        </dialog>
      </body>
    </html>
  `);
  assert.throws(() => checks.checkSearchHooks(missingCountDoc), /Search hooks violation: no search results count found with \[data-search-count\]/);

  let { document: missingIndexDoc } = parseHTML(`
    <html>
      <body>
        <button data-search-trigger>Search</button>
        <dialog data-search-dialog>
          <input type="search" data-search-input>
          <div data-search-count></div>
          <ul data-search-results></ul>
        </dialog>
      </body>
    </html>
  `);
  assert.throws(() => checks.checkSearchHooks(missingIndexDoc), /Search hooks violation: no search index script found with \[data-search-index\]/);
});

test('checkFiniteReducedMotion validation', () => {
  let { document: validDoc } = parseHTML('<html><head><style>@media (prefers-reduced-motion: reduce) {}</style></head><body></body></html>');
  assert.doesNotThrow(() => checks.checkFiniteReducedMotion(validDoc));

  let { document: invalidDoc } = parseHTML('<html><head></head><body></body></html>');
  assert.throws(() => checks.checkFiniteReducedMotion(invalidDoc), /Finite\/reduced motion violation/);
});

test('checkLinkIntegrity page-local validation', () => {
  let { document: validDoc } = parseHTML('<html><body><a href="#target">Link</a><div id="target">Target</div></body></html>');
  assert.doesNotThrow(() => checks.checkLinkIntegrity(validDoc, { htmlFile: 'index.html' }));

  let { document: invalidDoc } = parseHTML('<html><body><a href="#missing">Link</a></body></html>');
  assert.throws(() => checks.checkLinkIntegrity(invalidDoc, { htmlFile: 'index.html' }), /Fragment integrity violation/);
});

test('checkLinkIntegrity with query suffixes and custom base paths', () => {
  let tempDir = path.resolve(__dirname, 'temp-link-test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);
  try {
    fs.writeFileSync(path.join(tempDir, 'page.html'), '<html><body><div id="section">Content</div></body></html>');
    fs.writeFileSync(path.join(tempDir, 'index.html'), '<html><body><div id="root-sec">Root</div></body></html>');

    let existingFiles = new Set(['index.html', 'page.html']);

    let { document: doc1 } = parseHTML('<html><body><a href="?search=123#root-sec">Link</a><div id="root-sec">Root</div></body></html>');
    assert.doesNotThrow(() => checks.checkLinkIntegrity(doc1, {
      htmlFile: path.join(tempDir, 'index.html'),
      outputDir: tempDir,
      existingFiles,
      basePath: '/'
    }));

    let { document: doc2 } = parseHTML('<html><body><a href="/page.html?ref=home#section">Link</a></body></html>');
    assert.doesNotThrow(() => checks.checkLinkIntegrity(doc2, {
      htmlFile: path.join(tempDir, 'index.html'),
      outputDir: tempDir,
      existingFiles,
      basePath: '/'
    }));

    let { document: doc3 } = parseHTML('<html><body><a href="/my-base/page.html?ref=home#section">Link</a></body></html>');
    assert.doesNotThrow(() => checks.checkLinkIntegrity(doc3, {
      htmlFile: path.join(tempDir, 'index.html'),
      outputDir: tempDir,
      existingFiles,
      basePath: '/my-base/'
    }));

    let { document: doc4 } = parseHTML('<html><body><a href="/my-base/page.html?ref=home#missing-section">Link</a></body></html>');
    assert.throws(() => checks.checkLinkIntegrity(doc4, {
      htmlFile: path.join(tempDir, 'index.html'),
      outputDir: tempDir,
      existingFiles,
      basePath: '/my-base/'
    }), /Fragment integrity violation/);
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('assertPagesOutput requires parseHTML and outputDir', async () => {
  const { assertPagesOutput } = await import('../testing/index.js');
  await assert.rejects(
    assertPagesOutput({ outputDir: '.' }),
    /parseHTML option is required/
  );
  await assert.rejects(
    assertPagesOutput({ parseHTML }),
    /outputDir option is required/
  );
});

test('assertPagesOutput rejects empty output directory', async () => {
  const { assertPagesOutput } = await import('../testing/index.js');
  const tempEmptyDir = path.resolve(__dirname, 'temp-empty-dir-test');
  if (!fs.existsSync(tempEmptyDir)) {
    fs.mkdirSync(tempEmptyDir);
  }
  try {
    await assert.rejects(
      assertPagesOutput({ outputDir: tempEmptyDir, parseHTML }),
      /No HTML files found in outputDir/
    );
  } finally {
    if (fs.existsSync(tempEmptyDir)) {
      fs.rmSync(tempEmptyDir, { recursive: true, force: true });
    }
  }
});

test('assertPagesOutput detects path containment violations', async () => {
  const { assertPagesOutput } = await import('../testing/index.js');
  const tempDir = path.resolve(__dirname, 'temp-containment-test');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);
  try {
    fs.writeFileSync(path.join(tempDir, 'index.html'), '<html><body><a href="/target"></a></body></html>');

    await assert.rejects(
      assertPagesOutput({
        outputDir: tempDir,
        requiredFiles: ['../outside.txt'],
        parseHTML
      }),
      /Path containment violation/
    );
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('assertPagesOutput canonical URL verification with root, custom base, and already-prefixed paths', async () => {
  const { assertPagesOutput } = await import('../testing/index.js');
  const tempDir = path.resolve(__dirname, 'temp-canonical-prefix-test');

  const setupTempHtml = (canonicalUrl) => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir);
    // Write valid HTML with search elements so checkSearchHooks passes
    fs.writeFileSync(
      path.join(tempDir, 'index.html'),
      `<html>
        <head>
          <link rel="canonical" href="${canonicalUrl}">
          <style>@media (prefers-reduced-motion: reduce) {}</style>
        </head>
        <body>
          <button data-search-trigger>Search</button>
          <dialog data-search-dialog>
            <input type="search" data-search-input>
            <div data-search-count></div>
            <ul data-search-results></ul>
            <script data-search-index>[]</script>
          </dialog>
        </body>
      </html>`
    );
  };

  try {
    // 1. Root base path (basePath: '/', baseUrl: 'https://rnd-pro.github.io')
    setupTempHtml('https://rnd-pro.github.io/');
    await assert.doesNotReject(async () => {
      await assertPagesOutput({
        outputDir: tempDir,
        basePath: '/',
        baseUrl: 'https://rnd-pro.github.io',
        parseHTML
      });
    });

    // 2. Custom base path (basePath: '/custom-base/', baseUrl: 'https://rnd-pro.github.io')
    setupTempHtml('https://rnd-pro.github.io/custom-base/');
    await assert.doesNotReject(async () => {
      await assertPagesOutput({
        outputDir: tempDir,
        basePath: '/custom-base/',
        baseUrl: 'https://rnd-pro.github.io',
        parseHTML
      });
    });

    // 3. Already prefixed base URL (basePath: '/custom-base/', baseUrl: 'https://rnd-pro.github.io/custom-base')
    // We expect it NOT to double prefix (i.e. not result in 'https://rnd-pro.github.io/custom-base/custom-base/')
    // Instead it resolves to 'https://rnd-pro.github.io/custom-base/'
    setupTempHtml('https://rnd-pro.github.io/custom-base/');
    await assert.doesNotReject(async () => {
      await assertPagesOutput({
        outputDir: tempDir,
        basePath: '/custom-base/',
        baseUrl: 'https://rnd-pro.github.io/custom-base',
        parseHTML
      });
    });

  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('assertPagesOutput rejects symlinks pointing outside outputDir and safely skips inside ones', async () => {
  const { assertPagesOutput } = await import('../testing/index.js');
  const tempDir = path.resolve(__dirname, 'temp-symlink-test');

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);

  const outsideDir = path.resolve(__dirname, 'temp-symlink-outside');
  if (fs.existsSync(outsideDir)) {
    fs.rmSync(outsideDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outsideDir);

  try {
    // Write valid HTML file in tempDir
    fs.writeFileSync(
      path.join(tempDir, 'index.html'),
      `<html>
        <head>
          <link rel="canonical" href="https://rnd-pro.github.io/">
          <style>@media (prefers-reduced-motion: reduce) {}</style>
        </head>
        <body>
          <button data-search-trigger>Search</button>
          <dialog data-search-dialog>
            <input type="search" data-search-input>
            <div data-search-count></div>
            <ul data-search-results></ul>
            <script data-search-index>[]</script>
          </dialog>
        </body>
      </html>`
    );

    // Create a symlink pointing outside tempDir
    let outsideTarget = path.join(outsideDir, 'external.html');
    fs.writeFileSync(outsideTarget, '<html></html>');

    let symlinkPath = path.join(tempDir, 'bad-link.html');
    fs.symlinkSync(outsideTarget, symlinkPath);

    // Assert that scanning rejects it with containment violation
    await assert.rejects(
      assertPagesOutput({
        outputDir: tempDir,
        parseHTML
      }),
      /Path containment violation/
    );

    // Remove the bad symlink
    fs.unlinkSync(symlinkPath);

    // Create a symlink pointing inside tempDir
    let insideTarget = path.join(tempDir, 'index.html');
    let insideLink = path.join(tempDir, 'good-link.html');
    fs.symlinkSync(insideTarget, insideLink);

    // Assert that scanning does not reject (safely skips it)
    await assert.doesNotReject(async () => {
      await assertPagesOutput({
        outputDir: tempDir,
        parseHTML
      });
    });

  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    if (fs.existsSync(outsideDir)) {
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  }
});
