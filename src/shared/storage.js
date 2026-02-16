/**
 * StorageManager - Handles configuration persistence
 * ACID principles: Atomicity, Consistency, Isolation, Durability
 */

import { DEFAULT_CONFIG, STORAGE_KEY, validateConfig, mergeConfig } from './config.js';

export class StorageManager {
  /**
   * Get current configuration
   * @returns {Promise<Object>} Current configuration
   */
  static async getConfig() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const storedConfig = result[STORAGE_KEY];
      if (!storedConfig) {
        await this.saveConfig(DEFAULT_CONFIG);
        return { ...DEFAULT_CONFIG };
      }
      return mergeConfig(storedConfig);
    } catch (error) {
      console.error('[Coda Formula Customizer] Error getting config:', error);
      return { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save configuration
   * @param {Object} config - Configuration to save
   * @returns {Promise<boolean>} Success status
   */
  static async saveConfig(config) {
    try {
      if (!validateConfig(config)) {
        console.error('[Coda Formula Customizer] Invalid configuration');
        return false;
      }
      const finalConfig = mergeConfig(config);
      await chrome.storage.local.set({ [STORAGE_KEY]: finalConfig });
      await this.notifyConfigChange(finalConfig);
      return true;
    } catch (error) {
      console.error('[Coda Formula Customizer] Error saving config:', error);
      return false;
    }
  }

  /**
   * Apply a preset configuration
   * @param {string} presetName - Preset name
   * @returns {Promise<boolean>} Success status
   */
  static async applyPreset(presetName) {
    try {
      const currentConfig = await this.getConfig();
      const preset = DEFAULT_CONFIG.presets[presetName];
      if (!preset) {
        console.error('[Coda Formula Customizer] Invalid preset:', presetName);
        return false;
      }
      return await this.saveConfig({ ...currentConfig, ...preset });
    } catch (error) {
      console.error('[Coda Formula Customizer] Error applying preset:', error);
      return false;
    }
  }

  /**
   * Reset to default configuration
   * @returns {Promise<boolean>} Success status
   */
  static async resetToDefaults() {
    return await this.saveConfig({ ...DEFAULT_CONFIG });
  }

  /**
   * Notify all Coda tabs about configuration change
   * @param {Object} config - New configuration
   */
  static async notifyConfigChange(config) {
    try {
      const tabs = await chrome.tabs.query({ url: '*://*.coda.io/d/*' });
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONFIG_UPDATE',
          config,
        }).catch(() => {});
      }
    } catch (error) {
      console.error('[Coda Formula Customizer] Error notifying:', error);
    }
  }

  /**
   * Listen for configuration changes from storage
   * @param {Function} callback - Called with new config
   */
  static onConfigChange(callback) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        callback(mergeConfig(changes[STORAGE_KEY].newValue));
      }
    });
  }
}
