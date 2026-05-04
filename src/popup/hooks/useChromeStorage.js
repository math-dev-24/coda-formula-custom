import { useState, useEffect, useCallback } from 'react';
import { StorageManager } from '../../shared/storage.js';
import { DEFAULT_CONFIG } from '../../shared/config.js';

/**
 * Hook to sync React state with chrome.storage.local
 */
export function useChromeStorage() {
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ message: '', type: '' });

  useEffect(() => {
    StorageManager.getConfig().then(cfg => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  const showStatus = useCallback((message, type) => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 3000);
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
    saveCustomPreset,
    applyCustomPreset,
    renameCustomPreset,
    deleteCustomPreset,
    exportCustomPresets,
    importCustomPresets,
  };
}
