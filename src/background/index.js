import { StorageManager } from '../shared/storage.js';
import { SUPPORTED_TAB_URL_PATTERNS } from '../shared/config.js';

const SUPPORTED_APP_URL_RE = /^https?:\/\/(?:[^/]+\.)?(?:coda\.io\/d\/|grammarly\.com\/)/;

async function applyNextPreset() {
  const liveSuccess = await sendCommandToActiveCodaTab({ type: 'APPLY_NEXT_PRESET_COMMAND' });
  if (liveSuccess) return true;

  return StorageManager.applyNextCustomPreset();
}

async function toggleDocumentation() {
  const liveSuccess = await sendCommandToActiveCodaTab({ type: 'TOGGLE_DOCUMENTATION_COMMAND' });
  if (liveSuccess) return true;

  return StorageManager.toggleDocumentation();
}

async function sendCommandToActiveCodaTab(message) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url || !SUPPORTED_APP_URL_RE.test(tab.url)) return false;

    const response = await chrome.tabs.sendMessage(tab.id, message);
    return Boolean(response?.success);
  } catch (_error) {
    return false;
  }
}

async function broadcastConfigUpdate(config) {
  const tabs = await chrome.tabs.query({ url: SUPPORTED_TAB_URL_PATTERNS });
  await Promise.all(tabs.map(tab => (
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONFIG_UPDATE',
      config,
    }).catch(() => {})
  )));
  return true;
}

async function openPopup() {
  if (!chrome.action?.openPopup) return false;
  try {
    await chrome.action.openPopup();
    return true;
  } catch (error) {
    console.warn('[Coda Formula Customizer] Could not open popup:', error);
    return false;
  }
}

chrome.commands?.onCommand.addListener(command => {
  if (command === 'apply-next-preset') {
    applyNextPreset().catch(error => {
      console.error('[Coda Formula Customizer] apply-next-preset failed:', error);
    });
    return;
  }

  if (command === 'toggle-documentation') {
    toggleDocumentation().catch(error => {
      console.error('[Coda Formula Customizer] toggle-documentation failed:', error);
    });
  }
});

chrome.runtime?.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'OPEN_POPUP') {
    openPopup().then(success => sendResponse({ success }));
    return true;
  }

  if (message?.type === 'APPLY_NEXT_PRESET') {
    applyNextPreset().then(success => sendResponse({ success }));
    return true;
  }

  if (message?.type === 'TOGGLE_DOCUMENTATION') {
    toggleDocumentation().then(success => sendResponse({ success }));
    return true;
  }

  if (message?.type === 'BROADCAST_CONFIG_UPDATE') {
    broadcastConfigUpdate(message.config).then(success => sendResponse({ success }));
    return true;
  }

  return false;
});
