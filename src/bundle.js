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
    transparentBackground: false,
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
        // Check if chrome.tabs is available (only in background/popup, not content scripts)
        if (chrome.tabs && chrome.tabs.query) {
          const tabs = await chrome.tabs.query({ url: '*://*.coda.io/d/*' });
          for (const tab of tabs) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'CONFIG_UPDATE',
              config: config
            }).catch(() => {
              // Ignore errors for tabs that don't have content script loaded
            });
          }
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

      // Apply background transparency
      if (this.config.transparentBackground) {
        dialog.style.background = 'transparent';
      } else {
        dialog.style.background = '';
      }

      // Add settings button
      this.addSettingsButton(rootDiv);

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

        // Reset background
        dialog.style.background = '';

        const target = this.domSelector.findTargetContainer(rootDiv);
        if (target) {
          delete target.dataset.codaFormulaLayoutPatched;
          this.layoutManager.resetLayout(target);
        }
      } catch (e) {
        console.error('[Coda Extension] Error cleaning up:', e);
      }
    }

    /**
     * Add settings button to modal
     */
    addSettingsButton(rootDiv) {
      // Check if button already exists
      if (rootDiv.querySelector('[data-coda-formula-settings-btn]')) return;

      // Create settings button
      const settingsBtn = document.createElement('button');
      settingsBtn.setAttribute('data-coda-formula-settings-btn', 'true');
      settingsBtn.style.cssText = `
        position: absolute;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 1000;
        opacity: 0.7;
        transition: opacity 0.2s;
      `;

      // Add hover effect
      settingsBtn.addEventListener('mouseenter', () => {
        settingsBtn.style.opacity = '1';
      });
      settingsBtn.addEventListener('mouseleave', () => {
        settingsBtn.style.opacity = '0.7';
      });

      // Create icon
      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '24');
      iconSvg.setAttribute('height', '24');
      iconSvg.setAttribute('viewBox', '0 0 48 48');
      iconSvg.innerHTML = `
        <rect width="48" height="48" rx="10" fill="#4f46e5"/>
        <text x="24" y="32" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="#ffffff" style="font-style: italic;">f(x)</text>
        <g fill="#ffffff" opacity="0.5">
          <path d="M 8 8 L 12 8 L 12 9 L 9 9 L 9 12 L 8 12 Z"/>
          <path d="M 40 8 L 36 8 L 36 9 L 39 9 L 39 12 L 40 12 Z"/>
          <path d="M 8 40 L 12 40 L 12 39 L 9 39 L 9 36 L 8 36 Z"/>
          <path d="M 40 40 L 36 40 L 36 39 L 39 39 L 39 36 L 40 36 Z"/>
        </g>
      `;

      // Add text label
      const label = document.createElement('span');
      label.textContent = 'Settings';
      label.style.cssText = `
        font-size: 14px;
        font-weight: 500;
        color: #4f46e5;
      `;

      settingsBtn.appendChild(iconSvg);
      settingsBtn.appendChild(label);

      // Add click handler - need to access the global settingsPanel
      settingsBtn.addEventListener('click', () => {
        if (window.codaFormulaSettingsPanel) {
          window.codaFormulaSettingsPanel.toggle();
        }
      });

      // Insert button at the beginning of rootDiv
      rootDiv.insertBefore(settingsBtn, rootDiv.firstChild);
    }
  }

  // ========================================
  // Settings Panel
  // ========================================

  /**
   * SettingsPanel - In-page settings overlay
   */
  class SettingsPanel {
    constructor() {
      this.panel = null;
      this.config = null;
      this.elements = {};
    }

    async show() {
      this.config = await StorageManager.getConfig();
      if (!this.panel) {
        this.createPanel();
      }
      this.updateUI();
      this.panel.style.display = 'block';
    }

    hide() {
      if (this.panel) {
        this.panel.style.display = 'none';
      }
    }

    async toggle() {
      if (this.panel && this.panel.style.display === 'block') {
        this.hide();
      } else {
        await this.show();
      }
    }

    createPanel() {
      this.panel = document.createElement('div');
      this.panel.setAttribute('data-coda-formula-settings-panel', 'true');
      this.panel.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 500px;
        max-height: 90vh;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        z-index: 10000;
        display: none;
        overflow: hidden;
      `;

      this.panel.innerHTML = `
        <div style="padding: 20px; max-height: 85vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">Formula Editor Settings</h2>
            <button id="closeSettingsPanel" style="background: none; border: none; cursor: pointer; font-size: 24px; color: #6b7280;">&times;</button>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">Modal Size</h3>
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 13px; color: #6b7280;">Width</span>
                <span id="widthValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">95%</span>
              </div>
              <input type="range" id="modalWidth" min="20" max="98" value="95" style="width: 100%;" />
            </div>
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 13px; color: #6b7280;">Height</span>
                <span id="heightValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">95%</span>
              </div>
              <input type="range" id="modalHeight" min="20" max="98" value="95" style="width: 100%;" />
            </div>
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 13px; color: #6b7280;">Horizontal Position</span>
                <span id="leftValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">Center</span>
              </div>
              <input type="range" id="modalLeft" min="0" max="100" value="50" style="width: 100%;" />
            </div>
            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 13px; color: #6b7280;">Vertical Position</span>
                <span id="topValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">Center</span>
              </div>
              <input type="range" id="modalTop" min="0" max="100" value="50" style="width: 100%;" />
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="transparentBackground" />
                <span style="font-size: 13px; color: #374151;">Transparent background</span>
              </label>
            </div>
          </div>

          <!-- Editor Settings Section -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">Editor Settings</h3>

            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 13px; color: #6b7280;">Font Size</span>
                <span id="fontSizeValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">14px</span>
              </div>
              <input type="range" id="editorFontSize" min="10" max="24" value="14" style="width: 100%;" />
            </div>

            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 13px; color: #6b7280;">Line Height</span>
                <span id="lineHeightValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">1.5</span>
              </div>
              <input type="range" id="editorLineHeight" min="1.0" max="2.5" step="0.1" value="1.5" style="width: 100%;" />
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px;">Font Family</label>
              <select id="editorFontFamily" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <option value="monospace">Monospace</option>
                <option value="fira-code">Fira Code</option>
                <option value="jetbrains-mono">JetBrains Mono</option>
                <option value="source-code-pro">Source Code Pro</option>
                <option value="opendyslexic">OpenDyslexic</option>
              </select>
            </div>

            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px;">Theme</label>
              <select id="editorTheme" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="sepia">Sepia</option>
                <option value="high-contrast">High Contrast</option>
                <option value="protanopia">Protanopia (Red-blind)</option>
                <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                <option value="tritanopia">Tritanopia (Blue-blind)</option>
              </select>
            </div>
          </div>

          <!-- Documentation Section -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">Documentation</h3>

            <div style="margin-bottom: 16px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="showDocumentation" checked />
                <span style="font-size: 13px; color: #374151;">Show documentation panel</span>
              </label>
            </div>

            <div id="documentationOptions">
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 8px;">Position</label>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
                  <button class="position-btn" data-position="left" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 12px;">Left</button>
                  <button class="position-btn active" data-position="right" style="padding: 8px; border: 1px solid #4f46e5; border-radius: 6px; background: #ede9fe; cursor: pointer; font-size: 12px; color: #4f46e5;">Right</button>
                  <button class="position-btn" data-position="top" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 12px;">Top</button>
                  <button class="position-btn" data-position="bottom" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 12px;">Bottom</button>
                  <button class="position-btn" data-position="none" style="padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 12px;">None</button>
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 13px; color: #6b7280;">Editor Size</span>
                  <span id="proportionValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">66%</span>
                </div>
                <input type="range" id="editorProportion" min="30" max="80" value="66" style="width: 100%;" />
              </div>
            </div>
          </div>

          <!-- Indent Guides Section -->
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">Indent Guides</h3>

            <div style="margin-bottom: 16px;">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="showIndentGuides" checked />
                <span style="font-size: 13px; color: #374151;">Show indent guide lines</span>
              </label>
            </div>

            <div id="indentGuidesOptions">
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px;">Guide Style</label>
                <select id="indentGuideStyle" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
                  <option value="dotted">Dotted</option>
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                </select>
              </div>

              <div style="margin-bottom: 16px;">
                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                  <input type="checkbox" id="highlightActiveIndent" checked />
                  <span style="font-size: 13px; color: #374151;">Highlight active indent</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="resetSettingsBtn" style="padding: 8px 16px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: #374151;">Reset</button>
            <button id="saveSettingsBtn" style="padding: 8px 16px; background: #4f46e5; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: white;">Save</button>
          </div>

          <div id="settingsStatus" style="margin-top: 12px; padding: 8px; border-radius: 6px; font-size: 13px; text-align: center; display: none;"></div>
        </div>
      `;

      document.body.appendChild(this.panel);
      this.cacheElements();
      this.attachEventListeners();
    }

    cacheElements() {
      this.elements = {
        closeBtn: this.panel.querySelector('#closeSettingsPanel'),
        saveBtn: this.panel.querySelector('#saveSettingsBtn'),
        resetBtn: this.panel.querySelector('#resetSettingsBtn'),
        status: this.panel.querySelector('#settingsStatus'),

        // Modal size
        modalWidth: this.panel.querySelector('#modalWidth'),
        modalHeight: this.panel.querySelector('#modalHeight'),
        modalLeft: this.panel.querySelector('#modalLeft'),
        modalTop: this.panel.querySelector('#modalTop'),
        widthValue: this.panel.querySelector('#widthValue'),
        heightValue: this.panel.querySelector('#heightValue'),
        leftValue: this.panel.querySelector('#leftValue'),
        topValue: this.panel.querySelector('#topValue'),
        transparentBackground: this.panel.querySelector('#transparentBackground'),

        // Editor settings
        editorFontSize: this.panel.querySelector('#editorFontSize'),
        fontSizeValue: this.panel.querySelector('#fontSizeValue'),
        editorLineHeight: this.panel.querySelector('#editorLineHeight'),
        lineHeightValue: this.panel.querySelector('#lineHeightValue'),
        editorFontFamily: this.panel.querySelector('#editorFontFamily'),
        editorTheme: this.panel.querySelector('#editorTheme'),

        // Documentation
        showDocumentation: this.panel.querySelector('#showDocumentation'),
        documentationOptions: this.panel.querySelector('#documentationOptions'),
        positionButtons: this.panel.querySelectorAll('.position-btn'),
        editorProportion: this.panel.querySelector('#editorProportion'),
        proportionValue: this.panel.querySelector('#proportionValue'),

        // Indent guides
        showIndentGuides: this.panel.querySelector('#showIndentGuides'),
        indentGuidesOptions: this.panel.querySelector('#indentGuidesOptions'),
        indentGuideStyle: this.panel.querySelector('#indentGuideStyle'),
        highlightActiveIndent: this.panel.querySelector('#highlightActiveIndent')
      };
    }

    attachEventListeners() {
      this.elements.closeBtn.addEventListener('click', () => this.hide());
      this.panel.addEventListener('click', (e) => {
        if (e.target === this.panel) this.hide();
      });

      this.elements.modalWidth.addEventListener('input', (e) => {
        this.elements.widthValue.textContent = `${e.target.value}%`;
      });
      this.elements.modalHeight.addEventListener('input', (e) => {
        this.elements.heightValue.textContent = `${e.target.value}%`;
      });
      this.elements.modalLeft.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        let label = 'Center';
        if (value < 25) label = 'Left';
        else if (value > 75) label = 'Right';
        this.elements.leftValue.textContent = label;
      });
      this.elements.modalTop.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        let label = 'Center';
        if (value < 25) label = 'Top';
        else if (value > 75) label = 'Bottom';
        this.elements.topValue.textContent = label;
      });

      // Editor settings sliders
      this.elements.editorFontSize.addEventListener('input', (e) => {
        this.elements.fontSizeValue.textContent = `${e.target.value}px`;
      });

      this.elements.editorLineHeight.addEventListener('input', (e) => {
        this.elements.lineHeightValue.textContent = e.target.value;
      });

      // Documentation checkbox
      this.elements.showDocumentation.addEventListener('change', (e) => {
        this.toggleDocumentationOptions(e.target.checked);
      });

      // Position buttons
      this.elements.positionButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          this.handlePositionClick(e.target);
        });
      });

      // Editor proportion slider
      this.elements.editorProportion.addEventListener('input', (e) => {
        this.elements.proportionValue.textContent = `${e.target.value}%`;
      });

      // Indent guides checkbox
      this.elements.showIndentGuides.addEventListener('change', (e) => {
        this.toggleIndentGuidesOptions(e.target.checked);
      });

      // Action buttons
      this.elements.saveBtn.addEventListener('click', () => this.handleSave());
      this.elements.resetBtn.addEventListener('click', () => this.handleReset());
    }

    /**
     * Toggle documentation options visibility
     */
    toggleDocumentationOptions(show) {
      if (show) {
        this.elements.documentationOptions.style.display = 'block';
      } else {
        this.elements.documentationOptions.style.display = 'none';
      }
    }

    /**
     * Toggle indent guides options visibility
     */
    toggleIndentGuidesOptions(show) {
      if (show) {
        this.elements.indentGuidesOptions.style.display = 'block';
      } else {
        this.elements.indentGuidesOptions.style.display = 'none';
      }
    }

    /**
     * Handle position button click
     */
    handlePositionClick(btn) {
      this.elements.positionButtons.forEach((b) => {
        b.style.border = '1px solid #d1d5db';
        b.style.background = 'white';
        b.style.color = 'inherit';
      });
      btn.style.border = '1px solid #4f46e5';
      btn.style.background = '#ede9fe';
      btn.style.color = '#4f46e5';
    }

    updateUI() {
      if (!this.config) return;

      this.elements.modalWidth.value = this.config.modalWidth;
      this.elements.modalHeight.value = this.config.modalHeight;
      this.elements.modalLeft.value = this.config.modalLeft || 50;
      this.elements.modalTop.value = this.config.modalTop || 50;
      this.elements.widthValue.textContent = `${this.config.modalWidth}%`;
      this.elements.heightValue.textContent = `${this.config.modalHeight}%`;

      const leftValue = this.config.modalLeft || 50;
      let leftLabel = 'Center';
      if (leftValue < 25) leftLabel = 'Left';
      else if (leftValue > 75) leftLabel = 'Right';
      this.elements.leftValue.textContent = leftLabel;

      const topValue = this.config.modalTop || 50;
      let topLabel = 'Center';
      if (topValue < 25) topLabel = 'Top';
      else if (topValue > 75) topLabel = 'Bottom';
      this.elements.topValue.textContent = topLabel;

      this.elements.transparentBackground.checked = this.config.transparentBackground || false;

      // Editor settings
      this.elements.editorFontSize.value = this.config.editorFontSize || 14;
      this.elements.fontSizeValue.textContent = `${this.config.editorFontSize || 14}px`;
      this.elements.editorLineHeight.value = this.config.editorLineHeight || 1.5;
      this.elements.lineHeightValue.textContent = this.config.editorLineHeight || 1.5;
      this.elements.editorFontFamily.value = this.config.editorFontFamily || 'monospace';
      this.elements.editorTheme.value = this.config.editorTheme || 'light';

      // Documentation
      this.elements.showDocumentation.checked = this.config.showDocumentation !== false;
      this.toggleDocumentationOptions(this.config.showDocumentation !== false);

      // Update position buttons
      this.elements.positionButtons.forEach((btn) => {
        if (btn.dataset.position === this.config.documentationPosition) {
          this.handlePositionClick(btn);
        }
      });

      // Editor proportion
      this.elements.editorProportion.value = this.config.editorProportion || 66;
      this.elements.proportionValue.textContent = `${this.config.editorProportion || 66}%`;

      // Indent guides
      this.elements.showIndentGuides.checked = this.config.showIndentGuides !== false;
      this.toggleIndentGuidesOptions(this.config.showIndentGuides !== false);
      this.elements.indentGuideStyle.value = this.config.indentGuideStyle || 'dotted';
      this.elements.highlightActiveIndent.checked = this.config.highlightActiveIndent !== false;
    }

    getConfigFromUI() {
      const selectedPosition = this.panel.querySelector('.position-btn[data-position][style*="4f46e5"]');

      return {
        modalWidth: parseInt(this.elements.modalWidth.value),
        modalHeight: parseInt(this.elements.modalHeight.value),
        modalLeft: parseInt(this.elements.modalLeft.value),
        modalTop: parseInt(this.elements.modalTop.value),
        transparentBackground: this.elements.transparentBackground.checked,
        showDocumentation: this.elements.showDocumentation.checked,
        documentationPosition: selectedPosition ? selectedPosition.dataset.position : 'right',
        editorProportion: parseInt(this.elements.editorProportion.value),
        editorFontSize: parseInt(this.elements.editorFontSize.value),
        editorLineHeight: parseFloat(this.elements.editorLineHeight.value),
        editorFontFamily: this.elements.editorFontFamily.value,
        editorTheme: this.elements.editorTheme.value,
        showIndentGuides: this.elements.showIndentGuides.checked,
        indentGuideStyle: this.elements.indentGuideStyle.value,
        highlightActiveIndent: this.elements.highlightActiveIndent.checked
      };
    }

    async handleSave() {
      const newConfig = this.getConfigFromUI();
      const success = await StorageManager.saveConfig(newConfig);

      if (success) {
        this.config = newConfig;
        this.showStatus('Settings saved successfully!', 'success');
        window.dispatchEvent(new CustomEvent('codaFormulaConfigChanged', { detail: newConfig }));
      } else {
        this.showStatus('Error saving settings', 'error');
      }
    }

    async handleReset() {
      if (!confirm('Reset all settings to defaults?')) return;

      const success = await StorageManager.resetToDefaults();
      if (success) {
        this.config = await StorageManager.getConfig();
        this.updateUI();
        this.showStatus('Settings reset to defaults!', 'success');
        window.dispatchEvent(new CustomEvent('codaFormulaConfigChanged', { detail: this.config }));
      } else {
        this.showStatus('Error resetting settings', 'error');
      }
    }

    showStatus(message, type) {
      const statusEl = this.elements.status;
      statusEl.textContent = message;
      statusEl.style.display = 'block';
      statusEl.style.background = type === 'success' ? '#d1fae5' : '#fee2e2';
      statusEl.style.color = type === 'success' ? '#065f46' : '#991b1b';

      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);
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
      this.settingsPanel = new SettingsPanel();
    }

    /**
     * Initialize the customizer
     */
    init() {
      this.processDialogs();
      this.startObserver();
      this.listenForConfigChanges();
    }

    /**
     * Listen for configuration changes from settings panel
     */
    listenForConfigChanges() {
      window.addEventListener('codaFormulaConfigChanged', (event) => {
        this.updateConfig(event.detail);
      });
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

        // Expose settings panel globally for button access
        window.codaFormulaSettingsPanel = this.customizer.settingsPanel;

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
