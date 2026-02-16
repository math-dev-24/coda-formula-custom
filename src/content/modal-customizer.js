/**
 * ModalCustomizer - Main entry point for dialog customization
 * Pattern Observer: watches DOM for new formula dialogs
 */

import { DOMSelector } from './dom-selector.js';
import { DialogProcessor } from './dialog-processor.js';

export class ModalCustomizer {
  /**
   * @param {Object} config - Current configuration
   */
  constructor(config) {
    this.config = config;
    this.processedDialogs = new WeakSet();
    this.observer = null;
    this.domSelector = new DOMSelector();
    this.dialogProcessor = new DialogProcessor(config);
  }

  /** Initialize: process existing dialogs and start observing */
  init() {
    this.processDialogs();
    this.startObserver();
  }

  /**
   * Update configuration and selectively re-apply changes.
   * Style-only changes (font, theme, indent) skip the expensive DOM reset.
   * Layout changes (size, position, doc layout) do a full reset + reprocess.
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    const prev = this.config;
    this.config = newConfig;

    const layoutChanged =
      prev.modalWidth !== newConfig.modalWidth ||
      prev.modalHeight !== newConfig.modalHeight ||
      prev.modalLeft !== newConfig.modalLeft ||
      prev.modalTop !== newConfig.modalTop ||
      prev.transparentBackground !== newConfig.transparentBackground ||
      prev.showDocumentation !== newConfig.showDocumentation ||
      prev.documentationPosition !== newConfig.documentationPosition ||
      prev.editorProportion !== newConfig.editorProportion;

    if (layoutChanged) {
      this.dialogProcessor = new DialogProcessor(newConfig);
      this.domSelector.findDialogs().forEach(dialog => {
        this.dialogProcessor.resetDialog(dialog);
      });
      this.processedDialogs = new WeakSet();
      this.processDialogs();
    } else {
      // Style-only update: re-apply styles without touching the DOM layout
      this.dialogProcessor.config = newConfig;
      this.domSelector.findDialogs().forEach(dialog => {
        const formulaDiv = this.domSelector.findFormulaEditor(dialog);
        if (formulaDiv) {
          this.dialogProcessor.applyStyles(formulaDiv, newConfig);
        }
      });
    }
  }

  /** Process all formula dialogs in the DOM */
  processDialogs() {
    this.domSelector.findDialogs().forEach(dialog => {
      if (this.processedDialogs.has(dialog)) return;

      const formulaDiv = this.domSelector.findFormulaEditor(dialog);
      if (!formulaDiv) return;

      this.processedDialogs.add(dialog);
      this.dialogProcessor.processDialog(dialog, formulaDiv);
    });
  }

  /** Start observing DOM for new dialogs */
  startObserver() {
    if (!document.body) return;
    this.observer = new MutationObserver(() => this.processDialogs());
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  /** Stop observing DOM */
  stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
