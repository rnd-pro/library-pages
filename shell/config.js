import { normalizePath } from '../url/index.js';

/**
 * Deep freezes an object or array.
 * @param {any} obj
 * @returns {any}
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (let key of Object.getOwnPropertyNames(obj)) {
    let value = obj[key];
    if (value !== null && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

/**
 * @typedef {Object} BrandConfig
 * @property {string} title
 * @property {string} [logo]
 */

/**
 * @typedef {Object} MetadataConfig
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [baseUrl]
 * @property {string} [icon]
 */

/**
 * @typedef {Object} NavigationItem
 * @property {string} label
 * @property {string} path
 */

/**
 * @typedef {Object} FooterConfig
 * @property {string} [copyright]
 * @property {NavigationItem[]} [links]
 */

/**
 * @typedef {Object} SiteConfig
 * @property {BrandConfig} brand
 * @property {MetadataConfig} [metadata]
 * @property {NavigationItem[]} [navigation]
 * @property {FooterConfig} [footer]
 * @property {string} [clientEntryPath]
 * @property {string} [themeStorageKey]
 * @property {string} [basePath]
 * @property {string} [language]
 * @property {string} [searchPlaceholder]
 * @property {boolean} [symbioteTokenBridge]
 * @property {Object<string, string>} [tokenOverrides]
 * @property {string} [pageStyles]
 */


/**
 * Validates a trusted build-time CSS page-style string.
 * @param {string} pageStyles
 * @returns {string}
 */
export function assertValidPageStyles(pageStyles) {
  if (typeof pageStyles !== 'string') {
    throw new Error('pageStyles must be a string of trusted build-time CSS.');
  }
  if (/<\/style/i.test(pageStyles)) {
    throw new Error('pageStyles must not contain a closing "</style" sequence; inline page styles cannot close their own style element.');
  }
  return pageStyles;
}

/**
 * Validates and freezes trusted build-time site configuration.
 * @param {SiteConfig} config
 * @returns {SiteConfig}
 */
export function defineSiteConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Site configuration must be a non-null object.');
  }

  // Validate brand
  if (!config.brand || typeof config.brand !== 'object') {
    throw new Error('Site configuration must contain a "brand" object.');
  }
  if (typeof config.brand.title !== 'string' || !config.brand.title.trim()) {
    throw new Error('Brand title must be a non-empty string.');
  }
  if (config.brand.logo !== undefined) {
    if (typeof config.brand.logo !== 'string' || !config.brand.logo.trim()) {
      throw new Error('Brand logo must be a non-empty string.');
    }
  }

  // Validate metadata
  if (config.metadata !== undefined) {
    if (!config.metadata || typeof config.metadata !== 'object') {
      throw new Error('Metadata must be a valid object.');
    }
    if (config.metadata.title !== undefined && typeof config.metadata.title !== 'string') {
      throw new Error('Metadata title must be a string.');
    }
    if (config.metadata.description !== undefined && typeof config.metadata.description !== 'string') {
      throw new Error('Metadata description must be a string.');
    }
    if (config.metadata.baseUrl !== undefined && typeof config.metadata.baseUrl !== 'string') {
      throw new Error('Metadata baseUrl must be a string.');
    }
    if (config.metadata.icon !== undefined) {
      if (typeof config.metadata.icon !== 'string' || !config.metadata.icon.trim()) {
        throw new Error('Metadata icon must be a non-empty string.');
      }
    }
  }

  // Validate navigation
  if (config.navigation !== undefined) {
    if (!Array.isArray(config.navigation)) {
      throw new Error('Navigation must be an array of navigation items.');
    }
    config.navigation.forEach((item, index) => {
      if (!item || typeof item !== 'object' || typeof item.label !== 'string' || !item.label.trim() || typeof item.path !== 'string' || !item.path.trim()) {
        throw new Error(`Navigation item at index ${index} must have "label" (string) and "path" (string).`);
      }
    });
  }

  // Validate footer
  if (config.footer !== undefined) {
    if (!config.footer || typeof config.footer !== 'object') {
      throw new Error('Footer must be a valid object.');
    }
    if (config.footer.copyright !== undefined && typeof config.footer.copyright !== 'string') {
      throw new Error('Footer copyright must be a string.');
    }
    if (config.footer.links !== undefined) {
      if (!Array.isArray(config.footer.links)) {
        throw new Error('Footer links must be an array of navigation items.');
      }
      config.footer.links.forEach((item, index) => {
        if (!item || typeof item !== 'object' || typeof item.label !== 'string' || !item.label.trim() || typeof item.path !== 'string' || !item.path.trim()) {
          throw new Error(`Footer link at index ${index} must have "label" (string) and "path" (string).`);
        }
      });
    }
  }

  // Validate other config fields
  if (config.clientEntryPath !== undefined && typeof config.clientEntryPath !== 'string') {
    throw new Error('clientEntryPath must be a string.');
  }
  if (config.themeStorageKey !== undefined) {
    if (typeof config.themeStorageKey !== 'string' || !/^[a-zA-Z0-9\-_]+$/.test(config.themeStorageKey)) {
      throw new Error('themeStorageKey must be a valid alphanumeric/hyphen/underscore string.');
    }
  }
  if (config.basePath !== undefined) {
    if (typeof config.basePath !== 'string') {
      throw new Error('basePath must be a string.');
    }
    if (!config.basePath.startsWith('/')) {
      throw new Error('basePath must start with a slash.');
    }
    if (/[?#]/.test(config.basePath)) {
      throw new Error('basePath must not contain query parameters or hash anchors.');
    }
  }
  if (config.language !== undefined) {
    if (typeof config.language !== 'string' || !config.language.trim()) {
      throw new Error('language must be a non-empty string.');
    }
  }
  if (config.searchPlaceholder !== undefined) {
    if (typeof config.searchPlaceholder !== 'string' || !config.searchPlaceholder.trim()) {
      throw new Error('searchPlaceholder must be a non-empty string.');
    }
  }
  if (config.symbioteTokenBridge !== undefined) {
    if (typeof config.symbioteTokenBridge !== 'boolean') {
      throw new Error('symbioteTokenBridge must be a boolean.');
    }
  }
  if (config.tokenOverrides !== undefined) {
    if (typeof config.tokenOverrides !== 'object' || config.tokenOverrides === null) {
      throw new Error('tokenOverrides must be a valid object mapping string keys to string values.');
    }
    for (let [key, val] of Object.entries(config.tokenOverrides)) {
      if (typeof key !== 'string' || !/^--lp-[a-zA-Z0-9\-_]+$/.test(key)) {
        throw new Error(`Invalid token override key: "${key}"`);
      }
      if (typeof val !== 'string' || /[;{}<>]/.test(val)) {
        throw new Error(`Invalid token override value: "${val}"`);
      }
    }
  }

  if (config.pageStyles !== undefined) {
    assertValidPageStyles(config.pageStyles);
  }

  // Clone to avoid side effects and freeze deeply
  let cloned = JSON.parse(JSON.stringify(config));
  if (config.symbioteTokenBridge !== undefined) {
    cloned.symbioteTokenBridge = config.symbioteTokenBridge;
  }

  // Set default theme key if not provided
  if (!cloned.themeStorageKey) {
    cloned.themeStorageKey = 'lp-theme';
  }

  // Set default basePath and language if not provided
  if (!cloned.basePath) {
    cloned.basePath = '/';
  } else {
    let clean = cloned.basePath.replace(/^\/+|\/+$/g, '');
    if (clean === '') {
      cloned.basePath = '/';
    } else {
      cloned.basePath = '/' + clean + '/';
    }
  }
  if (!cloned.language) {
    cloned.language = 'en';
  }


  return deepFreeze(cloned);
}

/**
 * @typedef {Object} DocsRoute
 * @property {string} path
 * @property {string} title
 * @property {string} [section]
 * @property {string} [label]
 * @property {string} [description]
 * @property {string[]} [headers]
 */

/**
 * @typedef {Object} DocsRoutesOptions
 * @property {string} [defaultSection]
 */

/**
 * Validates and freezes unique normalized paths and section metadata.
 * @param {DocsRoute[]} routes
 * @param {DocsRoutesOptions} [options]
 * @returns {DocsRoute[]}
 */
export function defineDocsRoutes(routes, options = {}) {
  if (!Array.isArray(routes)) {
    throw new Error('Documentation routes must be an array.');
  }

  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('Options must be a valid object.');
  }
  let defaultSection = options.defaultSection;
  if (defaultSection !== undefined) {
    if (typeof defaultSection !== 'string' || !defaultSection.trim()) {
      throw new Error('defaultSection must be a non-empty string.');
    }
    defaultSection = defaultSection.trim();
  }

  let paths = new Set();
  let validatedRoutes = routes.map((route, index) => {
    if (!route || typeof route !== 'object') {
      throw new Error(`Route at index ${index} must be an object.`);
    }
    if (typeof route.path !== 'string' || !route.path.trim()) {
      throw new Error(`Route at index ${index} must contain a non-empty string path.`);
    }
    if (typeof route.title !== 'string' || !route.title.trim()) {
      throw new Error(`Route at index ${index} must contain a non-empty string title.`);
    }

    let normalizedPath = normalizePath(route.path.trim());

    if (paths.has(normalizedPath)) {
      throw new Error(`Duplicate documentation path found: "${normalizedPath}"`);
    }
    paths.add(normalizedPath);

    let validatedRoute = {
      ...route,
      path: normalizedPath,
      title: route.title.trim(),
    };

    let section = route.section;
    if (section === undefined && defaultSection !== undefined) {
      section = defaultSection;
    }

    if (section !== undefined) {
      if (typeof section !== 'string') {
        throw new Error(`Route section at index ${index} must be a string.`);
      }
      validatedRoute.section = section.trim();
    }

    if (route.label !== undefined) {
      if (typeof route.label !== 'string') {
        throw new Error(`Route label at index ${index} must be a string.`);
      }
      validatedRoute.label = route.label.trim();
    }

    if (route.description !== undefined) {
      if (typeof route.description !== 'string') {
        throw new Error(`Route description at index ${index} must be a string.`);
      }
      validatedRoute.description = route.description.trim();
    }

    if (route.headers !== undefined) {
      if (!Array.isArray(route.headers)) {
        throw new Error(`Route headers at index ${index} must be an array.`);
      }
      validatedRoute.headers = route.headers.map((h, i) => {
        if (typeof h !== 'string') {
          throw new Error(`Header at index ${i} in route ${index} must be a string.`);
        }
        return h.trim();
      });
    }

    return validatedRoute;
  });

  return deepFreeze(validatedRoutes);
}
