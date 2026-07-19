import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { assertPagesOutput } from '../testing/index.js';

const EXECUTABLE_SCRIPT_TYPES = new Set([
  'module',
  'text/javascript',
  'application/javascript',
  'text/ecmascript',
  'application/ecmascript',
]);

function partitionInlineScripts(document) {
  let executable = [];
  let skipped = [];
  for (let script of document.querySelectorAll('script')) {
    if (script.getAttribute('src')) {
      continue;
    }
    let type = (script.getAttribute('type') || '').trim().toLowerCase();
    if (type === '' || EXECUTABLE_SCRIPT_TYPES.has(type)) {
      executable.push(script);
    } else {
      skipped.push(script);
    }
  }
  return { executable, skipped };
}

let __dirname = path.dirname(fileURLToPath(import.meta.url));
let fixtureDir = path.resolve(__dirname, 'fixture');
let distDir = path.resolve(fixtureDir, 'dist');

// Helper to clean up the dist directory
function cleanDist() {
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
}

test('Synthetic project build and verification E2E', async (t) => {
  // Clean up before test runs
  cleanDist();

  await t.test('build and assert at root base path (/)', async () => {
    let rootProjectCwd = path.resolve(fixtureDir, 'root');

    // Run jsda build inside the root project directory
    execSync('npx jsda build', {
      cwd: rootProjectCwd,
      env: {
        ...process.env,
        BASE_PATH: '/',
      },
      stdio: 'inherit',
    });

    let outputDir = path.resolve(distDir, 'root');

    // Assert using our testing helper
    await assertPagesOutput({
      outputDir,
      basePath: '/',
      baseUrl: 'https://rnd-pro.github.io',
      requiredFiles: [
        'index.html',
        'index.js',
        'assets/raw-copy.txt',
      ],
      parseHTML,
    });

    // Prove browser entry (index.js) is bundled and minified rather than raw copied
    let indexJsContent = fs.readFileSync(path.join(outputDir, 'index.js'), 'utf-8');
    assert.match(indexJsContent, /__fixtureEntryInit/);
    assert.match(indexJsContent, /browser entry init/);
    assert.match(indexJsContent, /helper value/);

    // It should not contain import statement since it is bundled
    assert.doesNotMatch(indexJsContent, /import\s+\{\s*helper\s*\}\s+from/);

    // It should be minified (i.e. very short, single line or no long comments/newlines)
    assert.doesNotMatch(indexJsContent, /\/\*\*[\s\S]*?\*\//); // No block comments
    assert.ok(indexJsContent.split('\n').length <= 2, 'Should be minified into 1 or 2 lines');
  });

  await t.test('build and assert at custom base path (/synthetic-project/)', async () => {
    let baseProjectCwd = path.resolve(fixtureDir, 'base');

    // Run jsda build inside the base project directory
    execSync('npx jsda build', {
      cwd: baseProjectCwd,
      env: {
        ...process.env,
        BASE_PATH: '/synthetic-project/',
      },
      stdio: 'inherit',
    });

    let outputDir = path.resolve(distDir, 'synthetic-project');

    // Assert using our testing helper
    await assertPagesOutput({
      outputDir,
      basePath: '/synthetic-project/',
      baseUrl: 'https://rnd-pro.github.io',
      requiredFiles: [
        'index.html',
        'index.js',
        'assets/raw-copy.txt',
      ],
      parseHTML,
    });

    // Check script src path and links are base-path prefixed
    let indexHtmlContent = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf-8');
    assert.match(indexHtmlContent, /src=['"]?\/synthetic-project\/index\.js['"]?/);
    assert.match(indexHtmlContent, /href=['"]?\/synthetic-project\/#test-target['"]?/);
    assert.match(indexHtmlContent, /href=['"]?https:\/\/rnd-pro\.github\.io\/synthetic-project\/['"]?/); // canonical

  });

  await t.test('native JSDA 1.6 build emits parseable executable inline scripts', async () => {
    for (let outputDir of [path.resolve(distDir, 'root'), path.resolve(distDir, 'synthetic-project')]) {
      let htmlContent = fs.readFileSync(path.join(outputDir, 'index.html'), 'utf-8');
      let { document } = parseHTML(htmlContent);
      let { executable, skipped } = partitionInlineScripts(document);

      assert.ok(
        executable.length > 0,
        `fixture page in ${outputDir} ships at least one executable inline script (theme boot)`
      );

      // application/json search-index payloads and other data-script types are data, not JavaScript
      let skippedJson = skipped.filter(
        script => (script.getAttribute('type') || '').trim().toLowerCase() === 'application/json'
      );
      assert.ok(skippedJson.length > 0, 'application/json data scripts are explicitly skipped');
      assert.ok(
        skipped.some(script => script.hasAttribute('data-search-index')),
        'the search-index data script is never treated as executable JavaScript'
      );

      for (let script of executable) {
        assert.doesNotThrow(
          () => new vm.Script(script.textContent),
          `executable inline script body in ${outputDir} must parse after native JSDA minification`
        );
      }
    }
  });

  // Clean up after test runs
  cleanDist();
});
