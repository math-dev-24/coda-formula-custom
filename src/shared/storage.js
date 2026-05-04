/**
 * StorageManager - Handles configuration persistence
 * ACID principles: Atomicity, Consistency, Isolation, Durability
 */

import { DEFAULT_CONFIG, STORAGE_KEY, validateConfig, mergeConfig, snapshotConfig } from './config.js';

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

  static async saveCustomPreset(name) {
    try {
      const trimmed = (name || '').trim();
      if (!trimmed) return null;
      const current = await this.getConfig();
      const id = (crypto.randomUUID && crypto.randomUUID()) || `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const preset = { id, name: trimmed, createdAt: Date.now(), config: snapshotConfig(current) };
      const customPresets = { ...(current.customPresets || {}), [id]: preset };
      const success = await this.saveConfig({ ...current, customPresets });
      return success ? id : null;
    } catch (e) {
      console.error('[Coda Formula Customizer] saveCustomPreset:', e);
      return null;
    }
  }

  static async applyCustomPreset(id) {
    try {
      const current = await this.getConfig();
      const preset = current.customPresets?.[id];
      if (!preset) return false;
      return await this.saveConfig({
        ...current,
        ...preset.config,
        customPresets: current.customPresets,
      });
    } catch (e) {
      console.error('[Coda Formula Customizer] applyCustomPreset:', e);
      return false;
    }
  }

  static async renameCustomPreset(id, newName) {
    try {
      const trimmed = (newName || '').trim();
      if (!trimmed) return false;
      const current = await this.getConfig();
      const preset = current.customPresets?.[id];
      if (!preset) return false;
      const customPresets = { ...current.customPresets, [id]: { ...preset, name: trimmed } };
      return await this.saveConfig({ ...current, customPresets });
    } catch (e) {
      console.error('[Coda Formula Customizer] renameCustomPreset:', e);
      return false;
    }
  }

  static async deleteCustomPreset(id) {
    try {
      const current = await this.getConfig();
      if (!current.customPresets?.[id]) return false;
      const { [id]: _omit, ...rest } = current.customPresets;
      return await this.saveConfig({ ...current, customPresets: rest });
    } catch (e) {
      console.error('[Coda Formula Customizer] deleteCustomPreset:', e);
      return false;
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
