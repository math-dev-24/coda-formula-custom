/**
 * Content Script - Entry point
 * Injected into Coda pages to customize the formula modal
 */

import { StorageManager } from '../shared/storage.js';
import {
  DEFAULT_CONFIG,
  STORAGE_KEY,
  applyNextPresetToConfig,
  applyPresetToConfig,
  mergeConfig,
  toggleDocumentationInConfig,
  validateConfig,
} from '../shared/config.js';
import { ModalCustomizer } from './modal-customizer.js';
import { CommandPalette } from './command-palette.js';

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
    this.commandPalette = null;
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
      this.customizer = new ModalCustomizer(config, partial => this.persistUserChange(partial));
      this.commandPalette = new CommandPalette({
        openPopup: () => this.openPopup(),
        savePartialConfig: partial => this.applyAndSaveConfig(partial),
        resetConfig: () => this.resetConfig(),
        applyPreset: id => this.applyPreset(id),
        applyNextPreset: () => this.applyNextPreset(),
      });
      this.commandPalette.init();

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

  /**
   * Persist a partial config change driven by direct user gesture.
   * Updates lastConfigJSON before saving so the storage echo is deduped
   * and we avoid a costly layout reset.
   */
  persistUserChange(partial) {
    if (!this.customizer || !partial) return;
    const merged = mergeConfig({ ...this.customizer.config, ...partial });
    const json = JSON.stringify(merged);
    if (json === this.lastConfigJSON) return;
    if (!validateConfig(merged)) return;

    this.lastConfigJSON = json;
    this.customizer.config = merged;
    if (this.customizer.dialogProcessor) {
      this.customizer.dialogProcessor.config = merged;
    }
    StorageManager.saveConfig(merged).catch(() => {});
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
        if (message.type === 'TOGGLE_DOCUMENTATION_COMMAND' && this.customizer) {
          this.applyAndSaveFullConfig(toggleDocumentationInConfig(this.customizer.config))
            .then(success => sendResponse({ success }));
        }
        if (message.type === 'APPLY_NEXT_PRESET_COMMAND' && this.customizer) {
          this.applyNextPreset().then(success => sendResponse({ success }));
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

  async openPopup() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      return Boolean(response?.success);
    } catch (error) {
      console.warn('[Coda Formula Customizer] open popup failed:', error);
      return false;
    }
  }

  async applyAndSaveConfig(partial) {
    if (!this.customizer || !partial) return false;
    const merged = mergeConfig({ ...this.customizer.config, ...partial });
    return this.applyAndSaveFullConfig(merged);
  }

  async applyAndSaveFullConfig(config) {
    if (!this.customizer || !config) return false;
    const merged = mergeConfig(config);
    if (!validateConfig(merged)) return false;

    const json = JSON.stringify(merged);
    if (json !== this.lastConfigJSON) {
      this.lastConfigJSON = json;
      this.customizer.updateConfig(merged);
    }

    return StorageManager.saveConfig(merged);
  }

  async resetConfig() {
    const current = this.customizer?.config || await StorageManager.getConfig();
    return this.applyAndSaveConfig({
      ...DEFAULT_CONFIG,
      customPresets: current.customPresets || {},
    });
  }

  async applyPreset(id) {
    const current = this.customizer?.config || await StorageManager.getConfig();
    const nextConfig = applyPresetToConfig(current, id);
    return this.applyAndSaveFullConfig(nextConfig);
  }

  async applyNextPreset() {
    const current = this.customizer?.config || await StorageManager.getConfig();
    return this.applyAndSaveFullConfig(applyNextPresetToConfig(current));
  }
}

new CodaFormulaCustomizer();
