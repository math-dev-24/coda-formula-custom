/**
 * Content Script - Entry point for the extension
 * Injected into Coda pages to customize the formula modal
 */

import { StorageManager } from './core/storage.js';
import { initializeCustomizer } from './core/modalCustomizer.js';

/**
 * Main application class
 */
class CodaFormulaCustomizer {
  constructor() {
    this.customizer = null;
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('[Coda Formula Customizer] Initializing...');

      // Load configuration
      const config = await StorageManager.getConfig();
      console.log('[Coda Formula Customizer] Configuration loaded:', config);

      // Initialize customizer
      this.customizer = initializeCustomizer(config);

      // Listen for configuration changes
      this.listenForConfigChanges();

      // Listen for messages from popup
      this.listenForMessages();

      console.log('[Coda Formula Customizer] Initialized successfully');
    } catch (error) {
      console.error('[Coda Formula Customizer] Initialization error:', error);
    }
  }

  /**
   * Listen for configuration changes from storage
   */
  listenForConfigChanges() {
    StorageManager.onConfigChange((newConfig) => {
      console.log('[Coda Formula Customizer] Config changed:', newConfig);

      if (this.customizer) {
        this.customizer.updateConfig(newConfig);
      }
    });
  }

  /**
   * Listen for messages from the popup or background script
   */
  listenForMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[Coda Formula Customizer] Message received:', message);

      if (message.type === 'CONFIG_UPDATE') {
        if (this.customizer) {
          this.customizer.updateConfig(message.config);
          sendResponse({ success: true });
        }
      }

      return true; // Keep the message channel open for async response
    });
  }
}

// Initialize the application
new CodaFormulaCustomizer();
