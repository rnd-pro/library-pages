# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0-alpha.8] - 2026-07-19

### Added

- Desktop "On this page" outline: the right TOC column renders at viewports >= 1280px (the mobile disclosure hides there), matching the reference docs layout.
- Heading anchors: `renderDocsPage` post-processes article content through the new `ensureHeadingAnchors` export - every h2/h3 gets a stable slugified id (existing ids preserved, duplicates deduplicated) and a hover `#` anchor link. This also restores the outline for markdown pipelines that emit no heading ids.
- "Edit this page on GitHub": new `editBaseUrl` site config field plus per-route `editPath` render an edit link above the pager.
- Header navigation now highlights the owning section by path prefix (external links never activate).

## [0.1.0-alpha.7] - 2026-07-19

### Fixed

- The baseline stylesheet ships no CSS comments (consumer hygiene invariants forbid comments in built pages).

## [0.1.0-alpha.6] - 2026-07-19

### Fixed

- The semantic `--sans`/`--mono` tokens carry concrete font stacks instead of aliasing `--lp-font-*`: on consumers with the Symbiote token bridge enabled the alias formed a custom-property cycle (`--lp-font -> --sn-font -> --sans`), invalidating `font-family` and dropping the page to the browser default font.

## [0.1.0-alpha.5] - 2026-07-19

### Added

- The baseline stylesheet now ships the unified default theme: the shared semantic palette (`--page`, `--surface*`, `--ink`, `--muted`, `--line*`, `--brand*`, status and font tokens) with light/dark values, and all `--lp-color-*` tokens alias into it, so consumers need no local token blocks and can restyle later through overrides.
- Article blockquote and table styles join `.lp-article`, replacing per-consumer prose CSS.
- `enhanceDocsCodeBlocks(options)` in the client entry upgrades article code fences into the documented Symbiote UI code-block component (language from `data-language` or `language-*` classes, copyable, fallback-safe); the host imports the component before calling.

## [0.1.0-alpha.4] - 2026-07-19

### Added

- Shared reference-derived landing patterns in the baseline stylesheet: `.lp-hero*` two-tone hero, `.lp-cta*` pill buttons, `.lp-eyebrow` chip, `.lp-section-intro/-title/-lead`, and `.lp-story-*` alternating narrative rows, so consumer landings stop duplicating shell typography and controls.
- Shared illustration motion utilities (`.lp-anim-dash`, `.lp-anim-float`, `.lp-anim-pulse` with delay helpers): continuous subtle loops matching the reference design language, gated on `.js-active` and `prefers-reduced-motion: no-preference`.
- Article images are capped at the article width by the baseline stylesheet.

## [0.1.0-alpha.3] - 2026-07-19

### Added

- Optional `stack` config section and `renderStackSection` export: an ecosystem cross-linking band rendered by `renderPage` between content and footer, with base-path-safe links, HTML escaping, and an `aria-current` card for the current library.

## [0.1.0-alpha.2] - 2026-07-19

### Fixed

- The header brand no longer overlaps the search trigger at narrow widths: below 901px the brand shrinks with ellipsis instead of keeping its sidebar-aligned fixed width, and the search/theme controls keep their size.

## [0.1.0-alpha.1] - 2026-07-18

### Added
- Static mobile header navigation rendered as a no-JS `<details class="lp-header-nav">` with the same base-path, label, active-state, and `aria-current` semantics as the desktop navigation, revealed only at viewports of 900px or below.
- Typed optional document head fields: `metadata.icon` favicon resolved through base-path URL helpers and escaped into `<link rel="icon">`, and `pageStyles` trusted build-time CSS emitted as a dedicated style tag after the package baseline CSS and before the theme boot/client script, with a case-insensitive `</style` guard at config and render time.
- Isomorphic site/docs page templates, style sheets, and scroll-only header elevations.
- Environment-independent canonical URL and path routing helpers.
- Search index generation and semantic HTML dialog structure.
- Public JSDA project configuration generator mapping build options.
- HTML validators confirming canonical links, base-path safety, reduced motion, and selector health.
- Client-side progressive enhancement supporting scroll elevation, active themes, and keyboard search dialog bindings.

### Fixed
- Inline theme bootstrap now remains syntactically valid after native JSDA Kit 1.6 HTML minification: binding-free `catch` blocks and no declarations inside catch scopes prevent minifier identifier collisions, while the theme resolution order (valid stored value, then system dark preference, then light) and `js-active`-first ordering are preserved.
- Composed search dialog to use namespaced `lp-*` vocabulary and support embedded JSON index payload.
- Unified routing canonical tags, brand home, sidebar, TOC, and pager links.
- Defaults and validations for `basePath` and `language` configurations.
- Complete idempotent client cleanup functions.
- Applied concrete measured visual baseline with light mode and dark mode overrides, removing custom scrollbars and emojis, and hiding progressive controls until JavaScript boot.
- Added accessibility skip links, `aria-current="page"` attributes, and prefers-reduced-motion rules.
- Replaced runtime dynamic footer year with static fallback copyright text.
