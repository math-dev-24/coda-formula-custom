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
    showDocumentation: true,
    documentationPosition: 'right',
    editorProportion: 66,
    documentationProportion: 34,
    editorFontSize: 14, // Font size in pixels (10-24)
    editorLineHeight: 1.5, // Line height (1.0-2.5)
    editorFontFamily: 'monospace', // Font family: monospace, fira-code, jetbrains-mono, source-code-pro
    showLineNumbers: true, // Show/hide line numbers
    editorTheme: 'light', // Editor theme: light, dark
    presets: {
      default: { modalWidth: 80, modalHeight: 80, editorProportion: 66 },
      medium: { modalWidth: 90, modalHeight: 90, editorProportion: 60 },
      fullscreen: { modalWidth: 95, modalHeight: 95, editorProportion: 70 }
    }
  };

  function validateConfig(config) {
    if (!config) return false;
    if (config.modalWidth < 50 || config.modalWidth > 95) return false;
    if (config.modalHeight < 50 || config.modalHeight > 95) return false;
    const validPositions = ['left', 'right', 'top', 'bottom', 'none'];
    if (!validPositions.includes(config.documentationPosition)) return false;
    if (config.editorProportion < 30 || config.editorProportion > 80) return false;
    if (config.editorFontSize && (config.editorFontSize < 10 || config.editorFontSize > 24)) return false;
    if (config.editorLineHeight && (config.editorLineHeight < 1.0 || config.editorLineHeight > 2.5)) return false;
    const validFonts = ['monospace', 'fira-code', 'jetbrains-mono', 'source-code-pro'];
    if (config.editorFontFamily && !validFonts.includes(config.editorFontFamily)) return false;
    const validThemes = ['light', 'dark'];
    if (config.editorTheme && !validThemes.includes(config.editorTheme)) return false;
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
          }).catch(() => {});
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
  // Modal Customizer
  // ========================================

  class ModalCustomizer {
    constructor(config) {
      this.config = config;
      this.processedDialogs = new WeakSet();
      this.observer = null;
    }

    init() {
      this.processDialogs();
      this.startObserver();
    }

    updateConfig(newConfig) {
      this.config = newConfig;

      // Clear all processed flags and reset DOM
      const dialogs = document.querySelectorAll('div[data-coda-ui-id="dialog"][role="dialog"]');
      dialogs.forEach(dialog => {
        delete dialog.dataset.codaFormulaDialogPatched;

        // Reset modal size first
        const rootDiv = dialog.querySelector(':scope > div');
        if (!rootDiv) return;

        // Clear layout patched flag from target containers
        try {
          const target = rootDiv.querySelector(':scope > div:nth-child(3) > div:last-child > div:last-child');
          if (target) {
            delete target.dataset.codaFormulaLayoutPatched;

            // Find and remove all our flex wrappers
            const allDivs = target.querySelectorAll(':scope > div');
            allDivs.forEach(div => {
              if (div.style.display === 'flex' &&
                  (div.style.flexDirection === 'row' || div.style.flexDirection === 'column')) {
                // This is likely our wrapper, move children back
                const parent = div.parentElement;
                while (div.firstChild) {
                  parent.insertBefore(div.firstChild, div);
                }
                div.remove();
              }
            });

            // Reset all children visibility
            const kids = Array.from(target.children);
            kids.forEach(child => {
              child.style.display = '';
              child.style.flex = '';
              child.style.overflow = '';
              child.style.order = '';
              child.style.borderLeft = '';
              child.style.borderRight = '';
              child.style.borderTop = '';
              child.style.borderBottom = '';
            });

            // Reset target styles
            target.style.display = '';
            target.style.flexDirection = '';
            target.style.height = '';
          }
        } catch (e) {
          console.error('[Coda Extension] Error cleaning up:', e);
        }
      });

      this.processedDialogs = new WeakSet();
      this.processDialogs();
    }

    processDialogs() {
      const dialogs = document.querySelectorAll('div[data-coda-ui-id="dialog"][role="dialog"]');
      dialogs.forEach(dialog => {
        if (this.processedDialogs.has(dialog)) return;
        const formulaDiv = dialog.querySelector('div[data-coda-ui-id="formula-editor"]');
        if (!formulaDiv) return;
        this.processedDialogs.add(dialog);
        this.customizeDialog(dialog, formulaDiv);
      });
    }

    customizeDialog(dialog, formulaDiv) {
      const rootDiv = dialog.querySelector(':scope > div');
      if (!rootDiv) return;

      this.applyModalSize(rootDiv);
      this.applyEditorFontSize(formulaDiv);

      // Get target container using the working selector
      let target;
      try {
        target = rootDiv.querySelector(':scope > div:nth-child(3) > div:last-child > div:last-child');
      } catch (e) {
        const firstLevelDiv = rootDiv.querySelector('div');
        if (!firstLevelDiv) return;
        const secondLevelDivs = firstLevelDiv.children;
        if (!secondLevelDivs || secondLevelDivs.length >= 3) {
          const thirdDiv = secondLevelDivs[2];
          const lastChild1 = thirdDiv?.lastElementChild;
          if (lastChild1) {
            target = lastChild1.lastElementChild;
          }
        }
      }

      if (!target) return;

      // Ensure we process this container only once
      if (target.dataset.codaFormulaLayoutPatched === "true") return;
      target.dataset.codaFormulaLayoutPatched = "true";

      target.style.height = "auto";

      const kids = Array.from(target.children);
      if (kids.length < 2) return;

      if (!this.config.showDocumentation) {
        this.hideDocumentation(target, kids);
      } else {
        this.showDocumentation(target, kids, formulaDiv);
      }
    }

    applyModalSize(rootDiv) {
      const { modalWidth, modalHeight } = this.config;
      rootDiv.style.width = `${modalWidth}%`;
      rootDiv.style.height = `${modalHeight}%`;
      rootDiv.style.maxWidth = `${modalWidth}%`;
      rootDiv.style.maxHeight = `${modalHeight}%`;
    }

    applyEditorFontSize(formulaDiv) {
      if (!formulaDiv) return;

      // Apply font size
      if (this.config.editorFontSize) {
        formulaDiv.style.fontSize = `${this.config.editorFontSize}px`;
      }

      // Apply line height
      if (this.config.editorLineHeight) {
        formulaDiv.style.lineHeight = `${this.config.editorLineHeight}`;
      }

      // Apply font family
      if (this.config.editorFontFamily) {
        const fontMap = {
          'monospace': 'monospace',
          'fira-code': '"Fira Code", "Cascadia Code", monospace',
          'jetbrains-mono': '"JetBrains Mono", monospace',
          'source-code-pro': '"Source Code Pro", monospace'
        };
        formulaDiv.style.fontFamily = fontMap[this.config.editorFontFamily] || 'monospace';
      }

      // Apply theme (background and text color)
      if (this.config.editorTheme === 'dark') {
        formulaDiv.style.backgroundColor = '#1e1e1e';
        formulaDiv.style.color = '#d4d4d4';
      } else {
        formulaDiv.style.backgroundColor = '#ffffff';
        formulaDiv.style.color = '#000000';
      }

      // Toggle line numbers
      const lineNumbersGutter = formulaDiv.querySelector('.margin, .line-numbers');
      if (lineNumbersGutter) {
        lineNumbersGutter.style.display = this.config.showLineNumbers ? '' : 'none';
      }

      // Apply to Monaco editor if present
      const monacoEditors = formulaDiv.querySelectorAll('.monaco-editor, .view-lines, .view-line');
      monacoEditors.forEach(editor => {
        if (this.config.editorFontSize) {
          editor.style.fontSize = `${this.config.editorFontSize}px`;
        }
        if (this.config.editorLineHeight) {
          editor.style.lineHeight = `${this.config.editorLineHeight}`;
        }
        if (this.config.editorFontFamily) {
          const fontMap = {
            'monospace': 'monospace',
            'fira-code': '"Fira Code", "Cascadia Code", monospace',
            'jetbrains-mono': '"JetBrains Mono", monospace',
            'source-code-pro': '"Source Code Pro", monospace'
          };
          editor.style.fontFamily = fontMap[this.config.editorFontFamily] || 'monospace';
        }
      });
    }


    hideDocumentation(target, kids) {
      kids.forEach((child, index) => {
        if (index > 0) {
          child.style.display = "none";
        }
      });
    }

    showDocumentation(target, kids, formulaDiv) {
      const mainChild = formulaDiv;
      const sideChild = kids[kids.length - 1];

      // Hide any intermediate children (if there are more than 2)
      if (kids.length > 2) {
        for (let i = 1; i < kids.length - 1; i++) {
          kids[i].style.display = "none";
        }
      }

      // Make sure side child is visible
      sideChild.style.display = "";
      sideChild.style.height = "100%";

      // Create a flex wrapper to hold main + side
      const flexWrapper = document.createElement("div");
      flexWrapper.style.display = "flex";
      flexWrapper.style.width = "100%";
      flexWrapper.style.height = "100%";
      flexWrapper.style.boxSizing = "border-box";
      flexWrapper.style.gap = "0px";

      const position = this.config.documentationPosition;
      const editorFlex = this.config.editorProportion;
      const docFlex = this.config.documentationProportion;

      // Insert the wrapper before the mainChild, then move main & side into it
      mainChild.parentElement.insertBefore(flexWrapper, mainChild);

      if (position === 'left' || position === 'right') {
        flexWrapper.style.flexDirection = "row";

        if (position === 'left') {
          sideChild.style.borderRight = "1px solid rgb(240, 240, 240)";
          sideChild.style.borderLeft = "none";
          flexWrapper.appendChild(sideChild);
          flexWrapper.appendChild(mainChild);
        } else {
          sideChild.style.borderLeft = "1px solid rgb(240, 240, 240)";
          sideChild.style.borderRight = "none";
          flexWrapper.appendChild(mainChild);
          flexWrapper.appendChild(sideChild);
        }
      } else {
        flexWrapper.style.flexDirection = "column";

        if (position === 'top') {
          sideChild.style.borderBottom = "1px solid rgb(240, 240, 240)";
          sideChild.style.borderTop = "none";
          flexWrapper.appendChild(sideChild);
          flexWrapper.appendChild(mainChild);
        } else {
          sideChild.style.borderTop = "1px solid rgb(240, 240, 240)";
          sideChild.style.borderBottom = "none";
          flexWrapper.appendChild(mainChild);
          flexWrapper.appendChild(sideChild);
        }
      }

      mainChild.style.flex = `${editorFlex} 1 0`;
      sideChild.style.flex = `${docFlex} 1 0`;
      sideChild.style.overflow = "auto";

      this.adjustSideChildLayout(sideChild);
      this.observeSideChild(sideChild);
    }

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
      console.log('[Coda Formula Customizer] Google Fonts loaded');
    }

    async init() {
      try {
        console.log('[Coda Formula Customizer] Initializing...');
        
        // Load Google Fonts first
        this.loadGoogleFonts();
        
        const config = await StorageManager.getConfig();
        console.log('[Coda Formula Customizer] Configuration loaded:', config);

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

        console.log('[Coda Formula Customizer] Initialized successfully');
      } catch (error) {
        console.error('[Coda Formula Customizer] Initialization error:', error);
      }
    }

    listenForConfigChanges() {
      StorageManager.onConfigChange((newConfig) => {
        console.log('[Coda Formula Customizer] Config changed:', newConfig);
        if (this.customizer) {
          this.customizer.updateConfig(newConfig);
        }
      });
    }

    listenForMessages() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[Coda Formula Customizer] Message received:', message);
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
