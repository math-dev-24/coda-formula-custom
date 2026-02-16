/**
 * Content Script - Entry point
 * Injected into Coda pages to customize the formula modal
 */

import { StorageManager } from '../shared/storage.js';
import { STORAGE_KEY } from '../shared/config.js';
import { ModalCustomizer } from './modal-customizer.js';

const FONT_URLS = [
  {
    id: 'coda-formula-fonts',
    href: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Source+Code+Pro:wght@400;500;600&display=swap',
  },
  {
    id: 'opendyslexic-font',
    href: 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic.min.css',
  },
];

class CodaFormulaCustomizer {
  constructor() {
    this.customizer = null;
    this.lastConfigJSON = '';
    this.init();
  }

  loadFonts() {
    FONT_URLS.forEach(({ id, href }) => {
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  async init() {
    try {
      this.loadFonts();
      const config = await StorageManager.getConfig();
      this.lastConfigJSON = JSON.stringify(config);
      this.customizer = new ModalCustomizer(config);

      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', () => this.customizer.init());
      } else {
        this.customizer.init();
      }

      this.listenForConfigChanges();
      this.listenForMessages();
      this.startConfigPolling();
    } catch (error) {
      console.error('[Coda Formula Customizer] Initialization error:', error);
    }
  }

  /** Primary: chrome.storage.onChanged listener */
  listenForConfigChanges() {
    try {
      StorageManager.onConfigChange(newConfig => {
        this.applyUpdate(newConfig);
      });
    } catch (e) {
      console.warn('[Coda Formula Customizer] storage.onChanged not available, relying on polling');
    }
  }

  /** Secondary: chrome.runtime.onMessage listener */
  listenForMessages() {
    try {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === 'CONFIG_UPDATE' && this.customizer) {
          this.applyUpdate(message.config);
          sendResponse({ success: true });
        }
        return true;
      });
    } catch (e) {
      console.warn('[Coda Formula Customizer] runtime.onMessage not available');
    }
  }

  /**
   * Fallback: poll storage every 2s for changes.
   * Needed because @crxjs dynamic import may break chrome event listeners.
   */
  startConfigPolling() {
    setInterval(async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const raw = result[STORAGE_KEY];
        if (!raw) return;
        const json = JSON.stringify(raw);
        if (json !== this.lastConfigJSON) {
          const newConfig = await StorageManager.getConfig();
          this.applyUpdate(newConfig);
        }
      } catch (e) {
        // storage not available, skip
      }
    }, 2000);
  }

  /** Apply config update (deduplicated) */
  applyUpdate(newConfig) {
    const json = JSON.stringify(newConfig);
    if (json === this.lastConfigJSON) return;
    this.lastConfigJSON = json;
    if (this.customizer) this.customizer.updateConfig(newConfig);
  }
}

new CodaFormulaCustomizer();
