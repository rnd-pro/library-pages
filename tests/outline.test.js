import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveActiveIndex } from '../client/outline.js';

const OFFSET = 88;

function pick(tops, scrollY, maxScroll) {
  return resolveActiveIndex({ tops, scrollY, maxScroll, headerOffset: OFFSET });
}

test('resolveActiveIndex - line-based selection for reachable headings', () => {
  let tops = [200, 900, 1600];
  let maxScroll = 4000;

  assert.strictEqual(pick(tops, 0, maxScroll), -1, 'above the first heading nothing is active');
  assert.strictEqual(pick(tops, 200 - OFFSET, maxScroll), 0, 'first heading activates at the reading line');
  assert.strictEqual(pick(tops, 1000, maxScroll), 1);
  assert.strictEqual(pick(tops, 2000, maxScroll), 2);
});

test('resolveActiveIndex - empty outline and unscrollable page', () => {
  assert.strictEqual(pick([], 0, 4000), -1);
  assert.strictEqual(pick([80, 300], 0, 0), 0, 'no scroll range falls back to the plain line pick');
});

test('resolveActiveIndex - flush bottom activates the last heading', () => {
  let tops = [200, 900, 1600];
  assert.strictEqual(pick(tops, 4000, 4000), 2);
  assert.strictEqual(pick(tops, 3999, 4000), 2, 'within the 2px tolerance');
});

test('resolveActiveIndex - tail headings split the final stretch evenly', () => {
  // Last reachable heading activates at scrollY 1000 - OFFSET = 912.
  // Two tail headings can never cross the line (tops > maxScroll + offset).
  let tops = [200, 1000, 2390, 2450];
  let maxScroll = 2288;
  let base = 1000 - OFFSET;
  let step = (maxScroll - base) / 3;

  assert.strictEqual(pick(tops, base, maxScroll), 1, 'segment 0 keeps the last reachable heading');
  assert.strictEqual(pick(tops, Math.ceil(base + step), maxScroll), 2, 'segment 1 activates the first tail heading');
  assert.strictEqual(pick(tops, Math.ceil(base + 2 * step), maxScroll), 3, 'segment 2 activates the final heading');
  assert.strictEqual(pick(tops, maxScroll, maxScroll), 3, 'the edge stays on the final heading');
});

test('resolveActiveIndex - tail progression is monotonic toward the edge', () => {
  let tops = [200, 1000, 2200, 2300, 2400];
  let maxScroll = 2288;
  let previous = -1;
  for (let scrollY = 0; scrollY <= maxScroll; scrollY += 16) {
    let index = pick(tops, scrollY, maxScroll);
    assert.ok(index >= previous, `no backwards jump at ${scrollY}`);
    previous = index;
  }
  assert.strictEqual(previous, tops.length - 1, 'every heading becomes reachable');
});

test('resolveActiveIndex - fully unreachable outline distributes across the whole scroll', () => {
  // A short page whose headings all sit below the line's reach.
  let tops = [500, 600, 700];
  let maxScroll = 300;

  assert.strictEqual(pick(tops, 0, maxScroll), -1, 'top of page keeps nothing active');
  assert.strictEqual(pick(tops, 80, maxScroll), 0);
  assert.strictEqual(pick(tops, 160, maxScroll), 1);
  assert.strictEqual(pick(tops, 240, maxScroll), 2);
  assert.strictEqual(pick(tops, 300, maxScroll), 2);
});
