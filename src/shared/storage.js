/**
 * StorageManager - Handles configuration persistence
 * ACID principles: Atomicity, Consistency, Isolation, Durability
 */

import {
  DEFAULT_CONFIG,
  STORAGE_KEY,
  SUPPORTED_TAB_URL_PATTERNS,
  validateConfig,
  mergeConfig,
  snapshotConfig,
  createConfigExport,
  createPresetId,
  parseConfigImport,
  applyPresetToConfig,
  applyNextPresetToConfig,
  toggleDocumentationInConfig,
} from './config.js';

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
      if (!chrome.tabs?.query || !chrome.tabs?.sendMessage) {
        await chrome.runtime?.sendMessage?.({
          type: 'BROADCAST_CONFIG_UPDATE',
          config,
        }).catch(() => {});
        return;
      }

      const tabs = await chrome.tabs.query({ url: SUPPORTED_TAB_URL_PATTERNS });
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
      const id = createPresetId();
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
      const nextConfig = applyPresetToConfig(current, id);
      if (!nextConfig) return false;
      return await this.saveConfig(nextConfig);
    } catch (e) {
      console.error('[Coda Formula Customizer] applyCustomPreset:', e);
      return false;
    }
  }

  static async applyNextCustomPreset() {
    try {
      const current = await this.getConfig();
      const nextConfig = applyNextPresetToConfig(current);
      if (!nextConfig) return false;
      return await this.saveConfig(nextConfig);
    } catch (e) {
      console.error('[Coda Formula Customizer] applyNextCustomPreset:', e);
      return false;
    }
  }

  static async toggleDocumentation() {
    try {
      const current = await this.getConfig();
      return await this.saveConfig(toggleDocumentationInConfig(current));
    } catch (e) {
      console.error('[Coda Formula Customizer] toggleDocumentation:', e);
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

  static async exportCustomPresets() {
    try {
      const current = await this.getConfig();
      return createConfigExport(current);
    } catch (e) {
      console.error('[Coda Formula Customizer] exportCustomPresets:', e);
      return null;
    }
  }

  static async importCustomPresets(payload) {
    try {
      const importedPresets = parseConfigImport(payload);
      if (importedPresets.length === 0) return { success: false, imported: 0 };

      const current = await this.getConfig();
      const customPresets = { ...(current.customPresets || {}) };

      for (const preset of importedPresets) {
        let id = preset.id;
        if (customPresets[id]) id = createPresetId();
        customPresets[id] = { ...preset, id, importedAt: Date.now() };
      }

      const success = await this.saveConfig({ ...current, customPresets });
      return { success, imported: success ? importedPresets.length : 0 };
    } catch (e) {
      console.error('[Coda Formula Customizer] importCustomPresets:', e);
      return { success: false, imported: 0 };
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
