import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

test('Package hygiene - dry run content validation', () => {
  // 1. Run npm pack --dry-run --json
  const rawJson = execSync('npm pack --dry-run --json', { cwd: rootDir, encoding: 'utf-8' });
  const packInfoList = JSON.parse(rawJson);
  const packInfo = packInfoList[0];

  assert.ok(packInfo, 'Should return a valid package dry-run payload');

  const files = packInfo.files;
  assert.ok(Array.isArray(files), 'files must be an array');

  // Assert exact file list in npm pack output
  const expectedFiles = [
    'CHANGELOG.md',
    'LICENSE',
    'README.md',
    'client/code-blocks.js',
    'client/index.js',
    'client/search.js',
    'client/shell.js',
    'index.js',
    'jsda/index.js',
    'llms.txt',
    'package.json',
    'search/index.js',
    'shell/boot.js',
    'shell/config.js',
    'shell/docs.js',
    'shell/escape.js',
    'shell/index.js',
    'shell/page.js',
    'shell/styles.css.js',
    'testing/index.js',
    'url/index.js'
  ];
  const actualFiles = files.map(f => f.path).sort();
  assert.deepStrictEqual(actualFiles, expectedFiles.sort(), 'Packed files list does not match expected exact list of 20 files');

  // Verify that only expected files are packaged
  for (const file of files) {
    const filePath = file.path;

    // Reject tests, fixtures, scratch, logs, session data from the pack
    assert.ok(!filePath.startsWith('tests/'), `Should not pack test file: ${filePath}`);
    assert.ok(!filePath.includes('fixture'), `Should not pack fixture file: ${filePath}`);
    assert.ok(!filePath.startsWith('tmp/'), `Should not pack temporary file: ${filePath}`);
    assert.ok(!filePath.endsWith('.log'), `Should not pack log file: ${filePath}`);
    assert.ok(!filePath.includes('.gemini'), `Should not pack session/app metadata: ${filePath}`);

    // Read file contents to inspect contents
    const fullPath = path.resolve(rootDir, filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // Reject absolute local home-directory paths
    assert.ok(!/\/(?:Users|home)\/[a-z0-9._-]+\//i.test(content), `File ${filePath} contains absolute local path`);

    // Reject private .cb-* or #cb- selectors (e.g., .cb- or #cb-) in code files (.js)
    if (filePath.endsWith('.js') && filePath !== 'testing/index.js') {
      assert.ok(!/\.cb-/.test(content), `File ${filePath} contains private selector prefix ".cb-"`);
      assert.ok(!/#cb-/.test(content), `File ${filePath} contains private selector prefix "#cb-"`);
    }

    // Reject debug output/console statements from all source files (no exclusions)
    if (filePath.endsWith('.js')) {
      assert.ok(!content.includes('console.log('), `File ${filePath} contains console.log statement`);
      assert.ok(!content.includes('console.debug('), `File ${filePath} contains console.debug statement`);
      assert.ok(!content.includes('console.warn('), `File ${filePath} contains console.warn statement`);
      assert.ok(!content.includes('console.error('), `File ${filePath} contains console.error statement`);
      assert.ok(!content.includes('console.info('), `File ${filePath} contains console.info statement`);
    }
  }
});
