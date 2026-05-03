import test from 'node:test';
import assert from 'node:assert/strict';

import { clamp, isInteractiveElement, px } from '../src/content/utils.js';

test('clamp limits values to the provided bounds', () => {
  assert.equal(clamp(5, 10, 20), 10);
  assert.equal(clamp(25, 10, 20), 20);
  assert.equal(clamp(15, 10, 20), 15);
});

test('px rounds pixel values and appends the unit', () => {
  assert.equal(px(12.2), '12px');
  assert.equal(px(12.8), '13px');
});

test('isInteractiveElement safely handles missing elements', () => {
  assert.equal(isInteractiveElement(null), false);
  assert.equal(isInteractiveElement({}), false);
});

test('isInteractiveElement delegates to closest for supported elements', () => {
  const buttonLike = {
    closest(selector) {
      assert.match(selector, /button/);
      return {};
    },
  };
  const plainElement = {
    closest() {
      return null;
    },
  };

  assert.equal(isInteractiveElement(buttonLike), true);
  assert.equal(isInteractiveElement(plainElement), false);
});
