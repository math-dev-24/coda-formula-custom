/**
 * DialogInteractionManager - Adds direct interactions to the Coda formula modal.
 * Supports drag, native resize, maximize/restore, outside-click dimming and
 * pass-through wheel scrolling while dimmed.
 */

import { ensureEnhancementStyles } from './enhancement-styles.js';
import { sessionState } from './session-state.js';
import { clamp, isInteractiveElement, px } from './utils.js';

const VIEWPORT_MARGIN = 8;
const MIN_WIDTH = 480;
const MIN_HEIGHT = 320;

export class DialogInteractionManager {
  constructor() {
    this.enhancements = new WeakMap();
  }

  enhance(dialog, dialogRoot) {
    if (!dialog || !dialogRoot || this.enhancements.has(dialogRoot)) return;

    ensureEnhancementStyles();
    this.fixCloseButton(dialogRoot);

    const controller = new AbortController();
    const state = {
      controller,
      resizeObserver: null,
      dragState: null,
      dimmed: false,
      relayingWheel: false,
    };

    this.enhancements.set(dialogRoot, state);
    this.initializeWindowRect(dialogRoot);
    this.bindDimming(dialog, dialogRoot, state);
    this.bindDragAndResize(dialogRoot, state);
  }

  reset(dialogRoot) {
    const state = this.enhancements.get(dialogRoot);
    if (!state) return;

    state.controller.abort();
    if (state.resizeObserver) state.resizeObserver.disconnect();
    dialogRoot.classList.remove('cfw-dialog-root', 'cfw-dialog-dimmed');
    dialogRoot.style.cursor = '';
    this.enhancements.delete(dialogRoot);
  }

  fixCloseButton(dialogRoot) {
    const closeButton = dialogRoot.querySelector('[data-coda-ui-id="closeButton"]');
    if (!closeButton?.parentElement) return;
    closeButton.parentElement.style.top = '15px';
    closeButton.parentElement.style.right = '15px';
  }

  initializeWindowRect(dialogRoot) {
    requestAnimationFrame(() => {
      if (!this.enhancements.has(dialogRoot)) return;
      if (!dialogRoot.isConnected) return;

      const rect = dialogRoot.getBoundingClientRect();
      const savedRect = sessionState.dialogRect;
      const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - VIEWPORT_MARGIN * 2);
      const width = clamp(savedRect ? savedRect.width : rect.width, MIN_WIDTH, maxWidth);
      const height = clamp(savedRect ? savedRect.height : rect.height, MIN_HEIGHT, maxHeight);
      const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
      const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);

      dialogRoot.classList.add('cfw-dialog-root');
      dialogRoot.style.left = px(clamp(savedRect ? savedRect.left : rect.left, VIEWPORT_MARGIN, maxLeft));
      dialogRoot.style.top = px(clamp(savedRect ? savedRect.top : rect.top, VIEWPORT_MARGIN, maxTop));
      dialogRoot.style.width = px(width);
      dialogRoot.style.height = px(height);
      this.keepDialogInViewport(dialogRoot);
      this.rememberDialogRect(dialogRoot);
    });
  }

  keepDialogInViewport(dialogRoot) {
    const rect = dialogRoot.getBoundingClientRect();
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.width - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - rect.height - VIEWPORT_MARGIN);

    dialogRoot.style.left = px(clamp(rect.left, VIEWPORT_MARGIN, maxLeft));
    dialogRoot.style.top = px(clamp(rect.top, VIEWPORT_MARGIN, maxTop));
  }

  rememberDialogRect(dialogRoot) {
    const rect = dialogRoot.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    sessionState.dialogRect = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }

  getDialogHeaderHeight(rect) {
    return Math.min(56, Math.max(36, rect.height * 0.12));
  }

  isInDialogHeader(event, rect) {
    return event.clientY <= rect.top + this.getDialogHeaderHeight(rect);
  }

  getMaximizedDialogRect() {
    return {
      left: VIEWPORT_MARGIN,
      top: VIEWPORT_MARGIN,
      width: Math.max(MIN_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2),
      height: Math.max(MIN_HEIGHT, window.innerHeight - VIEWPORT_MARGIN * 2),
    };
  }

  applyDialogRect(dialogRoot, rect) {
    const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
    const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight - VIEWPORT_MARGIN * 2);
    const width = clamp(rect.width, MIN_WIDTH, maxWidth);
    const height = clamp(rect.height, MIN_HEIGHT, maxHeight);
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN);

    dialogRoot.style.left = px(clamp(rect.left, VIEWPORT_MARGIN, maxLeft));
    dialogRoot.style.top = px(clamp(rect.top, VIEWPORT_MARGIN, maxTop));
    dialogRoot.style.width = px(width);
    dialogRoot.style.height = px(height);
  }

  toggleDialogMaximized(dialogRoot) {
    if (sessionState.dialogMaximized && sessionState.dialogRestoreRect) {
      this.applyDialogRect(dialogRoot, sessionState.dialogRestoreRect);
      sessionState.dialogMaximized = false;
      sessionState.dialogRestoreRect = null;
      this.rememberDialogRect(dialogRoot);
      return;
    }

    this.rememberDialogRect(dialogRoot);
    sessionState.dialogRestoreRect = sessionState.dialogRect;
    sessionState.dialogMaximized = true;
    this.applyDialogRect(dialogRoot, this.getMaximizedDialogRect());
    this.rememberDialogRect(dialogRoot);
  }

  bindDimming(dialog, dialogRoot, state) {
    const setDimmed = nextDimmed => {
      state.dimmed = nextDimmed;
      dialogRoot.classList.toggle('cfw-dialog-dimmed', state.dimmed);
    };

    const stopOutsideEvent = event => {
      if (!dialog.isConnected || !dialogRoot.isConnected) {
        state.controller.abort();
        return;
      }

      if (dialogRoot.contains(event.target)) {
        if (state.dimmed) setDimmed(false);
        return;
      }

      if (sessionState.dialogGestureActive || Date.now() < sessionState.suppressOutsideDimUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      setDimmed(true);
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    const relayWheelToUnderlyingDocument = event => {
      if (state.relayingWheel || !state.dimmed || dialogRoot.contains(event.target)) return;

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();

      state.relayingWheel = true;
      const previousDialogPointerEvents = dialog.style.pointerEvents;
      const previousRootPointerEvents = dialogRoot.style.pointerEvents;

      try {
        dialog.style.pointerEvents = 'none';
        dialogRoot.style.pointerEvents = 'none';
        const underlyingTarget = document.elementFromPoint(event.clientX, event.clientY);
        dialog.style.pointerEvents = previousDialogPointerEvents;
        dialogRoot.style.pointerEvents = previousRootPointerEvents;

        if (underlyingTarget && !dialog.contains(underlyingTarget)) {
          const delta = this.getWheelPixelDelta(event);
          const scrollTarget = this.findScrollableAncestor(underlyingTarget, delta);

          scrollTarget.scrollBy({ left: delta.x, top: delta.y, behavior: 'auto' });
          underlyingTarget.dispatchEvent(new WheelEvent(event.type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            deltaX: event.deltaX,
            deltaY: event.deltaY,
            deltaZ: event.deltaZ,
            deltaMode: event.deltaMode,
            clientX: event.clientX,
            clientY: event.clientY,
            screenX: event.screenX,
            screenY: event.screenY,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey,
          }));
        }
      } finally {
        dialog.style.pointerEvents = previousDialogPointerEvents;
        dialogRoot.style.pointerEvents = previousRootPointerEvents;
        state.relayingWheel = false;
      }
    };

    const capture = { capture: true, signal: state.controller.signal };
    const wheelOptions = { capture: true, passive: false, signal: state.controller.signal };
    document.addEventListener('pointerdown', stopOutsideEvent, capture);
    document.addEventListener('mousedown', stopOutsideEvent, capture);
    document.addEventListener('mouseup', stopOutsideEvent, capture);
    document.addEventListener('click', stopOutsideEvent, capture);
    document.addEventListener('wheel', relayWheelToUnderlyingDocument, wheelOptions);
  }

  getWheelPixelDelta(event) {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      return { x: event.deltaX * 16, y: event.deltaY * 16 };
    }
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      return { x: event.deltaX * window.innerWidth, y: event.deltaY * window.innerHeight };
    }
    return { x: event.deltaX, y: event.deltaY };
  }

  findScrollableAncestor(element, delta) {
    let current = element;

    while (current && current !== document.body && current !== document.documentElement) {
      const style = window.getComputedStyle(current);
      const canScrollY =
        Math.abs(delta.y) > 0 &&
        /(auto|scroll)/.test(style.overflowY) &&
        current.scrollHeight > current.clientHeight;
      const canScrollX =
        Math.abs(delta.x) > 0 &&
        /(auto|scroll)/.test(style.overflowX) &&
        current.scrollWidth > current.clientWidth;

      if (canScrollY || canScrollX) return current;
      current = current.parentElement;
    }

    return document.scrollingElement || document.documentElement;
  }

  bindDragAndResize(dialogRoot, state) {
    const suppressDimAfterDialogGesture = () => {
      sessionState.dialogGestureActive = false;
      sessionState.suppressOutsideDimUntil = Date.now() + 500;
    };

    dialogRoot.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;

      const rect = dialogRoot.getBoundingClientRect();
      const resizeEdgeSize = 20;
      const isResizeCorner =
        event.clientX >= rect.right - resizeEdgeSize &&
        event.clientY >= rect.bottom - resizeEdgeSize;

      if (isResizeCorner) {
        sessionState.dialogGestureActive = true;
        window.addEventListener('pointerup', suppressDimAfterDialogGesture, {
          once: true,
          capture: true,
          signal: state.controller.signal,
        });
        window.addEventListener('pointercancel', suppressDimAfterDialogGesture, {
          once: true,
          capture: true,
          signal: state.controller.signal,
        });
        return;
      }

      if (isInteractiveElement(event.target)) return;
      if (!this.isInDialogHeader(event, rect)) return;

      state.dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startLeft: rect.left,
        startTop: rect.top,
        width: rect.width,
        height: rect.height,
      };

      dialogRoot.setPointerCapture(event.pointerId);
      dialogRoot.style.cursor = 'grabbing';
      sessionState.dialogGestureActive = true;
      event.preventDefault();
    }, { signal: state.controller.signal });

    dialogRoot.addEventListener('pointermove', event => {
      const dragState = state.dragState;
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - dragState.width - VIEWPORT_MARGIN);
      const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - dragState.height - VIEWPORT_MARGIN);

      dialogRoot.style.left = px(clamp(
        dragState.startLeft + event.clientX - dragState.startX,
        VIEWPORT_MARGIN,
        maxLeft
      ));
      dialogRoot.style.top = px(clamp(
        dragState.startTop + event.clientY - dragState.startY,
        VIEWPORT_MARGIN,
        maxTop
      ));
      this.rememberDialogRect(dialogRoot);
    }, { signal: state.controller.signal });

    const finishDrag = event => {
      const dragState = state.dragState;
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      if (dialogRoot.hasPointerCapture(event.pointerId)) {
        dialogRoot.releasePointerCapture(event.pointerId);
      }
      dialogRoot.style.cursor = '';
      this.rememberDialogRect(dialogRoot);
      suppressDimAfterDialogGesture();
      state.dragState = null;
    };

    dialogRoot.addEventListener('pointerup', finishDrag, { signal: state.controller.signal });
    dialogRoot.addEventListener('pointercancel', finishDrag, { signal: state.controller.signal });
    dialogRoot.addEventListener('dblclick', event => {
      if (isInteractiveElement(event.target)) return;

      const rect = dialogRoot.getBoundingClientRect();
      if (!this.isInDialogHeader(event, rect)) return;

      event.preventDefault();
      event.stopPropagation();
      this.toggleDialogMaximized(dialogRoot);
    }, { signal: state.controller.signal });

    window.addEventListener('resize', () => {
      if (sessionState.dialogMaximized) {
        this.applyDialogRect(dialogRoot, this.getMaximizedDialogRect());
      } else {
        this.keepDialogInViewport(dialogRoot);
      }
      this.rememberDialogRect(dialogRoot);
    }, { signal: state.controller.signal });

    state.resizeObserver = new ResizeObserver(() => {
      if (!dialogRoot.isConnected) {
        this.reset(dialogRoot);
        return;
      }
      if (state.dragState) return;
      this.keepDialogInViewport(dialogRoot);
      this.rememberDialogRect(dialogRoot);
      sessionState.suppressOutsideDimUntil = Date.now() + 500;
    });
    state.resizeObserver.observe(dialogRoot);
  }
}
