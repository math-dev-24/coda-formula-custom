import { useState, useEffect, useCallback, useRef } from 'react';
import { StorageManager } from '../../shared/storage.js';
import { DEFAULT_CONFIG, STORAGE_KEY, mergeConfig } from '../../shared/config.js';

/**
 * Hook to sync React state with chrome.storage.local
 */
export function useChromeStorage() {
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [activeTab, setActiveTab] = useState({ supported: false, label: 'No active supported tab' });
  const statusTimeoutRef = useRef(null);

  useEffect(() => {
    StorageManager.getConfig().then(cfg => {
      setConfig(cfg);
      setLoading(false);
    });

    refreshActiveTab();
  }, []);

  useEffect(() => {
    const listener = (changes, areaName) => {
      if (areaName !== 'local' || !changes[STORAGE_KEY]?.newValue) return;
      setConfig(mergeConfig(changes[STORAGE_KEY].newValue));
    };

    chrome.storage?.onChanged?.addListener(listener);
    return () => {
      chrome.storage?.onChanged?.removeListener(listener);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const showStatus = useCallback((message, type) => {
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    setStatus({ message, type });
    statusTimeoutRef.current = setTimeout(() => {
      setStatus({ message: '', type: '' });
      statusTimeoutRef.current = null;
    }, 3000);
  }, []);

  const refreshActiveTab = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs?.query?.({ active: true, currentWindow: true }) || [];
      const url = tab?.url || '';
      const supported =
        /^https?:\/\/(?:[^/]+\.)?coda\.io\/d\//.test(url) ||
        /^https?:\/\/(?:[^/]+\.)?grammarly\.com\//.test(url);
      setActiveTab({
        supported,
        label: supported
          ? (url.includes('grammarly.com') ? 'Active on Grammarly' : 'Active on Coda')
          : 'Open Coda or Grammarly to use live commands',
      });
    } catch (_error) {
      setActiveTab({ supported: false, label: 'Tab status unavailable' });
    }
  }, []);

  const saveConfig = useCallback(async (newConfig) => {
    const success = await StorageManager.saveConfig(newConfig);
    if (!success) {
      showStatus('Error saving configuration', 'error');
    }
    return success;
  }, [showStatus]);

  /** Update a single config key and save immediately */
  const updateConfig = useCallback((key, value) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      saveConfig(next);
      return next;
    });
  }, [saveConfig]);

  const resetConfig = useCallback(async () => {
    const success = await StorageManager.resetToDefaults();
    if (success) {
      const newConfig = await StorageManager.getConfig();
      setConfig(newConfig);
      showStatus('Configuration reset!', 'success');
    } else {
      showStatus('Error resetting configuration', 'error');
    }
  }, [showStatus]);

  const saveCustomPreset = useCallback(async (name) => {
    const id = await StorageManager.saveCustomPreset(name);
    if (id) {
      const cfg = await StorageManager.getConfig();
      setConfig(cfg);
      showStatus('Preset saved!', 'success');
      return id;
    }
    showStatus('Could not save preset', 'error');
    return null;
  }, [showStatus]);

  const applyCustomPreset = useCallback(async (id) => {
    const ok = await StorageManager.applyCustomPreset(id);
    if (ok) {
      const cfg = await StorageManager.getConfig();
      setConfig(cfg);
      showStatus('Preset applied!', 'success');
    } else {
      showStatus('Could not apply preset', 'error');
    }
  }, [showStatus]);

  const renameCustomPreset = useCallback(async (id, name) => {
    const ok = await StorageManager.renameCustomPreset(id, name);
    if (ok) {
      const cfg = await StorageManager.getConfig();
      setConfig(cfg);
    } else {
      showStatus('Could not rename', 'error');
    }
  }, [showStatus]);

  const deleteCustomPreset = useCallback(async (id) => {
    const ok = await StorageManager.deleteCustomPreset(id);
    if (ok) {
      const cfg = await StorageManager.getConfig();
      setConfig(cfg);
      showStatus('Preset deleted', 'success');
    } else {
      showStatus('Could not delete', 'error');
    }
  }, [showStatus]);

  const duplicateCustomPreset = useCallback(async (id) => {
    const duplicateId = await StorageManager.duplicateCustomPreset(id);
    if (duplicateId) {
      const cfg = await StorageManager.getConfig();
      setConfig(cfg);
      showStatus('Preset duplicated', 'success');
      return duplicateId;
    }
    showStatus('Could not duplicate preset', 'error');
    return null;
  }, [showStatus]);

  const exportCustomPresets = useCallback(async () => {
    const exported = await StorageManager.exportCustomPresets();
    if (!exported) {
      showStatus('Could not export configs', 'error');
      return null;
    }
    showStatus('Configs exported', 'success');
    return exported;
  }, [showStatus]);

  const importCustomPresets = useCallback(async (payload) => {
    const result = await StorageManager.importCustomPresets(payload);
    if (result.success) {
      const cfg = await StorageManager.getConfig();
      setConfig(cfg);
      showStatus(`${result.imported} config${result.imported > 1 ? 's' : ''} imported`, 'success');
      return result;
    }
    showStatus('Could not import configs', 'error');
    return result;
  }, [showStatus]);

  return {
    config,
    updateConfig,
    resetConfig,
    loading,
    status,
    activeTab,
    refreshActiveTab,
    saveCustomPreset,
    applyCustomPreset,
    renameCustomPreset,
    duplicateCustomPreset,
    deleteCustomPreset,
    exportCustomPresets,
    importCustomPresets,
  };
}
