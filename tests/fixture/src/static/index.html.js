import { defineSiteConfig, renderPage } from '../../../../index.js';

/**
 * Synthetic page template for JSDA testing.
 */
export default function generatePage() {
  let basePath = process.env.BASE_PATH || '/';
  let baseUrl = 'https://rnd-pro.github.io';

  const siteConfig = defineSiteConfig({
    brand: {
      title: 'Synthetic Test Page',
      logo: 'assets/raw-copy.txt',
    },
    basePath: basePath,
    metadata: {
      baseUrl: baseUrl,
      description: 'Synthetic Project description',
      icon: 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22%3E%3Ccircle%20cx=%228%22%20cy=%228%22%20r=%227%22%20fill=%22%233451b2%22/%3E%3C/svg%3E',
    },
    pageStyles: '.lp-page-container > h1 { letter-spacing: 0.01em; }',
    clientEntryPath: 'index.js',
  });

  return renderPage({
    siteConfig,
    pageTitle: 'Home',
    contentHtml: `
      <h1>Hello World</h1>
      <p><a href="${basePath}#test-target">Link to fragment</a></p>
      <div id="test-target">Target</div>
    `,
    searchIndex: [],
  });
}
