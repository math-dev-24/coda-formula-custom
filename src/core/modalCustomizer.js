/**
 * Modal Customizer - Core logic for customizing Coda formula modal
 * Refactored from leftSide.js, rightSide.js, and sansSide.js
 * Following Single Responsibility and DRY principles
 */

/**
 * Main Modal Customizer Class
 */
export class ModalCustomizer {
  constructor(config) {
    this.config = config;
    this.processedDialogs = new WeakSet();
    this.observer = null;
  }

  /**
   * Initialize the customizer
   */
  init() {
    this.processDialogs();
    this.startObserver();
  }

  /**
   * Update configuration and reprocess dialogs
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = newConfig;
    // Clear processed dialogs to allow reprocessing
    this.processedDialogs = new WeakSet();
    // Reset all dialogs to initial state before reprocessing
    this.resetAllDialogs();
    this.processDialogs();
  }

  /**
   * Reset all dialogs to their initial state
   */
  resetAllDialogs() {
    const dialogs = document.querySelectorAll('div[data-coda-ui-id="dialog"][role="dialog"]');

    dialogs.forEach(dialog => {
      const formulaDiv = dialog.querySelector('div[data-coda-ui-id="formula-editor"]');
      if (!formulaDiv) return;

      const rootDiv = dialog.querySelector(':scope > div');
      if (!rootDiv) return;

      const target = this.getTargetContainer(rootDiv);
      if (!target) return;

      // Remove any flex wrapper we created
      const flexWrapper = target.querySelector(':scope > div[style*="display: flex"]');
      if (flexWrapper) {
        // Move children back to target
        while (flexWrapper.firstChild) {
          target.appendChild(flexWrapper.firstChild);
        }
        flexWrapper.remove();
      }

      // Reset all children visibility and styles
      const kids = Array.from(target.children);
      kids.forEach(child => {
        child.style.display = '';
        child.style.flex = '';
        child.style.overflow = '';
        child.style.height = '';
        child.style.borderLeft = '';
        child.style.borderRight = '';
        child.style.borderTop = '';
        child.style.borderBottom = '';
      });

      // Reset modal size to auto
      rootDiv.style.width = '';
      rootDiv.style.height = '';
      rootDiv.style.maxWidth = '';
      rootDiv.style.maxHeight = '';
    });
  }

  /**
   * Process all formula dialogs
   */
  processDialogs() {
    const dialogs = document.querySelectorAll('div[data-coda-ui-id="dialog"][role="dialog"]');

    dialogs.forEach(dialog => {
      // Avoid reprocessing
      if (this.processedDialogs.has(dialog)) return;

      // Only work with formula editor dialogs
      const formulaDiv = dialog.querySelector('div[data-coda-ui-id="formula-editor"]');
      if (!formulaDiv) return;

      // Mark as processed
      this.processedDialogs.add(dialog);

      // Apply customization
      this.customizeDialog(dialog, formulaDiv);
    });
  }

  /**
   * Customize a single dialog
   * @param {HTMLElement} dialog - Dialog element
   * @param {HTMLElement} formulaDiv - Formula editor element
   */
  customizeDialog(dialog, formulaDiv) {
    const rootDiv = dialog.querySelector(':scope > div');
    if (!rootDiv) return;

    // Apply modal size
    this.applyModalSize(rootDiv);

    // Get the target container
    const target = this.getTargetContainer(rootDiv);
    if (!target) return;

    // Reset height
    target.style.height = "auto";

    const kids = Array.from(target.children);
    if (kids.length < 2) return;

    // Apply documentation settings
    if (!this.config.showDocumentation) {
      this.hideDocumentation(target, kids);
    } else {
      this.showDocumentation(target, kids, formulaDiv);
    }
  }

  /**
   * Apply modal size based on config
   * @param {HTMLElement} rootDiv - Root div of dialog
   */
  applyModalSize(rootDiv) {
    const { modalWidth, modalHeight } = this.config;

    rootDiv.style.width = `${modalWidth}%`;
    rootDiv.style.height = `${modalHeight}%`;
    rootDiv.style.maxWidth = `${modalWidth}%`;
    rootDiv.style.maxHeight = `${modalHeight}%`;
  }

  /**
   * Get target container element
   * @param {HTMLElement} rootDiv - Root div
   * @returns {HTMLElement|null} Target container
   */
  getTargetContainer(rootDiv) {
    try {
      return rootDiv.querySelector(':scope > div > div:nth-child(3) > div:last-child > div:last-child');
    } catch (e) {
      // Fallback for older browsers
      const firstLevelDiv = rootDiv.querySelector('div');
      if (!firstLevelDiv) return null;

      const secondLevelDivs = firstLevelDiv.children;
      if (!secondLevelDivs || secondLevelDivs.length < 3) return null;

      const thirdDiv = secondLevelDivs[2];
      const lastChild1 = thirdDiv?.lastElementChild;
      return lastChild1?.lastElementChild || null;
    }
  }

  /**
   * Hide documentation panel
   * @param {HTMLElement} target - Target container
   * @param {Array} kids - Children elements
   */
  hideDocumentation(target, kids) {
    kids.forEach((child, index) => {
      if (index > 0) {
        child.style.display = "none";
      }
    });
  }

  /**
   * Show documentation with specified position
   * @param {HTMLElement} target - Target container
   * @param {Array} kids - Children elements
   * @param {HTMLElement} formulaDiv - Formula editor element
   */
  showDocumentation(target, kids, formulaDiv) {
    const mainChild = formulaDiv;
    const sideChild = kids[kids.length - 1];

    // Hide intermediate children
    if (kids.length > 2) {
      for (let i = 1; i < kids.length - 1; i++) {
        kids[i].style.display = "none";
      }
    }

    // Make sure side child is visible
    sideChild.style.display = "";
    sideChild.style.height = "100%";

    // Create layout based on position
    const position = this.config.documentationPosition;

    if (position === 'left' || position === 'right') {
      this.createHorizontalLayout(target, mainChild, sideChild, position);
    } else if (position === 'top' || position === 'bottom') {
      this.createVerticalLayout(target, mainChild, sideChild, position);
    }

    // Adjust side child layout
    this.adjustSideChildLayout(sideChild);
    this.observeSideChild(sideChild);
  }

  /**
   * Create horizontal layout (left/right)
   * @param {HTMLElement} target - Target container
   * @param {HTMLElement} mainChild - Main editor element
   * @param {HTMLElement} sideChild - Documentation element
   * @param {string} position - 'left' or 'right'
   */
  createHorizontalLayout(target, mainChild, sideChild, position) {
    const flexWrapper = document.createElement("div");
    flexWrapper.style.display = "flex";
    flexWrapper.style.flexDirection = "row";
    flexWrapper.style.width = "100%";
    flexWrapper.style.height = "100%";
    flexWrapper.style.boxSizing = "border-box";
    flexWrapper.style.gap = "0px";

    // Add border based on position
    if (position === 'left') {
      sideChild.style.borderRight = "1px solid rgb(240, 240, 240)";
      sideChild.style.borderLeft = "none";
    } else {
      sideChild.style.borderLeft = "1px solid rgb(240, 240, 240)";
      sideChild.style.borderRight = "none";
    }

    // Insert wrapper and append children
    mainChild.parentElement.insertBefore(flexWrapper, mainChild);

    if (position === 'left') {
      flexWrapper.appendChild(sideChild);
      flexWrapper.appendChild(mainChild);
    } else {
      flexWrapper.appendChild(mainChild);
      flexWrapper.appendChild(sideChild);
    }

    // Apply proportions
    const editorFlex = this.config.editorProportion;
    const docFlex = this.config.documentationProportion;

    mainChild.style.flex = `${editorFlex} 1 0`;
    sideChild.style.flex = `${docFlex} 1 0`;
    sideChild.style.overflow = "auto";
  }

  /**
   * Create vertical layout (top/bottom)
   * @param {HTMLElement} target - Target container
   * @param {HTMLElement} mainChild - Main editor element
   * @param {HTMLElement} sideChild - Documentation element
   * @param {string} position - 'top' or 'bottom'
   */
  createVerticalLayout(target, mainChild, sideChild, position) {
    const flexWrapper = document.createElement("div");
    flexWrapper.style.display = "flex";
    flexWrapper.style.flexDirection = "column";
    flexWrapper.style.width = "100%";
    flexWrapper.style.height = "100%";
    flexWrapper.style.boxSizing = "border-box";
    flexWrapper.style.gap = "0px";

    // Add border based on position
    if (position === 'top') {
      sideChild.style.borderBottom = "1px solid rgb(240, 240, 240)";
      sideChild.style.borderTop = "none";
    } else {
      sideChild.style.borderTop = "1px solid rgb(240, 240, 240)";
      sideChild.style.borderBottom = "none";
    }

    // Insert wrapper and append children
    mainChild.parentElement.insertBefore(flexWrapper, mainChild);

    if (position === 'top') {
      flexWrapper.appendChild(sideChild);
      flexWrapper.appendChild(mainChild);
    } else {
      flexWrapper.appendChild(mainChild);
      flexWrapper.appendChild(sideChild);
    }

    // Apply proportions
    const editorFlex = this.config.editorProportion;
    const docFlex = this.config.documentationProportion;

    mainChild.style.flex = `${editorFlex} 1 0`;
    sideChild.style.flex = `${docFlex} 1 0`;
    sideChild.style.overflow = "auto";
  }

  /**
   * Adjust side child layout for proper display
   * @param {HTMLElement} sideRoot - Side panel element
   */
  adjustSideChildLayout(sideRoot) {
    if (!sideRoot) return;

    // Unset max-height for all descendants
    const allDescendants = sideRoot.querySelectorAll('*');
    allDescendants.forEach(el => {
      const computed = window.getComputedStyle(el);
      if (computed.maxHeight && computed.maxHeight !== 'none') {
        el.style.maxHeight = 'none';
      }
    });

    // Make result list items fill the container
    const resultItems = sideRoot.querySelectorAll('[data-coda-ui-id="result-list-item"]');
    resultItems.forEach(item => {
      const parent = item.parentElement;
      const grandparent = parent?.parentElement?.parentElement;
      if (grandparent) {
        grandparent.style.height = '100%';
      }
    });
  }

  /**
   * Observe side child for changes
   * @param {HTMLElement} sideChild - Side panel element
   */
  observeSideChild(sideChild) {
    const sideObserver = new MutationObserver(() => {
      this.adjustSideChildLayout(sideChild);
    });

    sideObserver.observe(sideChild, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }

  /**
   * Start observing DOM for new dialogs
   */
  startObserver() {
    if (!document.body) return;

    this.observer = new MutationObserver(() => {
      this.processDialogs();
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Stop observing DOM
   */
  stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/**
 * Initialize customizer with configuration
 * @param {Object} config - Configuration object
 * @returns {ModalCustomizer} Customizer instance
 */
export function initializeCustomizer(config) {
  const customizer = new ModalCustomizer(config);

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => {
      customizer.init();
    });
  } else {
    customizer.init();
  }

  return customizer;
}
