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

  const applyPreset = useCallback(async (presetName) => {
    const success = await StorageManager.applyPreset(presetName);
    if (success) {
      const newConfig = await StorageManager.getConfig();
      setConfig(newConfig);
      showStatus('Preset applied!', 'success');
    } else {
      showStatus('Error applying preset', 'error');
    }
  }, [showStatus]);

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

  return { config, updateConfig, applyPreset, resetConfig, loading, status };
}
