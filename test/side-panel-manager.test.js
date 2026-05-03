import test from 'node:test';
import assert from 'node:assert/strict';

import { SidePanelManager } from '../src/content/side-panel-manager.js';
import { sessionState } from '../src/content/session-state.js';

test('getPanelPercent uses the popup editor proportion as the default panel size', () => {
  const manager = new SidePanelManager();
  sessionState.panelWidthPercent = null;

  assert.equal(manager.getPanelPercent({ editorProportion: 70 }), 30);
});

test('getPanelPercent clamps remembered session values', () => {
  const manager = new SidePanelManager();

  sessionState.panelWidthPercent = 2;
  assert.equal(manager.getPanelPercent({ editorProportion: 70 }), 10);

  sessionState.panelWidthPercent = 95;
  assert.equal(manager.getPanelPercent({ editorProportion: 70 }), 90);

  sessionState.panelWidthPercent = null;
});
