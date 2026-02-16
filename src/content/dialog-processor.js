/**
 * DialogProcessor - Orchestrates the customization of dialogs
 * Pattern Facade: coordinates StyleManager, LayoutManager, ModalSizeManager
 */

import { DOMSelector } from './dom-selector.js';
import { StyleManager } from './style-manager.js';
import { ModalSizeManager } from './modal-size-manager.js';
import { LayoutManager } from './layout-manager.js';

export class DialogProcessor {
  /**
   * @param {Object} config - Current configuration
   */
  constructor(config) {
    this.config = config;
    this.domSelector = new DOMSelector();
    this.styleManager = new StyleManager();
    this.modalSizeManager = new ModalSizeManager();
    this.layoutManager = new LayoutManager();
  }

  /**
   * Process a single dialog: apply size, styles and layout
   * @param {HTMLElement} dialog - The dialog element
   * @param {HTMLElement} formulaDiv - The formula editor element
   */
  processDialog(dialog, formulaDiv) {
    const rootDiv = this.domSelector.findRootDiv(dialog);
    if (!rootDiv) return;

    this.modalSizeManager.applySize(rootDiv, this.config);

    if (this.config.transparentBackground) {
      dialog.style.background = 'transparent';
    } else {
      dialog.style.background = '';
    }

    this.styleManager.applyEditorStyles(formulaDiv, this.config);

    const target = this.domSelector.findTargetContainer(rootDiv);
    if (!target) return;

    if (target.dataset.codaFormulaLayoutPatched === 'true') return;
    target.dataset.codaFormulaLayoutPatched = 'true';
    target.style.height = 'auto';

    const kids = Array.from(target.children);
    this.layoutManager.applyLayout(kids, formulaDiv, this.config);
  }

  /**
   * Apply only styles (font, theme, indent) without touching the layout.
   * Called on style-only config changes to avoid DOM breakage.
   * @param {HTMLElement} formulaDiv - The formula editor element
   * @param {Object} config - New configuration
   */
  applyStyles(formulaDiv, config) {
    this.styleManager.applyEditorStyles(formulaDiv, config);
  }

  /**
   * Reset a dialog to its original state
   * @param {HTMLElement} dialog - The dialog element
   */
  resetDialog(dialog) {
    delete dialog.dataset.codaFormulaDialogPatched;

    const rootDiv = this.domSelector.findRootDiv(dialog);
    if (!rootDiv) return;

    try {
      rootDiv.style.width = '';
      rootDiv.style.height = '';
      rootDiv.style.maxWidth = '';
      rootDiv.style.maxHeight = '';
      rootDiv.style.position = '';
      rootDiv.style.left = '';
      rootDiv.style.top = '';
      rootDiv.style.transform = '';

      dialog.style.background = '';

      const target = this.domSelector.findTargetContainer(rootDiv);
      if (target) {
        delete target.dataset.codaFormulaLayoutPatched;
        this.layoutManager.resetLayout(target);
      }
    } catch (e) {
      console.error('[Coda Formula Customizer] Error resetting dialog:', e);
    }
  }
}
