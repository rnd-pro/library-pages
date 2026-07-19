import { createPagesJsdaConfig } from '../../../jsda/index.js';

export default createPagesJsdaConfig({
  sourceDir: '../src/static',
  outputDir: '../dist/root',
  copy: [
    { from: '../src/static/assets/raw-copy.txt', to: './assets/' },
  ],
});
