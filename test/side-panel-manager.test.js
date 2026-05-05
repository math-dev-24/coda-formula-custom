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

test('persistEditorProportion forwards the complementary editor share to onUserChange', () => {
  const calls = [];
  const manager = new SidePanelManager(partial => calls.push(partial));

  sessionState.panelWidthPercent = 25;
  manager.persistEditorProportion();
  assert.deepEqual(calls, [{ editorProportion: 75 }]);

  sessionState.panelWidthPercent = null;
});

test('persistEditorProportion clamps the editor share to the validator bounds', () => {
  const calls = [];
  const manager = new SidePanelManager(partial => calls.push(partial));

  sessionState.panelWidthPercent = 80;
  manager.persistEditorProportion();
  sessionState.panelWidthPercent = 5;
  manager.persistEditorProportion();

  assert.deepEqual(calls, [{ editorProportion: 30 }, { editorProportion: 80 }]);
  sessionState.panelWidthPercent = null;
});

test('persistEditorProportion is a no-op when no panel size has been recorded', () => {
  const calls = [];
  const manager = new SidePanelManager(partial => calls.push(partial));

  sessionState.panelWidthPercent = null;
  manager.persistEditorProportion();
  assert.deepEqual(calls, []);
});

test('applyPanelVisibility hides documentation from config without dropping sizing state', () => {
  const manager = new SidePanelManager();
  const handle = { style: {} };
  const mainChild = {
    style: {},
    parentElement: {
      querySelector() {
        return handle;
      },
    },
  };
  const sideChild = { style: {} };

  sessionState.panelHidden = false;
  sessionState.panelWidthPercent = 25;
  manager.applyPanelVisibility(mainChild, sideChild, 'right', {
    showDocumentation: false,
    documentationPosition: 'right',
    editorProportion: 75,
  });

  assert.equal(sideChild.style.display, 'none');
  assert.equal(mainChild.style.flex, '1 1 100%');
  assert.equal(sideChild.style.flex, '0 0 0');
  assert.equal(sideChild.style.width, '0px');
  assert.equal(sideChild.style.maxWidth, '0px');
  assert.equal(handle.style.display, 'none');
  assert.equal(handle.style.flex, '0 0 0');
  assert.equal(sessionState.panelWidthPercent, 25);

  manager.applyPanelVisibility(mainChild, sideChild, 'right', {
    showDocumentation: true,
    documentationPosition: 'right',
    editorProportion: 75,
  });

  assert.equal(sideChild.style.display, '');
  assert.equal(sideChild.style.width, '');
  assert.equal(sideChild.style.maxWidth, '');
  assert.equal(handle.style.display, '');
  assert.equal(handle.style.flex, '');
  assert.equal(mainChild.style.flex, '0 1 75%');
  assert.equal(sideChild.style.flex, '0 0 25%');
  sessionState.panelWidthPercent = null;
});
