import fs from 'node:fs';
import path from 'node:path';
import { createUrlHelpers } from '../url/index.js';


function checkContainment(parent, child, label) {
  let resolvedParent = path.resolve(parent);
  let resolvedChild = path.resolve(child);
  let relative = path.relative(resolvedParent, resolvedChild);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path containment violation: ${label} "${child}" traverses outside outputDir "${parent}"`);
  }
}

/**
 * Creates HTML artifact assertion checks.
 *
 * @param {Object} params Parameters
 * @param {Function} params.parseHTML Parser function mapping HTML string to DOM
 * @returns {Object} Assertion check methods
 */
export function createArtifactChecks({ parseHTML } = {}) {
  if (typeof parseHTML !== 'function') {
    throw new Error('parseHTML must be a function');
  }

  return {
    /**
     * @param {Document} document
     */
    checkNoBase(document) {
      let bases = document.querySelectorAll('base');
      if (bases.length > 0) {
        throw new Error('Absence of <base> tag violation: found <base> tag');
      }
    },

    /**
     * @param {Document} document
     * @param {Object} opts
     * @param {string} opts.expectedUrl
     */
    checkCanonical(document, { expectedUrl }) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        throw new Error('Canonical URL violation: no <link rel="canonical"> element found');
      }
      let canonicalHref = canonical.getAttribute('href');
      if (!canonicalHref) {
        throw new Error('Canonical URL violation: href attribute is missing or empty');
      }
      if (expectedUrl && canonicalHref !== expectedUrl) {
        throw new Error(`Canonical URL mismatch: expected "${expectedUrl}", got "${canonicalHref}"`);
      }
    },

    /**
     * @param {Document} document
     * @param {Object} opts
     * @param {string} opts.basePath
     */
    checkBasePathSafety(document, { basePath }) {
      let resourceElements = document.querySelectorAll('[src], link[href], a[href], form[action]');
      for (let el of resourceElements) {
        let tag = el.tagName.toLowerCase();
        let attr = tag === 'link' || tag === 'a' ? 'href' : (tag === 'form' ? 'action' : 'src');
        let url = el.getAttribute(attr);
        if (!url) continue;

        if (
          url.startsWith('http://') ||
          url.startsWith('https://') ||
          url.startsWith('//') ||
          url.startsWith('mailto:') ||
          url.startsWith('tel:') ||
          url.startsWith('#') ||
          url.startsWith('data:')
        ) {
          continue;
        }

        if (url.startsWith('/')) {
          if (!url.startsWith(basePath)) {
            throw new Error(`Base-path safety violation: URL "${url}" in <${tag} ${attr}="..."> does not start with basePath "${basePath}"`);
          }
          if (url.includes('//') || url.includes('\\\\')) {
            throw new Error(`Base-path safety violation: URL "${url}" contains double slashes`);
          }
        }
      }
    },

    /**
     * @param {Document} document
     * @param {Object} opts
     * @param {string} [opts.htmlFile]
     * @param {string} [opts.outputDir]
     * @param {string} [opts.basePath]
     */
    checkForbiddenSelectors(document, { htmlFile, outputDir, basePath = '/' } = {}) {
      let allElements = document.querySelectorAll('*');
      for (let el of allElements) {
        let tag = el.tagName.toLowerCase();
        for (let cls of el.classList) {
          if (cls.startsWith('cb-') || cls.includes(' .cb-') || cls.includes(' cb-')) {
            throw new Error(`Forbidden selector violation: element <${tag}> has forbidden class "${cls}"`);
          }
        }
        let id = el.getAttribute('id');
        if (id && (id.startsWith('cb-') || id === 'cb')) {
          throw new Error(`Forbidden selector violation: element <${tag}> has forbidden ID "${id}"`);
        }
        for (let attr of el.attributes) {
          if (attr.name.startsWith('cb-')) {
            throw new Error(`Forbidden selector violation: element <${tag}> has forbidden attribute "${attr.name}"`);
          }
        }
      }

      let styleTags = document.querySelectorAll('style');
      for (let style of styleTags) {
        if (/\.cb-/.test(style.textContent) || /#cb-/.test(style.textContent)) {
          throw new Error('Forbidden selector violation: style tag contains forbidden selector prefix ".cb-" or "#cb-"');
        }
      }

      if (htmlFile && outputDir) {
        let links = document.querySelectorAll('link[rel="stylesheet"]');
        for (let link of links) {
          let href = link.getAttribute('href');
          if (!href) continue;

          let cssRelPath = '';
          if (href.startsWith('/')) {
            if (href.startsWith(basePath)) {
              cssRelPath = href.slice(basePath.length);
            } else {
              cssRelPath = href.slice(1);
            }
          } else {
            let currentDir = path.dirname(htmlFile);
            let resolvedCss = path.resolve(currentDir, href);
            cssRelPath = path.relative(outputDir, resolvedCss);
          }

          let cssFullPath = path.resolve(outputDir, cssRelPath);
          checkContainment(outputDir, cssFullPath, 'stylesheet path');
          if (fs.existsSync(cssFullPath)) {
            let cssContent = fs.readFileSync(cssFullPath, 'utf-8');
            if (/\.cb-/.test(cssContent) || /#cb-/.test(cssContent)) {
              throw new Error(`Forbidden selector violation: stylesheet "${cssRelPath}" contains forbidden selector prefix ".cb-" or "#cb-"`);
            }
          }
        }
      }
    },

    /**
     * @param {Document} document
     */
    checkSearchHooks(document) {
      let dialog = document.querySelector('[data-search-dialog]');
      if (!dialog) {
        throw new Error('Search hooks violation: no search dialog found with [data-search-dialog]');
      }

      let trigger = document.querySelector('[data-search-trigger]');
      if (!trigger) {
        throw new Error('Search hooks violation: no search trigger found with [data-search-trigger]');
      }

      let input = dialog.querySelector('[data-search-input]');
      if (!input) {
        throw new Error('Search hooks violation: no search input found with [data-search-input] inside dialog');
      }

      let results = dialog.querySelector('[data-search-results]');
      if (!results) {
        throw new Error('Search hooks violation: no search results list found with [data-search-results] inside dialog');
      }

      let count = dialog.querySelector('[data-search-count]');
      if (!count) {
        throw new Error('Search hooks violation: no search results count found with [data-search-count] inside dialog');
      }

      let index = dialog.querySelector('[data-search-index]');
      if (!index) {
        throw new Error('Search hooks violation: no search index script found with [data-search-index] inside dialog');
      }
    },

    /**
     * @param {Document} document
     * @param {Object} [opts]
     * @param {string} [opts.htmlFile]
     * @param {string} [opts.outputDir]
     * @param {string} [opts.basePath]
     */
    checkFiniteReducedMotion(document, { htmlFile, outputDir, basePath = '/' } = {}) {
      let styleTags = document.querySelectorAll('style');
      let foundInStyle = false;
      for (let style of styleTags) {
        if (style.textContent.includes('prefers-reduced-motion')) {
          foundInStyle = true;
          break;
        }
      }
      if (foundInStyle) return;

      let elementsWithStyle = document.querySelectorAll('[style]');
      for (let el of elementsWithStyle) {
        if (el.getAttribute('style').includes('prefers-reduced-motion')) {
          return;
        }
      }

      if (htmlFile && outputDir) {
        let links = document.querySelectorAll('link[rel="stylesheet"]');
        for (let link of links) {
          let href = link.getAttribute('href');
          if (!href) continue;

          let cssRelPath = '';
          if (href.startsWith('/')) {
            if (href.startsWith(basePath)) {
              cssRelPath = href.slice(basePath.length);
            } else {
              cssRelPath = href.slice(1);
            }
          } else {
            let currentDir = path.dirname(htmlFile);
            let resolvedCss = path.resolve(currentDir, href);
            cssRelPath = path.relative(outputDir, resolvedCss);
          }

          let cssFullPath = path.resolve(outputDir, cssRelPath);
          checkContainment(outputDir, cssFullPath, 'stylesheet path');
          if (fs.existsSync(cssFullPath)) {
            let cssContent = fs.readFileSync(cssFullPath, 'utf-8');
            if (cssContent.includes('prefers-reduced-motion')) {
              return;
            }
          }
        }
      }

      let fileMsg = htmlFile ? ` in ${path.basename(htmlFile)}` : '';
      throw new Error(`Finite/reduced motion violation: no prefers-reduced-motion media query found in styles${fileMsg}`);
    },

    /**
     * @param {Document} document
     * @param {Object} opts
     * @param {string} opts.htmlFile
     * @param {string} [opts.outputDir]
     * @param {Set<string>} [opts.existingFiles]
     * @param {string} [opts.basePath]
     */
    checkLinkIntegrity(document, { htmlFile, outputDir, existingFiles, basePath }) {
      let anchors = document.querySelectorAll('a[href]');
      for (let anchor of anchors) {
        let href = anchor.getAttribute('href');
        if (!href) continue;

        if (
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.startsWith('//') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('data:')
        ) {
          continue;
        }

        let [urlWithQuery, fragment] = href.split('#');
        let [urlPath] = urlWithQuery.split('?');

        if (!urlPath) {
          if (fragment) {
            let targetEl = document.getElementById(fragment) || document.querySelector(`a[name="${fragment}"]`);
            if (!targetEl) {
              throw new Error(`Fragment integrity violation in ${path.basename(htmlFile)}: anchor link "${href}" points to non-existent ID/name "${fragment}"`);
            }
          }
          continue;
        }

        if (!outputDir || !existingFiles) {
          continue;
        }

        let targetRelPath = '';
        if (urlPath.startsWith('/')) {
          if (!urlPath.startsWith(basePath)) {
            throw new Error(`Base-path safety violation: link "${href}" does not start with basePath "${basePath}"`);
          }
          targetRelPath = urlPath.slice(basePath.length);
        } else {
          let currentFileDir = path.dirname(htmlFile);
          let resolvedAbs = path.resolve(currentFileDir, urlPath);
          targetRelPath = path.relative(outputDir, resolvedAbs).split(path.sep).join('/');
        }

        if (targetRelPath === '' || targetRelPath.endsWith('/')) {
          targetRelPath += 'index.html';
        } else if (!targetRelPath.split('/').pop().includes('.')) {
          targetRelPath += '/index.html';
        }

        targetRelPath = path.normalize(targetRelPath).split(path.sep).join('/');
        if (targetRelPath.startsWith('./')) {
          targetRelPath = targetRelPath.slice(2);
        }

        let targetFull = path.resolve(outputDir, targetRelPath);
        checkContainment(outputDir, targetFull, 'link target path');

        if (!existingFiles.has(targetRelPath)) {
          throw new Error(`Link integrity violation in ${path.basename(htmlFile)}: link "${href}" resolves to non-existent file "${targetRelPath}"`);
        }

        if (fragment && targetRelPath.endsWith('.html')) {
          let targetHtml = fs.readFileSync(targetFull, 'utf-8');
          let { document: targetDoc } = parseHTML(targetHtml);
          let targetEl = targetDoc.getElementById(fragment) || targetDoc.querySelector(`a[name="${fragment}"]`);
          if (!targetEl) {
            throw new Error(`Fragment integrity violation in ${path.basename(htmlFile)}: link "${href}" points to non-existent ID/name "${fragment}" in "${targetRelPath}"`);
          }
        }
      }
    },
  };
}

/**
 * Scans output directory and asserts all HTML artifacts conform to rules.
 *
 * @param {Object} options Options
 * @param {string} options.outputDir Path to the build output directory
 * @param {string} [options.basePath] Base path (e.g. '/' or '/synthetic-project/')
 * @param {string} [options.baseUrl] Base URL (e.g. 'https://rnd-pro.github.io')
 * @param {string[]} [options.requiredFiles] List of relative files that must exist in outputDir
 * @param {Function} [options.parseHTML] HTML parser function
 */
export async function assertPagesOutput(options = {}) {
  let outputDir = options.outputDir;
  if (!outputDir) {
    throw new Error('outputDir option is required');
  }

  let basePath = options.basePath || '/';
  if (!basePath.startsWith('/') || !basePath.endsWith('/')) {
    throw new Error('basePath must start and end with a slash');
  }

  let baseUrl = options.baseUrl || 'https://rnd-pro.github.io';
  let requiredFiles = options.requiredFiles || [];
  let parser = options.parseHTML;
  if (typeof parser !== 'function') {
    throw new Error('parseHTML option is required for assertPagesOutput');
  }

  for (let file of requiredFiles) {
    let filePath = path.resolve(outputDir, file);
    checkContainment(outputDir, filePath, 'required file');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required output file missing: ${file} at ${filePath}`);
    }
  }

  let htmlFiles = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    checkContainment(outputDir, dir, 'directory scan');
    let list = fs.readdirSync(dir);
    for (let file of list) {
      let fullPath = path.join(dir, file);
      let lstat = fs.lstatSync(fullPath);
      if (lstat.isSymbolicLink()) {
        let target = fs.realpathSync(fullPath);
        checkContainment(outputDir, target, 'symlink target');
        continue;
      }
      let stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('.html')) {
        checkContainment(outputDir, fullPath, 'HTML file scan');
        htmlFiles.push(fullPath);
      }
    }
  }
  scan(outputDir);

  if (htmlFiles.length === 0) {
    throw new Error(`No HTML files found in outputDir: ${outputDir}`);
  }

  let existingFiles = new Set();
  function collectAllFiles(dir) {
    if (!fs.existsSync(dir)) return;
    let list = fs.readdirSync(dir);
    for (let file of list) {
      let fullPath = path.join(dir, file);
      let lstat = fs.lstatSync(fullPath);
      if (lstat.isSymbolicLink()) {
        let target = fs.realpathSync(fullPath);
        checkContainment(outputDir, target, 'symlink target');
        continue;
      }
      if (fs.statSync(fullPath).isDirectory()) {
        collectAllFiles(fullPath);
      } else {
        let rel = path.relative(outputDir, fullPath).split(path.sep).join('/');
        existingFiles.add(rel);
      }
    }
  }
  collectAllFiles(outputDir);

  let checks = createArtifactChecks({ parseHTML: parser });

  for (let htmlFile of htmlFiles) {
    let htmlContent = fs.readFileSync(htmlFile, 'utf-8');
    let { document } = parser(htmlContent);

    let checkOpts = { htmlFile, outputDir, basePath };

    checks.checkNoBase(document);

    let relPath = path.relative(outputDir, htmlFile).split(path.sep).join('/');
    let urlPath = relPath;
    if (urlPath.endsWith('index.html')) {
      urlPath = urlPath.slice(0, -'index.html'.length);
    }
    let { resolveUrl } = createUrlHelpers({ basePath, baseUrl });
    let expectedUrl = resolveUrl(urlPath);

    checks.checkCanonical(document, { expectedUrl });
    checks.checkBasePathSafety(document, { basePath });
    checks.checkSearchHooks(document);
    checks.checkFiniteReducedMotion(document, checkOpts);
    checks.checkForbiddenSelectors(document, checkOpts);
    checks.checkLinkIntegrity(document, {
      htmlFile,
      outputDir,
      existingFiles,
      basePath,
    });
  }
}
