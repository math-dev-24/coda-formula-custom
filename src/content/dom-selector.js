/**
 * DOMSelector - Handles DOM queries and element finding
 * Single Responsibility: DOM element selection
 */

export class DOMSelector {
  /** Find all formula editor dialogs */
  findDialogs() {
    return document.querySelectorAll('div[data-coda-ui-id="dialog"][role="dialog"]');
  }

  /** Find formula editor inside a dialog */
  findFormulaEditor(dialog) {
    return dialog.querySelector('div[data-coda-ui-id="formula-editor"]');
  }

  /** Find root div of dialog */
  findRootDiv(dialog) {
    return dialog.querySelector(':scope > div');
  }

  /**
   * Find target container for layout manipulation
   * @param {HTMLElement} rootDiv - Root div of the dialog
   * @returns {HTMLElement|null}
   */
  findTargetContainer(rootDiv) {
    let target = rootDiv.querySelector('[data-coda-formula-target="true"]');
    if (!target) {
      try {
        target = rootDiv.querySelector(':scope > div:nth-child(3) > div:last-child > div:last-child');
        if (target) target.dataset.codaFormulaTarget = 'true';
      } catch (e) {
        target = this.findTargetContainerFallback(rootDiv);
        if (target) target.dataset.codaFormulaTarget = 'true';
      }
    }
    return target;
  }

  /**
   * Fallback method for finding target container
   * @param {HTMLElement} rootDiv - Root div of the dialog
   * @returns {HTMLElement|null}
   */
  findTargetContainerFallback(rootDiv) {
    const firstLevelDiv = rootDiv.querySelector('div');
    if (!firstLevelDiv) return null;
    const children = firstLevelDiv.children;
    if (!children || children.length < 3) return null;
    const thirdDiv = children[2];
    const lastChild1 = thirdDiv?.lastElementChild;
    return lastChild1?.lastElementChild || null;
  }
}
