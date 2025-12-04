/**
 * Coda Formula Customizer - Bundled Version
 * All code combined in one file for Chrome extension compatibility
 */

(function() {
  'use strict';

  // ========================================
  // Configuration & Defaults
  // ========================================

  const DEFAULT_CONFIG = {
    modalWidth: 95,
    modalHeight: 95,
    modalLeft: 50,
    modalTop: 50,
    showDocumentation: true,
    documentationPosition: 'right',
    editorProportion: 66,
    documentationProportion: 34,
    editorFontSize: 14, // Font size in pixels (10-24)
    editorLineHeight: 1.5, // Line height (1.0-2.5)
    editorFontFamily: 'monospace', // Font family: monospace, fira-code, jetbrains-mono, source-code-pro, opendyslexic
    editorTheme: 'light', // Editor theme: light, dark, sepia, high-contrast, protanopia, deuteranopia, tritanopia
    showIndentGuides: true, // Show indent guide lines
    indentGuideStyle: 'dotted', // Style: solid, dotted, dashed
    highlightActiveIndent: true, // Highlight current indent scope
    presets: {
      default: { modalWidth: 80, modalHeight: 80, editorProportion: 66 },
      medium: { modalWidth: 90, modalHeight: 90, editorProportion: 60 },
      fullscreen: { modalWidth: 95, modalHeight: 95, editorProportion: 70 }
    }
  };

  function validateConfig(config) {
    if (!config) return false;
    if (config.modalWidth < 20 || config.modalWidth > 98) return false;
    if (config.modalHeight < 20 || config.modalHeight > 98) return false;
    if (config.modalLeft < 0 || config.modalLeft > 100) return false;
    if (config.modalTop < 0 || config.modalTop > 100) return false;
    const validPositions = ['left', 'right', 'top', 'bottom', 'none'];
    if (!validPositions.includes(config.documentationPosition)) return false;
    if (config.editorProportion < 30 || config.editorProportion > 80) return false;
    if (config.editorFontSize && (config.editorFontSize < 10 || config.editorFontSize > 24)) return false;
    if (config.editorLineHeight && (config.editorLineHeight < 1.0 || config.editorLineHeight > 2.5)) return false;
    const validFonts = ['monospace', 'fira-code', 'jetbrains-mono', 'source-code-pro', 'opendyslexic'];
    if (config.editorFontFamily && !validFonts.includes(config.editorFontFamily)) return false;
    const validThemes = ['light', 'dark', 'sepia', 'high-contrast', 'protanopia', 'deuteranopia', 'tritanopia'];
    if (config.editorTheme && !validThemes.includes(config.editorTheme)) return false;
    const validIndentStyles = ['solid', 'dotted', 'dashed'];
    if (config.indentGuideStyle && !validIndentStyles.includes(config.indentGuideStyle)) return false;
    return true;
  }

  function mergeConfig(userConfig) {
    return {
      ...DEFAULT_CONFIG,
      ...userConfig,
      documentationProportion: 100 - (userConfig.editorProportion || DEFAULT_CONFIG.editorProportion)
    };
  }

  // ========================================
  // Storage Manager
  // ========================================

  const STORAGE_KEY = 'codaFormulaConfig';

  class StorageManager {
    static async getConfig() {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const storedConfig = result[STORAGE_KEY];
        if (!storedConfig) {
          await this.saveConfig(DEFAULT_CONFIG);
          return DEFAULT_CONFIG;
        }
        return mergeConfig(storedConfig);
      } catch (error) {
        console.error('[Coda Extension] Error getting config:', error);
        return DEFAULT_CONFIG;
      }
    }

    static async saveConfig(config) {
      try {
        if (!validateConfig(config)) {
          console.error('[Coda Extension] Invalid configuration');
          return false;
        }
        const finalConfig = mergeConfig(config);
        await chrome.storage.local.set({ [STORAGE_KEY]: finalConfig });
        await this.notifyConfigChange(finalConfig);
        return true;
      } catch (error) {
        console.error('[Coda Extension] Error saving config:', error);
        return false;
      }
    }

    static async applyPreset(presetName) {
      try {
        const currentConfig = await this.getConfig();
        const preset = DEFAULT_CONFIG.presets[presetName];
        if (!preset) {
          console.error('[Coda Extension] Invalid preset name:', presetName);
          return false;
        }
        const newConfig = { ...currentConfig, ...preset };
        return await this.saveConfig(newConfig);
      } catch (error) {
        console.error('[Coda Extension] Error applying preset:', error);
        return false;
      }
    }

    static async resetToDefaults() {
      return await this.saveConfig(DEFAULT_CONFIG);
    }

    static async notifyConfigChange(config) {
      try {
        const tabs = await chrome.tabs.query({ url: '*://*.coda.io/d/*' });
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'CONFIG_UPDATE',
            config: config
          }).catch(() => {
            // Ignore errors for tabs that don't have content script loaded
          });
        }
      } catch (error) {
        console.error('[Coda Extension] Error notifying config change:', error);
      }
    }

    static onConfigChange(callback) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes[STORAGE_KEY]) {
          const newConfig = mergeConfig(changes[STORAGE_KEY].newValue);
          callback(newConfig);
        }
      });
    }
  }

  // ========================================
  // Style Management
  // ========================================

  /**
   * StyleManager - Handles all styling operations
   * Single Responsibility: Style application and CSS injection
   */
  class StyleManager {
    constructor() {
      this.fontMap = {
        'monospace': 'monospace',
        'fira-code': '"Fira Code", "Cascadia Code", monospace',
        'jetbrains-mono': '"JetBrains Mono", monospace',
        'source-code-pro': '"Source Code Pro", monospace',
        'opendyslexic': '"OpenDyslexic", "OpenDyslexic3", "Comic Sans MS", sans-serif'
      };
      this.styleElementId = 'coda-formula-editor-styles';
      this.indentGuideId = 'coda-indent-guides-styles';
      this.indentObserver = null;
    }

    /**
     * Apply all editor styles (font, theme, line numbers)
     */
    applyEditorStyles(formulaDiv, config) {
      if (!formulaDiv) return;

      this.injectGlobalStyles(config);
      this.applyInlineStyles(formulaDiv, config);
      this.applyToEditorElements(formulaDiv, config);
      this.applyTheme(formulaDiv, config);
      this.applyIndentGuides(config);
    }

    /**
     * Inject global CSS styles with high specificity
     */
    injectGlobalStyles(config) {
      const existingStyle = document.getElementById(this.styleElementId);
      if (existingStyle) {
        existingStyle.remove();
      }

      const styleEl = document.createElement('style');
      styleEl.id = this.styleElementId;

      const fontFamily = this.fontMap[config.editorFontFamily] || 'monospace';
      const fontSize = config.editorFontSize || 14;
      const lineHeight = config.editorLineHeight || 1.5;

      styleEl.textContent = `
        /* Coda Formula Editor Customization */
        [data-coda-ui-id="formula-editor"],
        [data-coda-ui-id="formula-editor"] *,
        [data-coda-ui-id="formula-editor"] .kr-slate-editor,
        [data-coda-ui-id="formula-editor"] .kr-line,
        [data-coda-ui-id="formula-editor"] .kr-span,
        [data-coda-ui-id="formula-editor"] .kr-paragraph,
        [data-coda-ui-id="formula-editor"] div[data-editable-id],
        [data-coda-ui-id="formula-editor"] span[class*="kr-"] {
          font-family: ${fontFamily} !important;
          font-size: ${fontSize}px !important;
          line-height: ${lineHeight} !important;
        }

        /* Ensure Coda objects inside editor don't break */
        [data-coda-ui-id="formula-editor"] .kr-object-e,
        [data-coda-ui-id="formula-editor"] .E8UyKa9Q,
        [data-coda-ui-id="formula-editor"] .n3CTm3JI {
          font-family: ${fontFamily} !important;
        }
      `;

      document.head.appendChild(styleEl);
    }

    /**
     * Apply inline styles to formula div
     */
    applyInlineStyles(formulaDiv, config) {
      const fontFamily = this.fontMap[config.editorFontFamily] || 'monospace';

      if (config.editorFontSize) {
        formulaDiv.style.setProperty('font-size', `${config.editorFontSize}px`, 'important');
      }

      if (config.editorLineHeight) {
        formulaDiv.style.setProperty('line-height', `${config.editorLineHeight}`, 'important');
      }

      if (config.editorFontFamily) {
        formulaDiv.style.setProperty('font-family', fontFamily, 'important');
      }
    }

    /**
     * Apply styles to all editor elements (Monaco/Slate)
     */
    applyToEditorElements(formulaDiv, config) {
      const fontFamily = this.fontMap[config.editorFontFamily] || 'monospace';
      const editorSelectors = [
        '.monaco-editor', '.view-lines', '.view-line', '.mtk1',
        '.monaco-editor .view-line span', '.monaco-editor-background',
        '.margin', '.line-numbers',
        '.kr-slate-editor', '.kr-line', '.kr-span', '.kr-paragraph',
        '.oxXY9v4G', 'div[data-editable-id]', 'span[class*="kr-"]'
      ];

      editorSelectors.forEach(selector => {
        const elements = formulaDiv.querySelectorAll(selector);
        elements.forEach(element => {
          if (config.editorFontSize) {
            element.style.setProperty('font-size', `${config.editorFontSize}px`, 'important');
          }
          if (config.editorLineHeight) {
            element.style.setProperty('line-height', `${config.editorLineHeight}`, 'important');
          }
          if (config.editorFontFamily) {
            element.style.setProperty('font-family', fontFamily, 'important');
          }
        });
      });
    }

    /**
     * Apply theme (background and text colors)
     */
    applyTheme(formulaDiv, config) {
      const themes = {
        light: { bg: '#ffffff', color: '#000000' },
        dark: { bg: '#1e1e1e', color: '#d4d4d4' },
        sepia: { bg: '#f4ecd8', color: '#5b4636' },
        'high-contrast': { bg: '#000000', color: '#ffffff' }, // High contrast: black & white
        protanopia: { bg: '#f5f5f0', color: '#005a9c' }, // Red-green colorblind (uses blue)
        deuteranopia: { bg: '#f0f0f5', color: '#8b4513' }, // Red-green colorblind (uses brown/blue)
        tritanopia: { bg: '#fff5f0', color: '#c41e3a' } // Blue-yellow colorblind (uses red)
      };

      const theme = themes[config.editorTheme] || themes.light;

      formulaDiv.style.setProperty('background-color', theme.bg, 'important');
      formulaDiv.style.setProperty('color', theme.color, 'important');

      // Apply to Monaco editor background
      const monacoBackground = formulaDiv.querySelector('.monaco-editor-background');
      if (monacoBackground) {
        monacoBackground.style.setProperty('background-color', theme.bg, 'important');
      }
    }

    /**
     * Apply indent guides with pastel rainbow colors
     */
    applyIndentGuides(config) {
      if (!config.showIndentGuides) {
        // Remove indent guides if disabled
        const existingStyle = document.getElementById(this.indentGuideId);
        if (existingStyle) {
          existingStyle.remove();
        }
        // Stop observing
        this.stopIndentObserver();
        // Remove data attributes
        const lines = document.querySelectorAll('[data-indent-level], [data-indent-guides]');
        lines.forEach(line => {
          line.removeAttribute('data-indent-level');
          line.removeAttribute('data-indent-guides');
        });
        return;
      }

      // Pastel rainbow colors for indent levels (darker versions)
      const pastelColors = [
        'rgba(255, 120, 130, 0.8)', // Darker pastel red
        'rgba(255, 180, 120, 0.8)', // Darker pastel orange
        'rgba(240, 220, 100, 0.8)', // Darker pastel yellow
        'rgba(120, 220, 150, 0.8)', // Darker pastel green
        'rgba(120, 180, 255, 0.8)', // Darker pastel blue
        'rgba(200, 140, 210, 0.8)', // Darker pastel purple
        'rgba(255, 150, 190, 0.8)', // Darker pastel pink
        'rgba(180, 130, 130, 0.8)'  // Darker pastel brown
      ];

      // Map style option to CSS border-style
      const styleMap = {
        solid: 'solid',
        dotted: 'dotted',
        dashed: 'dashed'
      };
      const borderStyle = styleMap[config.indentGuideStyle] || 'dotted';

      // Build CSS for indent guides
      let css = `
        /* Indent guides for Coda formula editor */
        .kr-slate-editor .kr-line,
        .kr-slate-editor .kr-paragraph {
          position: relative;
        }

        /* Base indent guide styling */
        .kr-slate-editor .kr-line[data-indent-guides]::before,
        .kr-slate-editor .kr-paragraph[data-indent-guides]::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 0;
        }
      `;

      // Generate CSS for each indent level (up to 8 levels)
      for (let i = 0; i < pastelColors.length; i++) {
        const color = pastelColors[i];
        const indentLevel = i + 1;

        // Create visual guides for each indent level
        // Each indent level is 2 spaces, and each character is roughly 0.6em in monospace
        const guides = [];
        const offset = -0.4; // Offset to shift guides 4px to the left (roughly -0.24em)
        for (let j = 1; j <= indentLevel; j++) {
          const position = (j * 2 - 1) * 0.6 + offset; // Position at 1st, 3rd, 5th space etc, shifted left
          guides.push(`linear-gradient(to right, transparent ${position}em, ${pastelColors[j-1]} ${position}em, ${pastelColors[j-1]} calc(${position}em + 1px), transparent calc(${position}em + 1px))`);
        }

        css += `
        /* Indent level ${indentLevel} (${indentLevel * 2} spaces) */
        .kr-slate-editor .kr-line[data-indent-level="${indentLevel}"]::before,
        .kr-slate-editor .kr-paragraph[data-indent-level="${indentLevel}"]::before {
          background-image: ${guides.join(', ')};
          width: 100%;
          opacity: ${config.highlightActiveIndent ? '0.7' : '0.5'};
        }
        `;

        if (config.highlightActiveIndent) {
          css += `
        .kr-slate-editor .kr-line[data-indent-level="${indentLevel}"]:hover::before,
        .kr-slate-editor .kr-paragraph[data-indent-level="${indentLevel}"]:hover::before {
          opacity: 1;
        }
        `;
        }
      }

      // Inject or update the style element
      let styleElement = document.getElementById(this.indentGuideId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = this.indentGuideId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = css;

      // Add dynamic indent level detection
      this.updateIndentLevels();

      // Start observing editor changes
      this.startIndentObserver();
    }

    /**
     * Dynamically detect and mark indent levels on lines
     */
    updateIndentLevels() {
      const editors = document.querySelectorAll('.kr-slate-editor');

      editors.forEach(editor => {
        const lines = editor.querySelectorAll('.kr-line, .kr-paragraph');

        lines.forEach(line => {
          const firstSpan = line.querySelector('.kr-span:first-child');
          if (!firstSpan) return;

          const text = firstSpan.textContent || '';
          const leadingSpaces = text.match(/^(\s*)/)[0].length;
          const indentLevel = Math.floor(leadingSpaces / 2);

          if (indentLevel > 0 && indentLevel <= 8) {
            line.setAttribute('data-indent-level', indentLevel);
            line.setAttribute('data-indent-guides', 'true');
          } else {
            line.removeAttribute('data-indent-level');
            line.removeAttribute('data-indent-guides');
          }
        });
      });
    }

    /**
     * Start observing the editor for changes to update indent guides
     */
    startIndentObserver() {
      // Stop existing observer if any
      if (this.indentObserver) {
        this.indentObserver.disconnect();
      }

      // Create new observer
      this.indentObserver = new MutationObserver(() => {
        this.updateIndentLevels();
      });

      // Observe all editors
      const editors = document.querySelectorAll('.kr-slate-editor');
      editors.forEach(editor => {
        this.indentObserver.observe(editor, {
          childList: true,
          subtree: true,
          characterData: true,
          characterDataOldValue: false
        });
      });
    }

    /**
     * Stop observing editor changes
     */
    stopIndentObserver() {
      if (this.indentObserver) {
        this.indentObserver.disconnect();
        this.indentObserver = null;
      }
    }

    /**
     * Reset all styles on an element
     */
    resetStyles(element) {
      const stylesToReset = ['display', 'flex', 'overflow', 'order',
                            'borderLeft', 'borderRight', 'borderTop', 'borderBottom',
                            'flexDirection', 'height', 'width', 'maxWidth', 'maxHeight'];
      stylesToReset.forEach(prop => {
        element.style[prop] = '';
      });
    }
  }

  // ========================================
  // DOM Selection
  // ========================================

  /**
   * DOMSelector - Handles DOM queries and element finding
   * Single Responsibility: DOM element selection
   */
  class DOMSelector {
    /**
     * Find all formula editor dialogs
     */
    findDialogs() {
      return document.querySelectorAll('div[data-coda-ui-id="dialog"][role="dialog"]');
    }

    /**
     * Find formula editor inside a dialog
     */
    findFormulaEditor(dialog) {
      return dialog.querySelector('div[data-coda-ui-id="formula-editor"]');
    }

    /**
     * Find root div of dialog
     */
    findRootDiv(dialog) {
      return dialog.querySelector(':scope > div');
    }

    /**
     * Find target container for layout manipulation
     */
    findTargetContainer(rootDiv) {
      // First, try to find by our marker attribute
      let target = rootDiv.querySelector('[data-coda-formula-target="true"]');

      if (!target) {
        // If not found, use the selector and mark it
        try {
          target = rootDiv.querySelector(':scope > div:nth-child(3) > div:last-child > div:last-child');
          if (target) {
            target.dataset.codaFormulaTarget = 'true';
          }
        } catch (e) {
          target = this.findTargetContainerFallback(rootDiv);
          if (target) {
            target.dataset.codaFormulaTarget = 'true';
          }
        }
      }

      return target;
    }

    /**
     * Fallback method for finding target container
     */
    findTargetContainerFallback(rootDiv) {
      const firstLevelDiv = rootDiv.querySelector('div');
      if (!firstLevelDiv) return null;

      const secondLevelDivs = firstLevelDiv.children;
      if (!secondLevelDivs || secondLevelDivs.length < 3) return null;

      const thirdDiv = secondLevelDivs[2];
      const lastChild1 = thirdDiv?.lastElementChild;
      return lastChild1?.lastElementChild || null;
    }
  }

  // ========================================
  // Modal Size Management
  // ========================================

  /**
   * ModalSizeManager - Handles modal size adjustments
   * Single Responsibility: Modal sizing
   */
  class ModalSizeManager {
    applySize(rootDiv, config, dialog) {
      const { modalWidth, modalHeight, modalLeft, modalTop } = config;
      rootDiv.style.width = `${modalWidth}%`;
      rootDiv.style.height = `${modalHeight}%`;
      rootDiv.style.maxWidth = `${modalWidth}%`;
      rootDiv.style.maxHeight = `${modalHeight}%`;

      // Calculate position
      // modalLeft: 0 = left, 50 = center, 100 = right
      // modalTop: 0 = top, 50 = center, 100 = bottom
      // Apply on rootDiv with position absolute for full control
      rootDiv.style.position = 'absolute';
      rootDiv.style.left = `${modalLeft}%`;
      rootDiv.style.top = `${modalTop}%`;
      rootDiv.style.transform = `translate(-${modalLeft}%, -${modalTop}%)`;
    }
  }

  // ========================================
  // Layout Management
  // ========================================

  /**
   * LayoutManager - Handles documentation layout and positioning
   * Single Responsibility: Layout and flex arrangement
   */
  class LayoutManager {
    constructor() {
      this.styleManager = new StyleManager();
    }

    /**
     * Apply layout based on documentation visibility
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
     * Hide documentation panel
     */
    hideDocumentation(kids) {
      // Hide all children except the formula editor
      kids.forEach((child) => {
        // Check if this is the formula editor
        const isFormulaEditor = child.querySelector('[data-coda-ui-id="formula-editor"]') ||
                                child.dataset.codaUiId === 'formula-editor';
        if (!isFormulaEditor) {
          child.style.display = 'none';
        }
      });
    }

    /**
     * Show documentation with proper layout
     */
    showDocumentation(kids, formulaDiv, config) {
      if (kids.length < 2) return;

      const mainChild = formulaDiv;
      const sideChild = kids[kids.length - 1];

      // Always create a new flex wrapper (simpler and more reliable)
      this.createFlexWrapper(kids, mainChild, sideChild, config);

      // Adjust and observe side child
      this.adjustSideChildLayout(sideChild);
      this.observeSideChild(sideChild);
    }

    /**
     * Update existing flex wrapper with new configuration
     */
    updateFlexWrapper(wrapper, mainChild, sideChild, config) {
      const position = config.documentationPosition;
      const borderColor = '1px solid rgb(240, 240, 240)';

      // Hide all intermediate children (keep only first and last)
      const parent = wrapper.parentElement;
      if (parent) {
        const allChildren = Array.from(parent.children);
        if (allChildren.length > 2) {
          for (let i = 1; i < allChildren.length - 1; i++) {
            if (allChildren[i] !== wrapper) {
              allChildren[i].style.display = 'none';
            }
          }
        }
      }

      // Make sure side child is visible
      sideChild.style.display = '';
      sideChild.style.height = '100%';

      // Clear all borders first
      sideChild.style.borderTop = 'none';
      sideChild.style.borderBottom = 'none';
      sideChild.style.borderLeft = 'none';
      sideChild.style.borderRight = 'none';

      // Configure layout based on position
      if (position === 'left' || position === 'right') {
        wrapper.style.flexDirection = 'row';

        if (position === 'left') {
          // Doc on left, editor on right
          sideChild.style.borderRight = borderColor;
          // Reorder if needed
          if (wrapper.firstChild !== sideChild) {
            wrapper.insertBefore(sideChild, mainChild);
          }
        } else {
          // Editor on left, doc on right
          sideChild.style.borderLeft = borderColor;
          // Reorder if needed
          if (wrapper.lastChild !== sideChild) {
            wrapper.appendChild(sideChild);
          }
        }
      } else {
        wrapper.style.flexDirection = 'column';

        if (position === 'top') {
          // Doc on top, editor on bottom
          sideChild.style.borderBottom = borderColor;
          // Reorder if needed
          if (wrapper.firstChild !== sideChild) {
            wrapper.insertBefore(sideChild, mainChild);
          }
        } else {
          // Editor on top, doc on bottom
          sideChild.style.borderTop = borderColor;
          // Reorder if needed
          if (wrapper.lastChild !== sideChild) {
            wrapper.appendChild(sideChild);
          }
        }
      }

      // Apply flex sizing based on proportions
      mainChild.style.flex = `${config.editorProportion} 1 0`;
      sideChild.style.flex = `${config.documentationProportion} 1 0`;
      sideChild.style.overflow = 'auto';
    }

    /**
     * Create new flex wrapper
     */
    createFlexWrapper(kids, mainChild, sideChild, config) {
      // Hide intermediate children (if there are more than 2)
      if (kids.length > 2) {
        for (let i = 1; i < kids.length - 1; i++) {
          kids[i].style.display = 'none';
        }
      }

      // Make sure side child is visible
      sideChild.style.display = '';
      sideChild.style.height = '100%';

      // Create a flex wrapper to hold main + side
      const flexWrapper = document.createElement('div');
      flexWrapper.style.display = 'flex';
      flexWrapper.style.width = '100%';
      flexWrapper.style.height = '100%';
      flexWrapper.style.boxSizing = 'border-box';
      flexWrapper.style.gap = '0px';

      // Configure layout based on position
      const position = config.documentationPosition;
      const borderColor = '1px solid rgb(240, 240, 240)';

      if (position === 'left' || position === 'right') {
        flexWrapper.style.flexDirection = 'row';

        if (position === 'left') {
          // Doc on left, editor on right
          sideChild.style.borderRight = borderColor;
          sideChild.style.borderLeft = 'none';
          mainChild.parentElement.insertBefore(flexWrapper, mainChild);
          flexWrapper.appendChild(sideChild);
          flexWrapper.appendChild(mainChild);
        } else {
          // Editor on left, doc on right
          sideChild.style.borderLeft = borderColor;
          sideChild.style.borderRight = 'none';
          mainChild.parentElement.insertBefore(flexWrapper, mainChild);
          flexWrapper.appendChild(mainChild);
          flexWrapper.appendChild(sideChild);
        }
      } else {
        flexWrapper.style.flexDirection = 'column';

        if (position === 'top') {
          // Doc on top, editor on bottom
          sideChild.style.borderBottom = borderColor;
          sideChild.style.borderTop = 'none';
          mainChild.parentElement.insertBefore(flexWrapper, mainChild);
          flexWrapper.appendChild(sideChild);
          flexWrapper.appendChild(mainChild);
        } else {
          // Editor on top, doc on bottom
          sideChild.style.borderTop = borderColor;
          sideChild.style.borderBottom = 'none';
          mainChild.parentElement.insertBefore(flexWrapper, mainChild);
          flexWrapper.appendChild(mainChild);
          flexWrapper.appendChild(sideChild);
        }
      }

      // Apply flex sizing based on proportions
      mainChild.style.flex = `${config.editorProportion} 1 0`;
      sideChild.style.flex = `${config.documentationProportion} 1 0`;
      sideChild.style.overflow = 'auto';
    }


    /**
     * Adjust side child layout to remove max-height constraints
     */
    adjustSideChildLayout(sideRoot) {
      if (!sideRoot) return;

      const allDescendants = sideRoot.querySelectorAll('*');
      allDescendants.forEach(el => {
        const computed = window.getComputedStyle(el);
        if (computed.maxHeight && computed.maxHeight !== 'none') {
          el.style.maxHeight = 'none';
        }
      });

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
     * Observe side child for DOM changes
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
     * Reset layout - remove flex wrappers and restore original state
     */
    resetLayout(target) {
      // Find and remove all flex wrappers
      const allDivs = Array.from(target.children);
      allDivs.forEach((div) => {
        const computedStyle = getComputedStyle(div);

        // Check if it's a wrapper div we created (has flex display)
        const hasFlexDisplay = div.style.display === 'flex' ||
                               computedStyle.display === 'flex';
        const hasFlexDirection = div.style.flexDirection === 'row' ||
                                 div.style.flexDirection === 'column' ||
                                 computedStyle.flexDirection === 'row' ||
                                 computedStyle.flexDirection === 'column';

        if (hasFlexDisplay && hasFlexDirection && div.children.length > 0) {
          // Move children back to target
          while (div.firstChild) {
            target.appendChild(div.firstChild);
          }
          div.remove();
        }
      });

      // Reset all children styles (including display)
      const kids = Array.from(target.children);
      kids.forEach((child) => {
        this.styleManager.resetStyles(child);
      });

      // Reset target styles
      target.style.display = '';
      target.style.flexDirection = '';
      target.style.height = '';
    }
  }

  // ========================================
  // Dialog Processing
  // ========================================

  /**
   * DialogProcessor - Orchestrates the customization of dialogs
   * Single Responsibility: Coordination of customization components
   */
  class DialogProcessor {
    constructor(config) {
      this.config = config;
      this.domSelector = new DOMSelector();
      this.styleManager = new StyleManager();
      this.modalSizeManager = new ModalSizeManager();
      this.layoutManager = new LayoutManager();
    }

    /**
     * Process a single dialog
     */
    processDialog(dialog, formulaDiv) {
      const rootDiv = this.domSelector.findRootDiv(dialog);
      if (!rootDiv) return;

      // Apply modal size and position
      this.modalSizeManager.applySize(rootDiv, this.config, dialog);

      // Apply editor styles
      this.styleManager.applyEditorStyles(formulaDiv, this.config);

      // Handle layout
      const target = this.domSelector.findTargetContainer(rootDiv);
      if (!target) return;

      // Ensure we process this container only once
      if (target.dataset.codaFormulaLayoutPatched === 'true') return;
      target.dataset.codaFormulaLayoutPatched = 'true';

      target.style.height = 'auto';

      const kids = Array.from(target.children);
      this.layoutManager.applyLayout(kids, formulaDiv, this.config);
    }

    /**
     * Reset a dialog to original state
     */
    resetDialog(dialog) {
      delete dialog.dataset.codaFormulaDialogPatched;

      const rootDiv = this.domSelector.findRootDiv(dialog);
      if (!rootDiv) return;

      try {
        // Reset modal size
        rootDiv.style.width = '';
        rootDiv.style.height = '';
        rootDiv.style.maxWidth = '';
        rootDiv.style.maxHeight = '';
        rootDiv.style.position = '';
        rootDiv.style.left = '';
        rootDiv.style.top = '';
        rootDiv.style.transform = '';

        const target = this.domSelector.findTargetContainer(rootDiv);
        if (target) {
          delete target.dataset.codaFormulaLayoutPatched;
          this.layoutManager.resetLayout(target);
        }
      } catch (e) {
        console.error('[Coda Extension] Error cleaning up:', e);
      }
    }
  }

  // ========================================
  // Modal Customizer (Main Orchestrator)
  // ========================================

  /**
   * ModalCustomizer - Main entry point for dialog customization
   * Single Responsibility: Observation and high-level coordination
   */
  class ModalCustomizer {
    constructor(config) {
      this.config = config;
      this.processedDialogs = new WeakSet();
      this.observer = null;
      this.domSelector = new DOMSelector();
      this.dialogProcessor = new DialogProcessor(config);
    }

    /**
     * Initialize the customizer
     */
    init() {
      this.processDialogs();
      this.startObserver();
    }

    /**
     * Update configuration and re-process dialogs
     */
    updateConfig(newConfig) {
      this.config = newConfig;
      this.dialogProcessor = new DialogProcessor(newConfig);

      // Reset all existing dialogs
      const dialogs = this.domSelector.findDialogs();
      dialogs.forEach(dialog => {
        this.dialogProcessor.resetDialog(dialog);
      });

      // Clear processed dialogs and re-process
      this.processedDialogs = new WeakSet();
      this.processDialogs();
    }

    /**
     * Process all dialogs in the DOM
     */
    processDialogs() {
      const dialogs = this.domSelector.findDialogs();
      dialogs.forEach(dialog => {
        if (this.processedDialogs.has(dialog)) return;

        const formulaDiv = this.domSelector.findFormulaEditor(dialog);
        if (!formulaDiv) return;

        this.processedDialogs.add(dialog);
        this.dialogProcessor.processDialog(dialog, formulaDiv);
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

    stopObserver() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
    }
  }

  // ========================================
  // Main Application
  // ========================================

  class CodaFormulaCustomizer {
    constructor() {
      this.customizer = null;
      this.init();
    }

    loadGoogleFonts() {
      // Check if fonts are already loaded
      if (document.getElementById('coda-formula-fonts')) {
        return;
      }

      // Create a link element to load Google Fonts
      const link = document.createElement('link');
      link.id = 'coda-formula-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Source+Code+Pro:wght@400;500;600&display=swap';
      document.head.appendChild(link);

      // Load OpenDyslexic from CDN
      const openDyslexicLink = document.createElement('link');
      openDyslexicLink.id = 'opendyslexic-font';
      openDyslexicLink.rel = 'stylesheet';
      openDyslexicLink.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic.min.css';
      document.head.appendChild(openDyslexicLink);

    }

    async init() {
      try {
        // Load Google Fonts first
        this.loadGoogleFonts();

        const config = await StorageManager.getConfig();

        this.customizer = new ModalCustomizer(config);

        if (document.readyState === "loading") {
          window.addEventListener("DOMContentLoaded", () => {
            this.customizer.init();
          });
        } else {
          this.customizer.init();
        }

        this.listenForConfigChanges();
        this.listenForMessages();
      } catch (error) {
        console.error('[Coda Formula Customizer] Initialization error:', error);
      }
    }

    listenForConfigChanges() {
      StorageManager.onConfigChange((newConfig) => {
        if (this.customizer) {
          this.customizer.updateConfig(newConfig);
        }
      });
    }

    listenForMessages() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'CONFIG_UPDATE') {
          if (this.customizer) {
            this.customizer.updateConfig(message.config);
            sendResponse({ success: true });
          }
        }
        return true;
      });
    }
  }

  // ========================================
  // Export for popup use
  // ========================================

  // Make available globally for popup
  window.CodaFormulaExtension = {
    StorageManager,
    DEFAULT_CONFIG
  };

  // Initialize content script
  new CodaFormulaCustomizer();

})();
