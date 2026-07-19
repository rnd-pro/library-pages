/**
 * Creates the public JSDA configuration for library pages.
 *
 * @param {Object} [options] Configuration overrides
 * @param {string} [options.sourceDir] Source directory (maps to static.sourceDir)
 * @param {string} [options.outputDir] Output directory (maps to static.outputDir)
 * @param {string[]} [options.entryPatterns] Custom entry patterns (maps to static.entryPatterns)
 * @param {Array<{from: string, to: string}>} [options.copy] Custom copy rules (maps to static.copy)
 * @param {string[]} [options.bundleExclude] Bundler exclude list (maps to bundle.exclude)
 * @param {string[]} [options.minifyExclude] Minifier exclude list (maps to minify.exclude)
 * @param {string[]} [options.importmapPackageList] Importmap package list (maps to importmap.packageList)
 * @returns {Object} Public JSDA configuration
 */
export function createPagesJsdaConfig(options = {}) {
  if (typeof options !== 'object' || options === null) {
    throw new Error('Options must be an object');
  }

  let sourceDir = options.sourceDir || './src/static';
  let outputDir = options.outputDir || './dist';
  let entryPatterns = options.entryPatterns || ['index.js', 'index.*.js', '**/index.js', '**/index.*.js'];
  let copy = options.copy || [];
  let bundleExclude = options.bundleExclude || [];
  let minifyExclude = options.minifyExclude || [];
  let importmapPackageList = options.importmapPackageList || [];

  return {
    static: {
      sourceDir,
      outputDir,
      entryPatterns,
      copy,
    },
    bundle: {
      js: true,
      css: true,
      exclude: bundleExclude,
    },
    minify: {
      js: true,
      css: true,
      html: true,
      svg: true,
      exclude: minifyExclude,
    },
    importmap: {
      packageList: importmapPackageList,
      srcSchema: 'https://cdn.jsdelivr.net/npm/{pkg-name}/+esm',
      polyfills: false,
      preload: true,
    },
  };
}
