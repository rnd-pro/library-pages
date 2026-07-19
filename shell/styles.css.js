export default /*css*/ `
:root {
  --lp-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --lp-font-mono: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;

  --lp-space-xs: 4px;
  --lp-space-sm: 8px;
  --lp-space-md: 16px;
  --lp-space-lg: 24px;
  --lp-space-xl: 32px;

  --lp-radius-sm: 4px;
  --lp-radius-md: 8px;
  --lp-radius-lg: 12px;

  --lp-transition-fast: 0.15s ease;
  --lp-transition-normal: 0.25s ease;

  --lp-header-height: 64px;
  --lp-sidebar-width: 272px;
  --lp-toc-width: 220px;
  --lp-content-max-width: 656px;

  color-scheme: light;
  --page: #ffffff;
  --surface: #f7f7f8;
  --surface-soft: #f0f0f2;
  --surface-code: #f7f7f8;
  --ink: #3d3d45;
  --muted: #68686e;
  --line: #e3e3e5;
  --line-strong: #a6a6ad;
  --brand: #4058bd;
  --brand-strong: #2f449e;
  --brand-soft: #ebedf9;
  --mint: #1c7a65;
  --mint-soft: #e5f5f1;
  --amber: #a36200;
  --amber-soft: #fef5e6;
  --danger: #b82d3e;
  --focus: var(--brand);
  --sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --mono: SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace;

  --lp-color-bg: var(--page);
  --lp-color-text: var(--ink);
  --lp-color-text-muted: var(--muted);
  --lp-color-text-dim: var(--lp-color-text-muted);
  --lp-color-bg-muted: var(--surface);
  --lp-color-surface: var(--lp-color-bg-muted);
  --lp-color-surface-hover: var(--surface-soft);
  --lp-color-border: var(--line);
  --lp-color-shadow: rgba(0, 0, 0, 0.05);
  --lp-color-primary: var(--brand);
  --lp-color-accent: var(--lp-color-primary);
  --lp-color-outline: var(--lp-color-primary);
  --lp-color-overlay: var(--page);

  --lp-header-bg: var(--lp-color-bg);
}

[data-theme="dark"], .dark {
  color-scheme: dark;
  --page: #1c1d22;
  --surface: #222329;
  --surface-soft: #2a2b33;
  --surface-code: #222329;
  --ink: #e0e0d8;
  --muted: #9b9ba3;
  --line: #303137;
  --line-strong: #50525d;
  --brand: #8192ff;
  --brand-strong: #acb7ff;
  --brand-soft: #25283d;
  --mint: #33ccaa;
  --mint-soft: #14352f;
  --amber: #ffd075;
  --amber-soft: #382d18;
  --danger: #ff8c9c;
  --lp-color-shadow: rgba(0, 0, 0, 0.3);
}

[data-lp-symbiote="true"] {
  --lp-font-sans: var(--sn-font, 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  --lp-font-mono: var(--sn-font-mono, SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace);
  --lp-color-bg: var(--sn-sys-surface, #fff);
  --lp-color-text: var(--sn-sys-on-surface, #3c3c43);
  --lp-color-text-muted: var(--sn-sys-on-surface-dim, #606060);
  --lp-color-text-dim: var(--sn-sys-on-surface-dim, #606060);
  --lp-color-bg-muted: var(--sn-sys-surface-panel, #f6f6f7);
  --lp-color-surface: var(--sn-sys-surface-panel, #f6f6f7);
  --lp-color-primary: var(--sn-sys-accent, #3451b2);
  --lp-color-accent: var(--sn-sys-accent, #3451b2);
  --lp-color-border: var(--sn-border, #e2e2e3);
  --lp-color-outline: var(--sn-outline-color, var(--lp-color-primary));
  --lp-color-overlay: var(--sn-sys-surface-overlay, var(--lp-color-bg));
}

.lp-btn[data-search-trigger],
.lp-btn[data-theme-toggle] {
  display: none;
}

.js-active .lp-btn[data-search-trigger],
.js-active .lp-btn[data-theme-toggle] {
  display: inline-flex;
}

body[data-scrolled="true"] .lp-header {
  border-bottom-color: var(--lp-color-border);
}

.lp-skip-link {
  position: absolute;
  top: -100px;
  left: 16px;
  background: var(--lp-color-primary);
  color: #ffffff;
  padding: var(--lp-space-sm) var(--lp-space-md);
  z-index: 1000;
  text-decoration: none;
  font-weight: 600;
  border-radius: var(--lp-radius-sm);
  transition: top var(--lp-transition-fast);
}

.lp-skip-link:focus-visible {
  top: 16px;
  outline: 2px solid var(--lp-color-outline);
  outline-offset: 2px;
}

*, ::before, ::after {
  box-sizing: border-box;
}

html {
  scroll-padding-top: calc(var(--lp-header-height) + 24px);
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: var(--lp-font-sans);
  background-color: var(--lp-color-bg);
  color: var(--lp-color-text);
  line-height: 1.6;
}

*:focus-visible {
  outline: 2px solid var(--lp-color-outline);
  outline-offset: 2px;
}

.lp-header {
  position: sticky;
  top: 0;
  height: var(--lp-header-height);
  background-color: var(--lp-header-bg);
  border-bottom: 1px solid transparent;
  z-index: 100;
  transition: border-color var(--lp-transition-fast);
}

@media (min-width: 901px) {
  .lp-docs-page .lp-header {
    background: linear-gradient(
      to right,
      var(--lp-color-bg-muted) 0,
      var(--lp-color-bg-muted) calc(var(--lp-sidebar-width) - 1px),
      var(--lp-color-border) calc(var(--lp-sidebar-width) - 1px),
      var(--lp-color-border) var(--lp-sidebar-width),
      var(--lp-header-bg) var(--lp-sidebar-width)
    );
  }
}

.lp-header-container {
  width: 100%;
  max-width: none;
  height: 100%;
  margin: 0;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lp-brand {
  display: flex;
  align-items: center;
  gap: var(--lp-space-sm);
  text-decoration: none;
  color: var(--lp-color-text);
  font-weight: 700;
  font-size: 1.25rem;
  transition: color var(--lp-transition-fast);
  flex-shrink: 0;
  white-space: nowrap;
  min-width: 0;
  width: calc(var(--lp-sidebar-width) - 32px);
}

.lp-brand:hover {
  color: var(--lp-color-primary);
}

.lp-brand-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lp-logo {
  height: 32px;
  width: auto;
  flex-shrink: 0;
}

.lp-nav {
  display: flex;
  align-items: center;
  gap: var(--lp-space-md);
}

.lp-nav-link {
  color: var(--lp-color-text-dim);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color var(--lp-transition-fast);
}

.lp-nav-link:hover,
.lp-nav-link.active {
  color: var(--lp-color-text);
}

.lp-btn {
  background: var(--lp-color-surface);
  border: 1px solid var(--lp-color-border);
  color: var(--lp-color-text-dim);
  padding: var(--lp-space-sm) var(--lp-space-md);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--lp-space-sm);
  transition: background-color var(--lp-transition-fast), border-color var(--lp-transition-fast), color var(--lp-transition-fast);
}

.lp-btn:hover {
  background-color: var(--lp-color-surface-hover);
  color: var(--lp-color-text);
}

.lp-btn-icon {
  padding: var(--lp-space-sm);
  border-radius: 50%;
}

.lp-btn[data-search-trigger] {
  height: 40px;
  background-color: var(--lp-color-bg-muted);
  padding: 0 var(--lp-space-md);
  margin-left: 32px;
  border-radius: 8px;
}

.lp-btn-icon[data-theme-toggle] {
  height: 40px;
  width: 40px;
  padding: 0;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--lp-color-text-dim);
}

.lp-btn-icon[data-theme-toggle]:hover {
  background-color: var(--lp-color-surface-hover);
  color: var(--lp-color-text);
}

.lp-main {
  flex: 1;
  width: 100%;
}

.lp-page-container {
  max-width: 1056px;
  margin: var(--lp-space-xl) auto;
  padding: 0 var(--lp-space-lg);
  width: 100%;
}

.lp-docs-layout {
  display: grid;
  grid-template-columns: var(--lp-sidebar-width) 1fr;
  max-width: none;
  margin: 0;
  width: 100%;
  gap: 0;
}

.lp-desktop-sidebar {
  background-color: var(--lp-color-bg-muted);
  border-right: 1px solid var(--lp-color-border);
  grid-column: 1;
  grid-row: 1 / span 2;
}

.lp-desktop-sidebar .lp-sidebar {
  position: sticky;
  top: var(--lp-header-height);
  height: calc(100vh - var(--lp-header-height));
  overflow-y: auto;
  padding: 10px 32px var(--lp-space-lg);
}

.lp-sidebar-group {
  margin-bottom: 20px;
  padding-bottom: var(--lp-space-lg);
  border-bottom: 1px solid var(--lp-color-border);
}

.lp-sidebar-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.lp-sidebar-group-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 24px;
  color: var(--lp-color-text-dim);
  margin-bottom: 0;
  padding: 4px 0;
}

.lp-sidebar-link {
  display: block;
  padding: 4px 0;
  color: var(--lp-color-text-dim);
  text-decoration: none;
  font-size: 16px;
  line-height: 24px;
  transition: color var(--lp-transition-fast);
}

.lp-sidebar-link:hover,
.lp-sidebar-link.active {
  color: var(--lp-color-text);
}

.lp-sidebar-link.active {
  font-weight: 600;
  color: var(--lp-color-primary);
}

.lp-content {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
  padding: 48px 64px 32px;
}

.lp-article {
  max-width: var(--lp-content-max-width);
  margin-left: 0;
  margin-right: auto;
  margin-bottom: var(--lp-space-xl);
}

.lp-article h1 {
  font-size: 32px;
  font-weight: 600;
  line-height: 40px;
  margin-top: 0;
  margin-bottom: var(--lp-space-md);
}

.lp-article h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  margin-top: 48px;
  margin-bottom: var(--lp-space-md);
  padding-top: 1.5rem;
  border-top: 1px solid var(--lp-color-border);
}

.lp-article h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: var(--lp-space-lg);
  margin-bottom: var(--lp-space-sm);
}

.lp-article p {
  margin-bottom: var(--lp-space-md);
}

.lp-article a {
  color: var(--lp-color-primary);
  text-decoration: none;
}

.lp-article a:hover {
  text-decoration: underline;
}

.lp-article code {
  font-family: var(--lp-font-mono);
  background-color: var(--lp-color-surface);
  padding: 0.2em 0.4em;
  border-radius: var(--lp-radius-sm);
  font-size: 85%;
}

.lp-article pre {
  margin-bottom: var(--lp-space-lg);
  padding: var(--lp-space-md);
  overflow-x: auto;
  background-color: var(--lp-color-surface);
  border: 1px solid var(--lp-color-border);
  border-radius: var(--lp-radius-md);
}

.lp-article pre code {
  padding: 0;
  background: transparent;
  font-size: 0.9rem;
}

.lp-article ul,
.lp-article ol {
  margin-bottom: var(--lp-space-lg);
  padding-left: var(--lp-space-lg);
}

.lp-article li {
  margin-bottom: var(--lp-space-xs);
}

.lp-article blockquote {
  margin: 0 0 var(--lp-space-lg);
  padding-left: var(--lp-space-md);
  border-left: 2px solid var(--lp-color-primary);
  color: var(--lp-color-text-dim);
}

.lp-article table {
  width: 100%;
  border-collapse: collapse;
  display: block;
  overflow-x: auto;
  margin: 0 0 var(--lp-space-lg);
}

.lp-article th,
.lp-article td {
  padding: 10px;
  border-bottom: 1px solid var(--lp-color-border);
  text-align: left;
  vertical-align: top;
}

.lp-article th {
  color: var(--lp-color-text);
  font-weight: 600;
}

.lp-anchor {
  margin-left: 6px;
  color: var(--lp-color-primary);
  text-decoration: none;
  opacity: 0;
  transition: opacity var(--lp-transition-fast);
}

.lp-article :is(h2, h3):hover .lp-anchor,
.lp-anchor:focus-visible {
  opacity: 1;
}

.lp-doc-footer {
  margin-top: var(--lp-space-xl);
}

.lp-edit-link {
  color: var(--lp-color-text-dim);
  font-size: 0.9rem;
  text-decoration: none;
  transition: color var(--lp-transition-fast);
}

.lp-edit-link:hover {
  color: var(--lp-color-primary);
  text-decoration: underline;
}

.lp-article code-block {
  --sn-font-mono: var(--mono);
  --sn-sys-surface: var(--surface-code);
  --sn-sys-on-surface: var(--ink);
  --sn-sys-on-surface-dim: var(--muted);
  --sn-sys-border: var(--line);
  --sn-border: var(--line);
  --sn-sys-accent: var(--brand);
  --sn-syntax-keyword: var(--brand);
  --sn-syntax-string: var(--mint);
  --sn-syntax-comment: var(--muted);
  --sn-syntax-function: var(--ink);
  --sn-syntax-number: var(--amber);
  --sn-syntax-builtin: var(--brand);
  --sn-syntax-property: var(--ink);
  --sn-syntax-literal: var(--mint);
  --sn-syntax-doc: var(--muted);
  --sn-syntax-template: var(--mint);
}

.lp-pager {
  display: flex;
  justify-content: space-between;
  gap: var(--lp-space-md);
  margin-top: var(--lp-space-xl);
  padding-top: var(--lp-space-lg);
  border-top: 1px solid var(--lp-color-border);
}

.lp-pager-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--lp-space-sm) 0;
  border: none;
  border-radius: 0;
  background: transparent;
  text-decoration: none;
  transition: color var(--lp-transition-fast);
}

.lp-pager-link:hover {
  border: none;
  background-color: transparent;
}

.lp-pager-link:hover .lp-pager-title {
  color: var(--lp-color-primary);
  text-decoration: underline;
}

.lp-pager-link.prev {
  align-items: flex-start;
}

.lp-pager-link.next {
  align-items: flex-end;
}

.lp-pager-label {
  font-size: 0.8rem;
  color: var(--lp-color-text-dim);
  margin-bottom: var(--lp-space-xs);
}

.lp-pager-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--lp-color-text);
  transition: color var(--lp-transition-fast);
}

.lp-toc {
  display: none;
  position: sticky;
  top: var(--lp-header-height);
  height: calc(100vh - var(--lp-header-height));
  overflow-y: auto;
  padding: var(--lp-space-lg);
  max-width: var(--lp-toc-width);
}

.lp-toc-outline {
  position: relative;
  border-left: 1px solid var(--lp-color-border);
  padding-left: 16px;
}

.lp-toc-marker {
  display: none;
  position: absolute;
  top: 32px;
  left: -1px;
  width: 2px;
  height: 18px;
  border-radius: 2px;
  background-color: var(--lp-color-primary);
  transition: top 0.25s cubic-bezier(0, 1, 0.5, 1);
}

.lp-toc-marker.is-visible {
  display: block;
}

.lp-mobile-toc {
  grid-column: 2;
  grid-row: 1;
  background-color: var(--lp-color-bg);
  border-bottom: 1px solid var(--lp-color-border);
  width: 100%;
  display: block;
}

.lp-mobile-toc summary {
  min-height: 48px;
  padding: 12px 36px;
  font-weight: 500;
  font-size: 14px;
  line-height: 24px;
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: flex-start;
  gap: var(--lp-space-sm);
  align-items: center;
}

.lp-mobile-toc summary::-webkit-details-marker {
  display: none;
}

.lp-mobile-toc summary::after {
  content: "";
  display: inline-block;
  width: 6px;
  height: 6px;
  border-right: 2px solid var(--lp-color-text-dim);
  border-bottom: 2px solid var(--lp-color-text-dim);
  transform: rotate(-45deg);
  transition: transform var(--lp-transition-fast);
}

.lp-mobile-toc[open] summary::after {
  transform: rotate(45deg);
}

.lp-mobile-toc .lp-toc-list {
  padding: var(--lp-space-sm) 32px var(--lp-space-md) 32px;
  list-style: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-xs);
}

.lp-mobile-toc .lp-toc-item {
  margin-top: var(--lp-space-sm);
}

.lp-mobile-toc .lp-toc-item.depth-3 {
  padding-left: var(--lp-space-md);
}

.lp-mobile-toc .lp-toc-link {
  color: var(--lp-color-text-dim);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color var(--lp-transition-fast);
}

.lp-mobile-toc .lp-toc-link:hover {
  color: var(--lp-color-text);
}

.lp-toc-title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 2rem;
  color: var(--lp-color-text);
}

.lp-toc-list,
.lp-sidebar-list,
.lp-search-results-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lp-toc-item {
  margin: 0;
}

.lp-toc-link {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--lp-color-text-dim);
  text-decoration: none;
  transition: color var(--lp-transition-fast);
  line-height: 2rem;
}

.lp-toc-link:hover,
.lp-toc-link.active {
  color: var(--lp-color-text);
}

.lp-toc-item.depth-3 {
  padding-left: var(--lp-space-md);
}

.lp-footer {
  border-top: 1px solid var(--lp-color-border);
  background-color: var(--lp-color-surface);
  padding: var(--lp-space-xl) 0;
  margin-top: auto;
}

.lp-footer-container {
  max-width: 1056px;
  margin: 0 auto;
  padding: 0 var(--lp-space-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--lp-space-md);
}

.lp-footer-links {
  display: flex;
  gap: var(--lp-space-lg);
}

.lp-footer-link {
  color: var(--lp-color-text-dim);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color var(--lp-transition-fast);
}

.lp-footer-link:hover {
  color: var(--lp-color-text);
}

.lp-footer-copy {
  font-size: 0.85rem;
  color: var(--lp-color-text-dim);
}

.lp-mobile-nav {
  display: none;
}

.lp-header-nav {
  display: none;
}

.lp-desktop-sidebar {
  display: block;
}

.lp-search-dialog {
  border: 1px solid var(--lp-color-border);
  border-radius: var(--lp-radius-lg);
  background: var(--lp-color-overlay);
  color: var(--lp-color-text);
  max-width: 600px;
  width: 90%;
  margin: 10vh auto auto auto;
  box-shadow: 0 10px 30px var(--lp-color-shadow);
  padding: 0;
}

.lp-search-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.lp-search-box {
  display: flex;
  flex-direction: column;
}

.lp-search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--lp-space-md);
  border-bottom: 1px solid var(--lp-color-border);
}

.lp-search-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--lp-space-sm);
  flex: 1;
}

.lp-search-input-icon {
  color: var(--lp-color-text-dim);
}

.lp-search-input {
  border: none;
  background: transparent;
  color: var(--lp-color-text);
  font-size: 1.1rem;
  width: 100%;
  outline: none;
}

.lp-search-close-btn {
  background: var(--lp-color-surface);
  border: 1px solid var(--lp-color-border);
  color: var(--lp-color-text-dim);
  padding: var(--lp-space-xs) var(--lp-space-sm);
  border-radius: var(--lp-radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
  font-family: var(--lp-font-sans);
}

.lp-search-close-btn:hover {
  background: var(--lp-color-surface-hover);
  color: var(--lp-color-text);
}

.lp-search-results-container {
  max-height: 350px;
  overflow-y: auto;
  padding: var(--lp-space-md);
}

.lp-search-results-count {
  font-size: 0.8rem;
  color: var(--lp-color-text-dim);
  margin-bottom: var(--lp-space-sm);
}

.lp-search-results-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-sm);
}

.lp-search-result-item {
  border-radius: var(--lp-radius-md);
  border: 1px solid transparent;
  transition: background-color var(--lp-transition-fast), border-color var(--lp-transition-fast);
}

.lp-search-result-item.active,
.lp-search-result-item:hover {
  background-color: var(--lp-color-surface);
  border-color: var(--lp-color-border);
}

.lp-search-result-link {
  display: flex;
  flex-direction: column;
  padding: var(--lp-space-sm);
  text-decoration: none;
  color: var(--lp-color-text);
}

.lp-search-result-section {
  font-size: 0.75rem;
  color: var(--lp-color-primary);
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: var(--lp-space-xs);
}

.lp-search-result-title {
  font-weight: 600;
  font-size: 1rem;
}

.lp-search-result-description {
  font-size: 0.85rem;
  color: var(--lp-color-text-dim);
  margin-top: var(--lp-space-xs);
}

.lp-search-no-results {
  padding: var(--lp-space-md);
  text-align: center;
  color: var(--lp-color-text-dim);
  font-size: 0.95rem;
}

.lp-search-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--lp-space-md);
  padding: var(--lp-space-sm) var(--lp-space-md);
  background: var(--lp-color-surface);
  border-top: 1px solid var(--lp-color-border);
  font-size: 0.8rem;
  color: var(--lp-color-text-dim);
}

.lp-search-key-hint {
  display: inline-flex;
  align-items: center;
  gap: var(--lp-space-xs);
}

.lp-search-label {
  font-family: var(--lp-font-sans);
  background: transparent;
  border: none;
  padding: 0;
}

@media (min-width: 1441px) {
  .lp-docs-layout {
    grid-template-columns: var(--lp-sidebar-width) 1fr var(--lp-toc-width);
  }
  .lp-toc {
    display: block;
    grid-column: 3;
    grid-row: 1;
  }
  .lp-mobile-toc {
    display: none;
  }
  .lp-desktop-sidebar,
  .lp-content {
    grid-row: 1;
  }
}

@media (max-width: 900px) {
  .lp-header-container {
    padding: 0 var(--lp-space-md);
  }

  .lp-nav {
    display: none;
  }

  .lp-header-nav {
    display: block;
  }

  .lp-header-nav summary {
    display: flex;
    align-items: center;
    min-height: 40px;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--lp-color-text-dim);
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  .lp-header-nav summary::-webkit-details-marker {
    display: none;
  }

  .lp-header-nav summary::after {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-left: var(--lp-space-sm);
    border-right: 2px solid var(--lp-color-text-dim);
    border-bottom: 2px solid var(--lp-color-text-dim);
    transform: rotate(45deg);
    transition: transform var(--lp-transition-fast);
  }

  .lp-header-nav[open] summary::after {
    transform: rotate(-135deg);
  }

  .lp-header-nav-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-width: 100vw;
    display: flex;
    flex-direction: column;
    gap: var(--lp-space-xs);
    padding: var(--lp-space-sm) var(--lp-space-md) var(--lp-space-md);
    background-color: var(--lp-header-bg);
    border-bottom: 1px solid var(--lp-color-border);
  }

  .lp-header-nav-menu .lp-nav-link {
    display: block;
    padding: var(--lp-space-xs) 0;
  }

  .lp-brand {
    width: auto;
    max-width: 100%;
    flex-shrink: 1;
    overflow: hidden;
    margin-right: var(--lp-space-sm);
  }

  .lp-btn[data-search-trigger] {
    margin-left: var(--lp-space-sm);
    flex-shrink: 0;
  }

  .lp-btn-icon[data-theme-toggle] {
    flex-shrink: 0;
  }

  .lp-docs-layout {
    grid-template-columns: 1fr;
    padding: 0 var(--lp-space-md) var(--lp-space-md);
    gap: var(--lp-space-md);
  }

  .lp-desktop-sidebar {
    display: none;
  }

  .lp-mobile-nav {
    display: block;
    grid-column: 1;
    grid-row: 2;
    margin-bottom: var(--lp-space-md);
    border: 0;
    border-bottom: 1px solid var(--lp-color-border);
    border-radius: 0;
    background-color: transparent;
  }

  .lp-mobile-nav summary {
    padding: 12px 0;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .lp-mobile-nav summary::-webkit-details-marker {
    display: none;
  }

  .lp-mobile-nav summary::after {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    border-right: 2px solid var(--lp-color-text-dim);
    border-bottom: 2px solid var(--lp-color-text-dim);
    transform: rotate(45deg);
    transition: transform var(--lp-transition-fast);
  }

  .lp-mobile-nav[open] summary::after {
    transform: rotate(-135deg);
  }

  .lp-mobile-nav .lp-sidebar {
    position: static;
    height: auto;
    overflow-y: visible;
    padding: 0 0 var(--lp-space-md);
    border-top: 0;
  }

  .lp-pager {
    flex-direction: column;
  }

  .lp-content {
    grid-column: 1;
    grid-row: 3;
    padding: 0;
  }

  .lp-article {
    margin-left: 0;
    margin-right: 0;
    max-width: 100%;
  }

  .lp-mobile-toc {
    grid-column: 1;
    grid-row: 1;
    width: calc(100% + 2 * var(--lp-space-md));
    margin-left: calc(-1 * var(--lp-space-md));
  }

  .lp-mobile-toc summary {
    padding: var(--lp-space-sm) var(--lp-space-md);
  }

  .lp-mobile-toc .lp-toc-list {
    padding: var(--lp-space-sm) var(--lp-space-md) var(--lp-space-md) var(--lp-space-md);
  }
}

.lp-header-spacer {
  flex: 1;
}

kbd, .lp-search-kbd {
  font-family: var(--lp-font-mono);
  font-size: 0.8rem;
  background: var(--lp-color-bg-muted);
  border: 1px solid var(--lp-color-border);
  border-radius: 4px;
  padding: 1px 4px;
  display: inline-block;
}

.lp-search-kbd {
  margin-left: var(--lp-space-sm);
}

@media (max-width: 900px) {
  .lp-search-kbd {
    display: none;
  }
}

@media (max-width: 480px) {
  .lp-btn[data-search-trigger] {
    width: 40px;
    margin-left: auto;
    padding: 0;
    justify-content: center;
  }

  .lp-search-label {
    display: none;
  }
}

.lp-pager-placeholder {
  flex: 1;
}

.lp-hero {
  position: relative;
  padding: 80px 0 72px;
}

.lp-hero-title {
  margin: 0 0 28px;
  max-width: 640px;
  font-size: 56px;
  line-height: 64px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--lp-color-text);
}

.lp-hero-accent {
  display: block;
  color: var(--lp-color-primary);
}

.lp-hero-lead {
  margin: 0 0 36px;
  max-width: 576px;
  font-size: 24px;
  line-height: 36px;
  font-weight: 500;
  color: var(--lp-color-text-dim);
}

.lp-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.lp-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 40px;
  padding: 0 24px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  transition: background-color var(--lp-transition-fast), border-color var(--lp-transition-fast), color var(--lp-transition-fast);
}

.lp-cta:hover {
  text-decoration: none;
}

.lp-cta-primary {
  background-color: var(--lp-color-primary);
  border-color: var(--lp-color-primary);
  color: var(--lp-color-bg);
}

.lp-cta-primary:hover {
  filter: brightness(1.12);
}

.lp-cta-secondary {
  background-color: var(--lp-color-surface);
  color: var(--lp-color-text);
}

.lp-cta-secondary:hover {
  background-color: var(--lp-color-surface-hover);
}

.lp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 13px;
  border: 1px solid color-mix(in srgb, var(--lp-color-primary) 40%, transparent);
  border-radius: 999px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lp-color-primary);
}

.lp-section-intro {
  max-width: 720px;
  margin: 0 auto 56px;
  padding-top: 24px;
  text-align: center;
}

.lp-section-intro .lp-eyebrow {
  margin-bottom: 24px;
}

.lp-section-title {
  margin: 0 0 16px;
  font-size: 40px;
  line-height: 46px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--lp-color-text);
}

.lp-section-lead {
  margin: 0 auto;
  max-width: 640px;
  font-size: 16px;
  line-height: 28px;
  color: var(--lp-color-text-dim);
}

.lp-story-row {
  display: flex;
  align-items: center;
  gap: 40px;
  width: 100%;
  max-width: 1104px;
  margin: 0 auto 80px;
  box-sizing: border-box;
}

.lp-story-row.reverse {
  flex-direction: row-reverse;
}

.lp-story-text {
  flex: 1 1 40%;
  min-width: 0;
}

.lp-story-num {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--lp-color-primary);
}

.lp-story-title {
  margin: 0 0 12px;
  font-size: 28px;
  line-height: 34px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--lp-color-text);
}

.lp-story-desc {
  margin: 0;
  max-width: 32rem;
  font-size: 16px;
  line-height: 28px;
  color: var(--lp-color-text-dim);
}

.lp-story-visual {
  flex: 1 1 60%;
  min-width: 0;
}

@keyframes lp-dash-flow {
  to { stroke-dashoffset: -48; }
}

@keyframes lp-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes lp-pulse {
  0%, 100% { opacity: 0.45; transform: scale(0.94); }
  50% { opacity: 1; transform: scale(1); }
}

.lp-anim-float,
.lp-anim-pulse {
  transform-box: fill-box;
  transform-origin: center;
}

@media (prefers-reduced-motion: no-preference) {
  .js-active .lp-anim-dash {
    animation: lp-dash-flow 1.6s linear infinite;
  }

  .js-active .lp-anim-float {
    animation: lp-float 5s ease-in-out infinite;
  }

  .js-active .lp-anim-pulse {
    animation: lp-pulse 3.6s ease-in-out infinite;
  }

  .lp-anim-delay-1 {
    animation-delay: 0.7s;
  }

  .lp-anim-delay-2 {
    animation-delay: 1.4s;
  }
}

@media (max-width: 900px) {
  .lp-hero {
    padding: 48px 0 40px;
  }

  .lp-hero-title {
    font-size: 40px;
    line-height: 46px;
  }

  .lp-hero-lead {
    font-size: 18px;
    line-height: 28px;
  }

  .lp-section-title {
    font-size: 32px;
    line-height: 38px;
  }

  .lp-story-row,
  .lp-story-row.reverse {
    flex-direction: column;
    align-items: stretch;
    gap: 24px;
    margin-bottom: 56px;
  }
}

.lp-article img {
  max-width: 100%;
  height: auto;
}

.lp-stack {
  border-top: 1px solid var(--lp-color-border);
  background-color: var(--lp-color-bg-muted);
}

.lp-stack-inner {
  max-width: 1056px;
  margin: 0 auto;
  padding: var(--lp-space-xl) var(--lp-space-lg);
}

.lp-stack-title {
  margin: 0 0 var(--lp-space-sm);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lp-color-text-dim);
}

.lp-stack-tagline {
  margin: 0 0 var(--lp-space-lg);
  color: var(--lp-color-text-dim);
}

.lp-stack-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--lp-space-md);
  margin-top: var(--lp-space-md);
}

.lp-stack-card {
  display: block;
  padding: var(--lp-space-lg);
  border: 1px solid var(--lp-color-border);
  border-radius: var(--lp-radius-lg);
  background-color: var(--lp-color-bg);
  color: inherit;
  text-decoration: none;
  transition: border-color var(--lp-transition-fast);
}

a.lp-stack-card:hover {
  border-color: var(--lp-color-primary);
  text-decoration: none;
}

.lp-stack-card[aria-current] {
  border-color: var(--lp-color-primary);
}

.lp-stack-label {
  display: block;
  margin-bottom: var(--lp-space-sm);
  font-weight: 600;
  color: var(--lp-color-text);
}

.lp-stack-desc {
  display: block;
  color: var(--lp-color-text-dim);
  font-size: 0.9rem;
  line-height: 1.55;
}

@media (max-width: 900px) {
  .lp-stack-grid {
    grid-template-columns: 1fr;
  }
}

.lp-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--lp-space-md);
  margin: var(--lp-space-lg) 0;
}

.lp-card {
  display: flex;
  flex-direction: column;
  gap: var(--lp-space-sm);
  padding: var(--lp-space-lg);
  border: 1px solid var(--lp-color-border);
  border-radius: var(--lp-radius-lg);
  background-color: var(--lp-color-surface);
  color: inherit;
  text-decoration: none;
  transition: border-color var(--lp-transition-fast), background-color var(--lp-transition-fast);
}

a.lp-card:hover {
  border-color: var(--lp-color-primary);
  text-decoration: none;
}

.lp-card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--lp-color-text);
}

.lp-card-desc {
  margin: 0;
  color: var(--lp-color-text-dim);
  font-size: 0.9rem;
  line-height: 1.55;
}

.lp-sidebar-list-unstyled {
  list-style: none;
}

@media (min-width: 1280px) {
  .lp-toc {
    display: block;
    grid-area: 1 / 3 / span 2;
  }

  .lp-docs-layout {
    grid-template-columns: var(--lp-sidebar-width) 1fr var(--lp-toc-width);
  }

  .lp-mobile-toc {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-delay: -1ms !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    background-attachment: initial !important;
    scroll-behavior: auto !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
}
`;
