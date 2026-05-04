import test from 'node:test';
import assert from 'node:assert/strict';

import { DialogInteractionManager } from '../src/content/dialog-interaction-manager.js';

function fakeDialog(rect) {
  return { getBoundingClientRect: () => rect };
}

function withWindow(viewport, run) {
  const previous = globalThis.window;
  globalThis.window = { innerWidth: viewport.width, innerHeight: viewport.height };
  try {
    run();
  } finally {
    globalThis.window = previous;
  }
}

test('persistRectToConfig converts a centered rect into a 50/50 anchor', () => {
  const calls = [];
  const manager = new DialogInteractionManager(partial => calls.push(partial));

  withWindow({ width: 1000, height: 800 }, () => {
    manager.persistRectToConfig(fakeDialog({ left: 100, top: 80, width: 800, height: 640 }));
  });

  assert.deepEqual(calls, [{ modalWidth: 80, modalHeight: 80, modalLeft: 50, modalTop: 50 }]);
});

test('persistRectToConfig maps a flush-corner rect to anchor 0', () => {
  const calls = [];
  const manager = new DialogInteractionManager(partial => calls.push(partial));

  withWindow({ width: 1000, height: 800 }, () => {
    manager.persistRectToConfig(fakeDialog({ left: 0, top: 0, width: 600, height: 400 }));
  });

  assert.deepEqual(calls, [{ modalWidth: 60, modalHeight: 50, modalLeft: 0, modalTop: 0 }]);
});

test('persistRectToConfig clamps the modal size to the validator bounds', () => {
  const calls = [];
  const manager = new DialogInteractionManager(partial => calls.push(partial));

  withWindow({ width: 1000, height: 800 }, () => {
    manager.persistRectToConfig(fakeDialog({ left: 0, top: 0, width: 1000, height: 800 }));
  });

  assert.equal(calls[0].modalWidth, 98);
  assert.equal(calls[0].modalHeight, 98);
});

test('persistRectToConfig ignores a degenerate rect', () => {
  const calls = [];
  const manager = new DialogInteractionManager(partial => calls.push(partial));

  withWindow({ width: 1000, height: 800 }, () => {
    manager.persistRectToConfig(fakeDialog({ left: 0, top: 0, width: 0, height: 0 }));
  });

  assert.deepEqual(calls, []);
});

test('DialogInteractionManager constructed without a callback persists silently', () => {
  const manager = new DialogInteractionManager();

  withWindow({ width: 1000, height: 800 }, () => {
    assert.doesNotThrow(() => {
      manager.persistRectToConfig(fakeDialog({ left: 100, top: 100, width: 800, height: 600 }));
    });
  });
});
