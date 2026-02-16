/**
 * LayoutManager - Handles documentation layout and positioning
 * Single Responsibility: Layout and flex arrangement
 */

import { StyleManager } from './style-manager.js';

const BORDER_COLOR = '1px solid rgb(240, 240, 240)';

export class LayoutManager {
  constructor() {
    this.styleManager = new StyleManager();
  }

  /**
   * Apply layout based on documentation visibility
   * @param {HTMLElement[]} kids - Child elements of the target container
   * @param {HTMLElement} formulaDiv - The formula editor element
   * @param {Object} config - Current configuration
   */
  applyLayout(kids, formulaDiv, config) {
    if (kids.length < 2) return;
    if (!config.showDocumentation) {
      this.hideDocumentation(kids);
    } else {
      this.showDocumentation(kids, formulaDiv, config);
    }
  }

  /**
   * Hide documentation panel (keep only formula editor visible)
   * @param {HTMLElement[]} kids - Child elements
   */
  hideDocumentation(kids) {
    kids.forEach(child => {
      const isFormulaEditor =
        child.querySelector('[data-coda-ui-id="formula-editor"]') ||
        child.dataset.codaUiId === 'formula-editor';
      if (!isFormulaEditor) child.style.display = 'none';
    });
  }

  /**
   * Show documentation with proper layout
   * @param {HTMLElement[]} kids - Child elements
   * @param {HTMLElement} formulaDiv - The formula editor element
   * @param {Object} config - Current configuration
   */
  showDocumentation(kids, formulaDiv, config) {
    if (kids.length < 2) return;
    const mainChild = formulaDiv;
    const sideChild = kids[kids.length - 1];

    this.createFlexWrapper(kids, mainChild, sideChild, config);
    this.adjustSideChildLayout(sideChild);
    this.observeSideChild(sideChild);
  }

  /**
   * Create new flex wrapper to arrange editor and documentation
   * @param {HTMLElement[]} kids - Child elements
   * @param {HTMLElement} mainChild - Editor element
   * @param {HTMLElement} sideChild - Documentation element
   * @param {Object} config - Current configuration
   */
  createFlexWrapper(kids, mainChild, sideChild, config) {
    if (kids.length > 2) {
      for (let i = 1; i < kids.length - 1; i++) {
        kids[i].style.display = 'none';
      }
    }

    sideChild.style.display = '';
    sideChild.style.height = '100%';

    const flexWrapper = document.createElement('div');
    flexWrapper.style.display = 'flex';
    flexWrapper.style.width = '100%';
    flexWrapper.style.height = '100%';
    flexWrapper.style.boxSizing = 'border-box';
    flexWrapper.style.gap = '0px';

    const position = config.documentationPosition;

    if (position === 'left' || position === 'right') {
      flexWrapper.style.flexDirection = 'row';
      if (position === 'left') {
        sideChild.style.borderRight = BORDER_COLOR;
        sideChild.style.borderLeft = 'none';
        mainChild.parentElement.insertBefore(flexWrapper, mainChild);
        flexWrapper.appendChild(sideChild);
        flexWrapper.appendChild(mainChild);
      } else {
        sideChild.style.borderLeft = BORDER_COLOR;
        sideChild.style.borderRight = 'none';
        mainChild.parentElement.insertBefore(flexWrapper, mainChild);
        flexWrapper.appendChild(mainChild);
        flexWrapper.appendChild(sideChild);
      }
    } else {
      flexWrapper.style.flexDirection = 'column';
      if (position === 'top') {
        sideChild.style.borderBottom = BORDER_COLOR;
        sideChild.style.borderTop = 'none';
        mainChild.parentElement.insertBefore(flexWrapper, mainChild);
        flexWrapper.appendChild(sideChild);
        flexWrapper.appendChild(mainChild);
      } else {
        sideChild.style.borderTop = BORDER_COLOR;
        sideChild.style.borderBottom = 'none';
        mainChild.parentElement.insertBefore(flexWrapper, mainChild);
        flexWrapper.appendChild(mainChild);
        flexWrapper.appendChild(sideChild);
      }
    }

    const editorProp = config.editorProportion || 66;
    const docProp = 100 - editorProp;
    mainChild.style.flex = `${editorProp} 1 0%`;
    sideChild.style.flex = `${docProp} 1 0%`;
    sideChild.style.overflow = 'auto';
  }

  /**
   * Adjust side child layout to remove max-height constraints
   * @param {HTMLElement} sideRoot - Documentation root element
   */
  adjustSideChildLayout(sideRoot) {
    if (!sideRoot) return;
    sideRoot.querySelectorAll('*').forEach(el => {
      const computed = window.getComputedStyle(el);
      if (computed.maxHeight && computed.maxHeight !== 'none') {
        el.style.maxHeight = 'none';
      }
    });
    sideRoot.querySelectorAll('[data-coda-ui-id="result-list-item"]').forEach(item => {
      const grandparent = item.parentElement?.parentElement?.parentElement;
      if (grandparent) grandparent.style.height = '100%';
    });
  }

  /**
   * Observe side child for DOM changes
   * @param {HTMLElement} sideChild - Documentation element
   */
  observeSideChild(sideChild) {
    const observer = new MutationObserver(() => this.adjustSideChildLayout(sideChild));
    observer.observe(sideChild, { childList: true, subtree: true, attributes: true });
  }

  /**
   * Reset layout - remove flex wrappers and restore original state
   * @param {HTMLElement} target - Target container
   */
  resetLayout(target) {
    Array.from(target.children).forEach(div => {
      const computed = getComputedStyle(div);
      const hasFlexDisplay = div.style.display === 'flex' || computed.display === 'flex';
      const hasFlexDir = div.style.flexDirection === 'row' || div.style.flexDirection === 'column'
        || computed.flexDirection === 'row' || computed.flexDirection === 'column';

      if (hasFlexDisplay && hasFlexDir && div.children.length > 0) {
        while (div.firstChild) target.appendChild(div.firstChild);
        div.remove();
      }
    });

    Array.from(target.children).forEach(child => this.styleManager.resetStyles(child));

    target.style.display = '';
    target.style.flexDirection = '';
    target.style.height = '';
  }
}
