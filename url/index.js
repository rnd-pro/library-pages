/**
 * @typedef {Object} PagesEnv
 * @property {string} basePath
 * @property {string} baseUrl
 */

/**
 * @typedef {Object} UrlHelpers
 * @property {function(string): string} resolvePath
 * @property {function(string): string} resolveUrl
 * @property {function(string): string} normalizePath
 */

/**
 * Reads and normalizes GitHub Pages/static environment variables.
 * Does not read global environment at module top level.
 *
 * @param {Object} [env] The environment object (defaults to process.env in Node)
 * @returns {PagesEnv}
 */
export function readPagesEnv(env = {}) {
  let basePath = env.PAGES_BASE_PATH || env.BASE_PATH || '';
  if (!basePath && env.GITHUB_REPOSITORY) {
    let parts = env.GITHUB_REPOSITORY.split('/');
    if (parts[1]) {
      basePath = '/' + parts[1];
    }
  }

  if (basePath) {
    let clean = basePath.replace(/^\/+|\/+$/g, '');
    if (clean === '') {
      basePath = '/';
    } else {
      basePath = '/' + clean + '/';
    }
  } else {
    basePath = '/';
  }

  let baseUrl = env.PAGES_BASE_URL || env.BASE_URL || '';
  if (!baseUrl && env.GITHUB_REPOSITORY) {
    let parts = env.GITHUB_REPOSITORY.split('/');
    if (parts[0] && parts[1]) {
      baseUrl = `https://${parts[0].toLowerCase()}.github.io/${parts[1]}`;
    }
  }

  if (baseUrl) {
    baseUrl = baseUrl.replace(/\/+$/, '');
  }

  return { basePath, baseUrl };
}

export function normalizePath(path) {
  if (typeof path !== 'string') {
    return '/';
  }
  if (path.startsWith('#') || path.startsWith('?')) {
    return path;
  }

  let pathname = path;
  let suffix = '';
  const firstSuffixChar = path.indexOf('?') !== -1 && path.indexOf('#') !== -1
    ? Math.min(path.indexOf('?'), path.indexOf('#'))
    : (path.indexOf('?') !== -1 ? path.indexOf('?') : path.indexOf('#'));

  if (firstSuffixChar !== -1) {
    pathname = path.slice(0, firstSuffixChar);
    suffix = path.slice(firstSuffixChar);
  }

  let p = '/' + pathname.replace(/^\/+|\/+$/g, '');
  if (p === '/') {
    return '/' + suffix;
  }
  let lastSegment = p.split('/').pop() || '';
  if (lastSegment.includes('.')) {
    return p + suffix;
  }
  return p + '/' + suffix;
}

/**
 * Creates URL helpers for a given basePath and baseUrl.
 *
 * @param {Object} options
 * @param {string} [options.basePath]
 * @param {string} [options.baseUrl]
 * @returns {UrlHelpers}
 */
export function createUrlHelpers({ basePath = '/', baseUrl = '' } = {}) {
  let cleanBasePath = basePath;
  if (cleanBasePath) {
    let clean = cleanBasePath.replace(/^\/+|\/+$/g, '');
    if (clean === '') {
      cleanBasePath = '/';
    } else {
      cleanBasePath = '/' + clean + '/';
    }
  } else {
    cleanBasePath = '/';
  }

  let cleanBaseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : '';

  /**
   * Resolves a path relative to the base path.
   *
   * @param {string} path
   * @returns {string}
   */
  function resolvePath(path) {
    if (typeof path !== 'string') {
      return cleanBasePath;
    }
    if (path.startsWith('#') || path.startsWith('?')) {
      return path;
    }
    if (path.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) {
      return path;
    }
    let normalized = normalizePath(path);
    if (cleanBasePath === '/') {
      return normalized;
    }
    if (normalized === cleanBasePath) {
      return normalized;
    }
    if (normalized.startsWith(cleanBasePath)) {
      return normalized;
    }
    return cleanBasePath + normalized.slice(1);
  }

  /**
   * Resolves a full canonical URL.
   *
   * @param {string} path
   * @returns {string}
   */
  function resolveUrl(path) {
    if (typeof path !== 'string') {
      return cleanBaseUrl;
    }
    if (path.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) {
      return path;
    }
    let resolvedPath = resolvePath(path);
    if (cleanBaseUrl) {
      let urlObj;
      try {
        urlObj = new URL(cleanBaseUrl);
      } catch (e) {
        let base = cleanBaseUrl.replace(/\/+$/, '');
        return base + resolvedPath;
      }
      let origin = urlObj.origin;
      let bp = cleanBasePath.replace(/^\/+|\/+$/g, '');
      let up = urlObj.pathname.replace(/^\/+|\/+$/g, '');

      let combinedPath;
      if (up && bp && (up === bp || up.endsWith('/' + bp) || up.endsWith(bp))) {
        let nonBase = resolvedPath;
        if (bp && resolvedPath.startsWith('/' + bp + '/')) {
          nonBase = resolvedPath.slice(bp.length + 1);
        } else if (bp && resolvedPath === '/' + bp + '/') {
          nonBase = '/';
        }

        let basePathname = urlObj.pathname;
        if (!basePathname.endsWith('/')) {
          basePathname += '/';
        }
        if (nonBase.startsWith('/')) {
          combinedPath = basePathname + nonBase.slice(1);
        } else {
          combinedPath = basePathname + nonBase;
        }
      } else {
        let basePathname = urlObj.pathname;
        if (!basePathname.endsWith('/')) {
          basePathname += '/';
        }
        if (resolvedPath.startsWith('/')) {
          combinedPath = basePathname + resolvedPath.slice(1);
        } else {
          combinedPath = basePathname + resolvedPath;
        }
      }

      combinedPath = '/' + combinedPath.replace(/^\/+/, '').replace(/\/+/g, '/');
      return origin + combinedPath;
    }
    return resolvedPath;
  }

  return {
    resolvePath,
    resolveUrl,
    normalizePath,
  };
}

/**
 * Validates unique normalized paths and normalizes routes.
 *
 * @param {Array<Object>} routes
 * @returns {Array<Object>}
 */
export function normalizeRoutes(routes) {
  if (!Array.isArray(routes)) {
    throw new TypeError('Routes must be an array');
  }
  let seen = new Set();
  return routes.map((route, index) => {
    if (!route || typeof route !== 'object') {
      throw new TypeError(`Route at index ${index} must be an object`);
    }
    if (typeof route.path !== 'string') {
      throw new TypeError(`Route path at index ${index} must be a string`);
    }
    let normalizedPath = normalizePath(route.path);
    if (seen.has(normalizedPath)) {
      throw new Error(`Duplicate route path found: "${normalizedPath}" (normalized from "${route.path}")`);
    }
    seen.add(normalizedPath);
    return {
      ...route,
      path: normalizedPath,
    };
  });
}
