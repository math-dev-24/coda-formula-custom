/**
 * SidePanelManager - Adds an in-dialog splitter for the documentation panel.
 * The popup's configured proportion remains the initial value; user gestures
 * then adjust the current page session live.
 */

import { ensureEnhancementStyles } from './enhancement-styles.js';
import { sessionState } from './session-state.js';
import { clamp } from './utils.js';

const MIN_PANEL_PERCENT = 10;
const MAX_PANEL_PERCENT = 90;

export class SidePanelManager {
  constructor() {
    this.handles = new WeakMap();
  }

  attach(flexWrapper, mainChild, sideChild, dialogRoot, config) {
    if (!flexWrapper || !mainChild || !sideChild || !dialogRoot) return null;

    ensureEnhancementStyles();

    const position = config.documentationPosition || 'right';
    const axis = position === 'left' || position === 'right' ? 'horizontal' : 'vertical';
    const handle = this.createHandle(axis);

    mainChild.classList.add('cfw-panel-main');
    sideChild.classList.add('cfw-panel-side');
    sideChild.style.borderLeft = '';
    sideChild.style.borderRight = '';
    sideChild.style.borderTop = '';
    sideChild.style.borderBottom = '';

    if (position === 'left' || position === 'top') {
      flexWrapper.appendChild(sideChild);
      flexWrapper.appendChild(handle);
      flexWrapper.appendChild(mainChild);
    } else {
      flexWrapper.appendChild(mainChild);
      flexWrapper.appendChild(handle);
      flexWrapper.appendChild(sideChild);
    }

    this.applyPanelVisibility(mainChild, sideChild, position, config);
    this.bindHandle(handle, mainChild, sideChild, dialogRoot, position, config);
    return handle;
  }

  reset(target) {
    target.querySelectorAll('[data-coda-formula-panel-resize-handle="true"]').forEach(handle => {
      const state = this.handles.get(handle);
      if (state) {
        state.controller.abort();
        this.handles.delete(handle);
      }
      handle.remove();
    });
  }

  createHandle(axis) {
    const handle = document.createElement('div');
    handle.dataset.codaFormulaPanelResizeHandle = 'true';
    handle.classList.add(
      'cfw-panel-handle',
      axis === 'horizontal' ? 'cfw-panel-handle-horizontal' : 'cfw-panel-handle-vertical'
    );
    handle.title = 'Resize or hide documentation panel';

    const dots = document.createElement('div');
    dots.classList.add('cfw-panel-handle-dots');
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.classList.add('cfw-panel-handle-dot');
      dots.appendChild(dot);
    }
    handle.appendChild(dots);

    return handle;
  }

  getPanelPercent(config) {
    const fallback = 100 - (config.editorProportion || 66);
    const rawValue = sessionState.panelWidthPercent ?? fallback;
    return clamp(Number(rawValue) || fallback, MIN_PANEL_PERCENT, MAX_PANEL_PERCENT);
  }

  applyPanelSize(mainChild, sideChild, position, panelPercent) {
    const size = clamp(panelPercent, MIN_PANEL_PERCENT, MAX_PANEL_PERCENT);
    sessionState.panelWidthPercent = size;

    mainChild.style.flex = `0 1 ${100 - size}%`;
    sideChild.style.flex = `0 0 ${size}%`;

    if (position === 'left' || position === 'right') {
      mainChild.style.width = '';
      sideChild.style.width = '';
    } else {
      mainChild.style.height = '';
      sideChild.style.height = '';
    }
  }

  applyPanelVisibility(mainChild, sideChild, position, config) {
    if (sessionState.panelHidden) {
      sideChild.style.display = 'none';
      mainChild.style.flex = '1 1 100%';
      return;
    }

    sideChild.style.display = '';
    this.applyPanelSize(mainChild, sideChild, position, this.getPanelPercent(config));
  }

  togglePanelVisibility(mainChild, sideChild, position, config) {
    sessionState.panelHidden = !sessionState.panelHidden;
    this.applyPanelVisibility(mainChild, sideChild, position, config);
  }

  bindHandle(handle, mainChild, sideChild, dialogRoot, position, config) {
    const controller = new AbortController();
    const state = { controller, resizeState: null };
    this.handles.set(handle, state);

    const isHorizontal = position === 'left' || position === 'right';

    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;

      const wrapperRect = handle.parentElement.getBoundingClientRect();
      const sideRect = sideChild.getBoundingClientRect();
      state.resizeState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        wrapperSize: isHorizontal ? wrapperRect.width : wrapperRect.height,
        sideSize: isHorizontal ? sideRect.width : sideRect.height,
        moved: false,
        previousBodyCursor: document.body.style.cursor,
        previousBodyUserSelect: document.body.style.userSelect,
      };

      handle.setPointerCapture(event.pointerId);
      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      event.preventDefault();
    }, { signal: controller.signal });

    handle.addEventListener('pointermove', event => {
      const resizeState = state.resizeState;
      if (!resizeState || event.pointerId !== resizeState.pointerId) return;

      const deltaX = event.clientX - resizeState.startX;
      const deltaY = event.clientY - resizeState.startY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        resizeState.moved = true;
      }
      if (!resizeState.moved || sessionState.panelHidden) return;

      const rawDelta = isHorizontal ? deltaX : deltaY;
      const signedDelta = position === 'right' || position === 'bottom' ? -rawDelta : rawDelta;
      const nextSize = resizeState.sideSize + signedDelta;
      const percent = clamp((nextSize / resizeState.wrapperSize) * 100, MIN_PANEL_PERCENT, MAX_PANEL_PERCENT);
      this.applyPanelSize(mainChild, sideChild, position, percent);
    }, { signal: controller.signal });

    const finishResize = event => {
      const resizeState = state.resizeState;
      if (!resizeState || event.pointerId !== resizeState.pointerId) return;

      this.cleanupPointer(handle, resizeState);
      if (!resizeState.moved) {
        this.togglePanelVisibility(mainChild, sideChild, position, config);
      }
      state.resizeState = null;
    };

    handle.addEventListener('pointerup', finishResize, { signal: controller.signal });
    handle.addEventListener('pointercancel', finishResize, { signal: controller.signal });
    window.addEventListener('blur', () => {
      if (!state.resizeState) return;
      this.cleanupPointer(handle, state.resizeState);
      state.resizeState = null;
    }, { signal: controller.signal });

    this.bindModifierToggle(mainChild, sideChild, dialogRoot, position, config, controller);
  }

  cleanupPointer(handle, resizeState) {
    if (handle.hasPointerCapture(resizeState.pointerId)) {
      handle.releasePointerCapture(resizeState.pointerId);
    }
    document.body.style.cursor = resizeState.previousBodyCursor;
    document.body.style.userSelect = resizeState.previousBodyUserSelect;
  }

  bindModifierToggle(mainChild, sideChild, dialogRoot, position, config, controller) {
    let lastModifierPress = { key: null, time: 0 };

    window.addEventListener('keydown', event => {
      if (!dialogRoot.isConnected) {
        controller.abort();
        return;
      }
      if (event.repeat || (event.key !== 'Meta' && event.key !== 'Control')) return;

      const now = Date.now();
      if (lastModifierPress.key === event.key && now - lastModifierPress.time <= 450) {
        event.preventDefault();
        event.stopPropagation();
        this.togglePanelVisibility(mainChild, sideChild, position, config);
        lastModifierPress = { key: null, time: 0 };
        return;
      }

      lastModifierPress = { key: event.key, time: now };
    }, { capture: true, signal: controller.signal });
  }
}
