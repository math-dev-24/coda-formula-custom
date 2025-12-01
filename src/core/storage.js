/**
 * Storage Manager - Handles configuration persistence
 * Following ACID principles:
 * - Atomicity: All operations are complete or fail entirely
 * - Consistency: Data validation before save
 * - Isolation: Single source of truth
 * - Durability: Persistent storage via chrome.storage.local
 */

import { DEFAULT_CONFIG, validateConfig, mergeConfig } from '../config/defaults.js';

const STORAGE_KEY = 'codaFormulaConfig';

/**
 * Storage Manager Class
 */
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
        // First time - return defaults
        await this.saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }

      // Merge with defaults to ensure all keys exist
      return mergeConfig(storedConfig);
    } catch (error) {
      console.error('[Coda Extension] Error getting config:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Save configuration
   * @param {Object} config - Configuration to save
   * @returns {Promise<boolean>} Success status
   */
  static async saveConfig(config) {
    try {
      // Atomicity: Validate before save
      if (!validateConfig(config)) {
        console.error('[Coda Extension] Invalid configuration');
        return false;
      }

      // Consistency: Ensure documentation proportion is calculated
      const finalConfig = mergeConfig(config);

      // Durability: Save to persistent storage
      await chrome.storage.local.set({ [STORAGE_KEY]: finalConfig });

      // Notify content scripts of config change
      await this.notifyConfigChange(finalConfig);

      return true;
    } catch (error) {
      console.error('[Coda Extension] Error saving config:', error);
      return false;
    }
  }

  /**
   * Apply a preset configuration
   * @param {string} presetName - Name of the preset ('default', 'medium', 'fullscreen')
   * @returns {Promise<boolean>} Success status
   */
  static async applyPreset(presetName) {
    try {
      const currentConfig = await this.getConfig();
      const preset = DEFAULT_CONFIG.presets[presetName];

      if (!preset) {
        console.error('[Coda Extension] Invalid preset name:', presetName);
        return false;
      }

      // Merge preset with current config
      const newConfig = {
        ...currentConfig,
        ...preset
      };

      return await this.saveConfig(newConfig);
    } catch (error) {
      console.error('[Coda Extension] Error applying preset:', error);
      return false;
    }
  }

  /**
   * Reset to default configuration
   * @returns {Promise<boolean>} Success status
   */
  static async resetToDefaults() {
    return await this.saveConfig(DEFAULT_CONFIG);
  }

  /**
   * Notify all tabs about configuration change
   * @param {Object} config - New configuration
   */
  static async notifyConfigChange(config) {
    try {
      // Query all tabs with Coda
      const tabs = await chrome.tabs.query({ url: '*://*.coda.io/d/*' });

      // Send message to each tab
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

  /**
   * Listen for configuration changes
   * @param {Function} callback - Callback function to call when config changes
   */
  static onConfigChange(callback) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        const newConfig = mergeConfig(changes[STORAGE_KEY].newValue);
        callback(newConfig);
      }
    });
  }
}
