import { helper } from './helper.js';

// Browser entry side effect proving bundling/minification.
// Does not use any private JSDA internals or debug console logs.
window.__fixtureEntryInit = 'browser entry init: ' + helper();
