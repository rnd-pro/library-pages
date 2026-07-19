# @rnd-pro/library-pages

Reusable, semantic, and progressively enhanced static documentation shell for RND-PRO libraries, providing base-path-safe layouts, search indexing, client-side progressive enhancement, and output verification with zero runtime dependencies.

## Installation and Setup

Install the package as a development dependency:

```bash
npm install --save-dev @rnd-pro/library-pages
```

### Environment Requirements
- **Package Core**: Node.js `>= 18` is required.
- **Native JSDA Kit 1.6 Builds**: Node.js `>= 20` is required.

### Zero-Runtime-Dependency Boundary
This package operates with a strict zero-runtime-dependency boundary. All templates, CSS baselines, configurations, and URL resolution helpers are packaged and resolved during static site generation (SSG).
- **DOM-Free Core**: The main exports are Node-safe and DOM-free, ensuring they can be imported and executed inside server-side scripts or SSG builders without referencing browser globals like `window` or `document`.
- **Client Separation**: Client-side interactive script enhancements are isolated inside the `@rnd-pro/library-pages/client` subpath to prevent Node environments from throwing errors.

---

## Architectural Distinctions

### Shared Shell Mechanics vs. Consumer-Owned Semantics
- **Shared Shell Mechanics (Owned by `@rnd-pro/library-pages`)**: Governs the structured layouts, accessibility skip links, unified headers/footers, dark/light theme management state, search index serialization, and dialog overlay triggers.
- **Consumer-Owned Semantics (Owned by the library repository)**: The consumer retains exclusive ownership of all text, diagrams, animations, and demo semantics. The actual page markdown/HTML content, custom branding assets, custom styling overrides, and specific interactive widgets remain completely owned and managed by the consumer.

### Native JSDA 1.6 Integration
The `jsda-kit` (version 1.6) is consumed completely unchanged in its native form. This library maintains an explicit, immutable-JSDA boundary and **does not wrap, patch, or modify** the `jsda-kit` CLI or internals. Instead, it exposes configuration generation helper methods mapping static source directories, minification rules, bundler exclusions, and copy rules that conform to native JSDA 1.6 parameters.

---

## Configuration & Usage

### 1. Site Configuration (`defineSiteConfig`)
Validates and freezes the trusted build-time configurations, setting safe defaults.

```js
import { defineSiteConfig } from '@rnd-pro/library-pages';

const siteConfig = defineSiteConfig({
  brand: {
    title: 'My Library',
    logo: '/assets/logo.png', // Logo path resolved via createUrlHelpers
  },
  metadata: {
    description: 'Documentation for My Library',
    baseUrl: 'https://rnd-pro.github.io', // Base URL for canonical tag generation
    icon: '/assets/favicon.svg', // Favicon resolved via createUrlHelpers, escaped into <link rel="icon">
  },
  pageStyles: '.lp-page-container > h1 { letter-spacing: 0.01em; }', // Trusted build-time CSS for this page family
  basePath: '/my-library/', // Canonical trailing-slash base path
  language: 'en',
  themeStorageKey: 'my-theme-key',
  symbioteTokenBridge: true, // Enables Symbiote design tokens bridge mapping
  navigation: [
    { label: 'Guide', path: '/guide' },
    { label: 'API Reference', path: '/api' }
  ],
  footer: {
    copyright: '© RND-PRO',
    links: [
      { label: 'GitHub', path: 'https://github.com/rnd-pro/my-library' }
    ]
  }
});
```

### 2. Document Head Fields (`metadata.icon` and `pageStyles`)
One composed `SiteConfig` represents one page family: every page rendered from it shares the same document head.

- **`metadata.icon`** (optional, non-empty string): favicon reference. The value is resolved through the same base-path URL helpers as all other asset paths (absolute paths gain the `basePath` prefix; scheme-qualified values such as `data:` URIs pass through unchanged), HTML-escaped, and emitted as exactly `<link rel="icon" href="...">`. Absent by default — no favicon tag is rendered.
- **`pageStyles`** (optional, trusted build-time CSS string): consumer-owned page styles, emitted as a dedicated `<style>` tag placed after the package baseline CSS and before the theme boot/client script, so page rules can layer on the baseline cascade. Ordinary CSS syntax — child combinators (`>`), braces, at-rules, selectors — is accepted as-is. The only rejected content is a closing `</style` sequence (matched case-insensitively), which would break out of the style element; both `defineSiteConfig` and `renderHead` throw an actionable error on it. Absent by default — no page-style tag is rendered.

### 3. Route Configuration (`defineDocsRoutes`)
Validates and freezes documentation paths, normalizing them, applying optional default fallback sections, and guarding against duplicate routes.

```js
import { defineDocsRoutes } from '@rnd-pro/library-pages';

const routes = defineDocsRoutes([
  { path: 'intro', title: 'Introduction' }, // Falls back to defaultSection
  { path: 'usage', title: 'Usage Guide', section: 'Getting Started' },
  { path: 'api', title: 'API Reference', section: 'Reference' }
], {
  defaultSection: 'Getting Started' // Fallback section name for routes without explicit section
});
```

---

## Canonical Base-Path Behavior
All routing, asset paths, site navigation links, page pagers, table of content anchors, and metadata canonical tags are normalized and resolved through environment-independent URL helpers created by `createUrlHelpers({ basePath, baseUrl })`.
- **Pre-resolved Paths**: If a path is already resolved or begins with a scheme (e.g. `mailto:`, `https://`, `//`), the helper returns it unchanged.
- **Sub-directory Safety**: Paths are always resolved relative to the defined `basePath` (defaulting to `/`), preventing broken links when deploying static sites to subpaths such as GitHub Pages (`https://owner.github.io/repository/`).

---

## Symbiote Token Bridge
When `symbioteTokenBridge: true` is configured, the rendered HTML document attaches `data-lp-symbiote="true"` to the `<html>` element. The built-in stylesheet maps internal visual custom properties (`--lp-*`) to Symbiote's design system tokens:
- `--lp-font-sans` maps to `--sn-font`
- `--lp-font-mono` maps to `--sn-font-mono`
- `--lp-color-bg` maps to `--sn-sys-surface`
- `--lp-color-text` maps to `--sn-sys-on-surface`
- `--lp-color-text-muted` maps to `--sn-sys-on-surface-dim`
- `--lp-color-bg-muted` maps to `--sn-sys-surface-panel`
- `--lp-color-primary` maps to `--sn-sys-accent`
- `--lp-color-border` maps to `--sn-border`
- `--lp-color-outline` maps to `--sn-outline-color`

---

## Responsive Header Navigation
When `navigation` entries are configured, `renderHeader` renders the desktop link bar (`<nav class="lp-nav">`) plus one static mobile navigation (`<details class="lp-header-nav">`) containing the same links. The mobile navigation:
- **Works without JavaScript**: it is plain `<details>`/`<summary>` markup, never gated behind the `.js-active` class, and is revealed only at viewports of 900px or below where the desktop nav is hidden.
- **Mirrors desktop semantics**: same base-path resolution, labels, `active` class, and `aria-current="page"` handling, with an accessible summary name and a labeled contained `<nav>` landmark.
- **Stays restrained**: it uses only existing `--lp-*` design tokens, with no `!important`, animation, blur, or heavy shadow, and its full-width menu cannot cause horizontal overflow.

## Inline Theme Bootstrap
`renderThemeBoot` emits a blocking inline script that runs before any progressive enhancement: it adds the `js-active` class to the root element, resolves the initial theme from a valid stored value, then the system dark preference, then light, and applies it as the `data-theme` attribute plus the matching `light`/`dark` root class. The script body is authored minifier-safe — binding-free `catch` blocks and no declarations inside catch scopes — so it remains syntactically valid after native JSDA 1.6 HTML minification.

---

## Client-Side Progressive Enhancement

### Client Options and Behavior
To add client-side interactivity, import and call `enhanceLibraryPages` in your browser bundle entry:

```js
import { enhanceLibraryPages } from '@rnd-pro/library-pages/client';

const cleanup = enhanceLibraryPages({
  dialog: '[data-search-dialog]',          // Optional: Selector string or dialog DOM element
  searchIndex: window.__SEARCH_INDEX__,    // Optional: Array of search items, fallback to inline script
  basePath: '/',                           // Optional: Custom base path for routing inside the search dialog
});
```

#### Supported Options
* **`dialog`** (string | HTMLDialogElement): The search dialog element or selector to query. Defaults to searching for `[data-search-dialog]`.
* **`searchIndex`** (Array): An array of pre-built search index items. If omitted, the client attempts to parse the index from the inline `<script data-search-index>` embedded inside the dialog element.
* **`basePath`** (string): The base path used to resolve search link URLs. Defaults to the `data-base-path` attribute on the dialog element, or `/`.

#### Client Behavior
* **Initialization**:
  * Appends the `.js-active` class to the root `<html>` element.
  * Adds a window scroll event listener that toggles the `data-scrolled="true"|"false"` attribute on the `<body>` element (for scroll elevation styling).
  * Hooks up a click listener to the theme toggle button (`[data-theme-toggle]`) to toggle between the `light` and `dark` classes and `data-theme` attribute on the root `<html>` element, persisting the value under the key configured in the root element's `data-theme-key` attribute (defaulting to `lp-theme`).
  * Attaches event listeners for the search trigger (`[data-search-trigger]`), search input element, keyboard hotkey (`Cmd+K`/`Ctrl+K` to open, `Esc` to close), and keyboard results navigation.
* **Idempotent Cleanup**:
  Calling the returned `cleanup()` function will:
  * Remove the window scroll listener and click listener on the theme toggle button.
  * Remove keyboard and input event listeners on search inputs and triggers, and close the search dialog if open.
  * Remove the `.js-active` class from the `<html>` element.
  * Remove the `data-scrolled` attribute from the `<body>` element.
  * *Note: The cleanup function does not remove theme-related classes (`light` / `dark`), does not reset the `data-theme` or `data-theme-key` attributes on the root `<html>` element, and does not alter the saved theme state in `localStorage`.*

---

## Export Directory

### Core SSG & Configuration Utility Exports (`@rnd-pro/library-pages`)
- `defineSiteConfig(config)`: Validates and deep freezes site configuration options, setting default fallback keys.
- `defineDocsRoutes(routes, options)`: Normalizes paths, group-sections, and freezes page routes. Throws on duplicates.
- `normalizeRoutes(routes)`: Internal helper validating route path uniqueness and enforcing normalized slash structures.
- `createUrlHelpers({ basePath, baseUrl })`: Returns `resolvePath`, `resolveUrl`, and `normalizePath` helpers relative to the base configuration.
- `normalizePath(path)`: Formats path segments with leading/trailing slashes while preserving hash links and query strings.
- `readPagesEnv(env)`: Reads environment variables (`BASE_PATH`, `GITHUB_REPOSITORY`) to deduce deployment base pathing.
- `renderPage({ siteConfig, pageTitle, contentHtml, currentPath, searchIndex })`: Renders a complete standalone site layout.
- `renderDocsPage({ siteConfig, routes, currentRoute, contentHtml, toc })`: Renders a full multi-column documentation view with a sidebar and table of contents.
- `renderHead(siteConfig, pageTitle, currentPath)`: Renders inner `<head>` children (meta, title, canonical link, favicon link, baseline styles, page styles, theme boot, client script).
- `renderHeader(siteConfig, currentPath)`: Renders the responsive branding header, desktop navbar links, and the static no-JS mobile details navigation.
- `renderFooter(siteConfig)`: Renders copyright text and site links footer layout.
- `renderStyles(siteConfig)`: Compiles the visual baseline styles and injects custom token style overrides.
- `renderThemeBoot(themeStorageKey)`: Produces the minifier-safe inline theme bootstrap that applies the initial theme and `js-active` before progressive script boot.
- `extractTOC(contentHtml)`: Extracts structured heading outlines (h2/h3 elements containing id tags) from content strings.
- `renderTOC(toc, currentRoute, siteConfig)`: Generates the desktop table-of-contents navigation markup.
- `renderSidebar(routes, currentRoute, siteConfig)`: Compiles categorized navigation hierarchy group links.
- `renderPager(routes, currentRoute, siteConfig)`: Compiles previous and next documentation links pager navigation.
- `buildSearchIndex(routes)`: Builds and returns tokenized, searchable route objects for search client ingestion.
- `renderSearchDialog({ basePath, placeholder, searchIndex })`: Renders the dialog structure housing inputs, triggers, and the serialized JSON search index.
- `createPagesJsdaConfig(options)`: Compiles static entry rules, copy assets, bundling options, and minification configurations compatible with native `jsda-kit` 1.6 configuration requirements.
- `createArtifactChecks({ parseHTML })`: Instantiates DOM verification rules checking canonical URL format, base-path prefixes, forbidden selector patterns (`.cb-`, `#cb-`), link health, and responsive reduced-motion rules.
- `assertPagesOutput({ outputDir, basePath, baseUrl, requiredFiles, parseHTML })`: Evaluates a compiled static folder against sanity rules, guaranteeing GitHub Pages path containment.

### Client-Side Enhancement Exports (`@rnd-pro/library-pages/client`)
- `enhanceLibraryPages(options)`: Boots progressive enhancements. Returns cleanups restoring standard HTML baselines.
