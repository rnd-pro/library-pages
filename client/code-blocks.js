/**
 * Upgrades semantic article code fences into the documented Symbiote UI
 * code-block component. The host imports the component before calling this;
 * the pre/code fallback stays authoritative when the component never loads.
 * @param {Object} [options]
 * @param {ParentNode} [options.root]
 * @param {string} [options.tagName]
 * @param {string} [options.defaultLanguage]
 * @returns {Promise<void>}
 */
export async function enhanceDocsCodeBlocks({ root = document, tagName = 'code-block', defaultLanguage = 'js' } = {}) {
  let codes = [...root.querySelectorAll('.lp-article pre > code')];
  if (codes.length === 0) return;
  try {
    await customElements.whenDefined(tagName);
    for (let code of codes) {
      let fallback = code.closest('pre');
      if (!fallback?.isConnected) continue;

      let languageClass = [...code.classList].find((name) => name.startsWith('language-'));
      let lang = code.getAttribute('data-language')
        || (languageClass ? languageClass.slice('language-'.length) : defaultLanguage);

      let enhanced = document.createElement(tagName);
      enhanced.setAttribute('copyable', '');
      enhanced.setAttribute('language-label', lang);
      enhanced.setAttribute('line-numbers', 'hide');

      fallback.replaceWith(enhanced);
      try {
        enhanced.setContent(code.textContent, lang);
      } catch (error) {
        enhanced.replaceWith(fallback);
        throw error;
      }
    }
  } catch {
    // The semantic pre/code fallback remains visible when the optional component is unavailable.
  }
}
