/**
 * Default configuration for Coda Formula Modal Customizer
 * Single source of truth for config, validation and merging
 */

export const STORAGE_KEY = 'codaFormulaConfig';
export const CONFIG_EXPORT_TYPE = 'codaFormulaCustom.configs';
export const CONFIG_EXPORT_VERSION = 1;
export const SUPPORTED_TAB_URL_PATTERNS = ['*://*.coda.io/d/*', '*://*.grammarly.com/*'];

export const DEFAULT_CONFIG = {
  modalWidth: 95,
  modalHeight: 95,
  modalLeft: 50,
  modalTop: 50,
  transparentBackground: false,
  showDocumentation: true,
  documentationPosition: 'right',
  editorProportion: 66,
  documentationProportion: 34,
  editorFontSize: 14,
  editorLineHeight: 1.5,
  editorFontFamily: 'monospace',
  editorTheme: 'light',
  focusMode: false,
  highlightLongLines: true,
  longLineColumn: 120,
  showIndentGuides: true,
  indentGuideStyle: 'dotted',
  highlightActiveIndent: true,
  customPresets: {},
};

export const PRESET_SNAPSHOT_KEYS = [
  'modalWidth', 'modalHeight', 'modalLeft', 'modalTop', 'transparentBackground',
  'showDocumentation', 'documentationPosition', 'editorProportion', 'documentationProportion',
  'editorFontSize', 'editorLineHeight', 'editorFontFamily', 'editorTheme',
  'focusMode', 'highlightLongLines', 'longLineColumn',
  'showIndentGuides', 'indentGuideStyle', 'highlightActiveIndent',
];

export function snapshotConfig(config) {
  const snap = {};
  for (const key of PRESET_SNAPSHOT_KEYS) {
    if (key in config) snap[key] = config[key];
  }
  return snap;
}

export function createPresetId() {
  return (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) || `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeCustomPreset(preset, fallbackName = 'Imported config') {
  if (!preset || typeof preset !== 'object') return null;

  const name = String(preset.name || fallbackName).trim();
  if (!name) return null;

  const config = snapshotConfig(mergeConfig(preset.config || preset));
  if (!validateConfig({ ...DEFAULT_CONFIG, ...config })) return null;

  return {
    id: String(preset.id || createPresetId()),
    name: name.slice(0, 50),
    createdAt: Number.isFinite(preset.createdAt) ? preset.createdAt : Date.now(),
    config,
  };
}

export function createConfigExport(config) {
  const presets = Object.values(config?.customPresets || {})
    .map((preset) => normalizeCustomPreset(preset))
    .filter(Boolean);

  return {
    type: CONFIG_EXPORT_TYPE,
    version: CONFIG_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    presets,
  };
}

export function parseConfigImport(payload) {
  const source = typeof payload === 'string' ? JSON.parse(payload) : payload;
  if (!source || typeof source !== 'object') return [];

  const rawPresets = Array.isArray(source)
    ? source
    : Array.isArray(source.presets)
      ? source.presets
      : source.customPresets && typeof source.customPresets === 'object'
        ? Object.values(source.customPresets)
        : [];

  return rawPresets
    .map((preset, index) => normalizeCustomPreset(preset, `Imported config ${index + 1}`))
    .filter(Boolean);
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {boolean} True if valid
 */
export function validateConfig(config) {
  if (!config) return false;
  if (!isFiniteNumber(config.modalWidth, 20, 98)) return false;
  if (!isFiniteNumber(config.modalHeight, 20, 98)) return false;
  if (!isFiniteNumber(config.modalLeft, 0, 100)) return false;
  if (!isFiniteNumber(config.modalTop, 0, 100)) return false;

  if (!isBoolean(config.transparentBackground)) return false;
  if (!isBoolean(config.showDocumentation)) return false;
  if (!isBoolean(config.focusMode)) return false;
  if (!isBoolean(config.highlightLongLines)) return false;
  if (!isBoolean(config.showIndentGuides)) return false;
  if (!isBoolean(config.highlightActiveIndent)) return false;

  const validPositions = ['left', 'right', 'top', 'bottom', 'none'];
  if (!validPositions.includes(config.documentationPosition)) return false;
  if (!isFiniteNumber(config.editorProportion, 30, 80)) return false;
  if (!isFiniteNumber(config.documentationProportion, 20, 70)) return false;

  if (!isFiniteNumber(config.editorFontSize, 10, 24)) return false;
  if (!isFiniteNumber(config.editorLineHeight, 1.0, 2.5)) return false;
  if (!isFiniteNumber(config.longLineColumn, 80, 200)) return false;

  const validFonts = ['monospace', 'fira-code', 'jetbrains-mono', 'source-code-pro', 'opendyslexic'];
  if (!validFonts.includes(config.editorFontFamily)) return false;

  const validThemes = ['light', 'dark', 'sepia', 'high-contrast', 'protanopia', 'deuteranopia', 'tritanopia', 'solarized', 'monokai', 'dracula'];
  if (!validThemes.includes(config.editorTheme)) return false;

  const validIndentStyles = ['solid', 'dotted', 'dashed'];
  if (!validIndentStyles.includes(config.indentGuideStyle)) return false;

  return true;
}

function isFiniteNumber(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function isBoolean(value) {
  return typeof value === 'boolean';
}

/**
 * Merge user config with defaults
 * @param {Object} userConfig - User configuration
 * @returns {Object} Merged configuration
 */
export function mergeConfig(userConfig) {
  const input = userConfig || {};
  return {
    ...DEFAULT_CONFIG,
    ...input,
    documentationProportion: 100 - (input.editorProportion || DEFAULT_CONFIG.editorProportion),
  };
}

export function getSortedCustomPresets(config) {
  return Object.values(config?.customPresets || {})
    .filter(preset => preset?.id && preset?.config)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function isPresetActive(config, preset) {
  if (!config || !preset?.config) return false;
  const normalizedPresetConfig = mergeConfig(preset.config);
  return PRESET_SNAPSHOT_KEYS.every(key => config[key] === normalizedPresetConfig[key]);
}

export function applyPresetToConfig(config, presetId) {
  const current = mergeConfig(config || {});
  const preset = current.customPresets?.[presetId];
  if (!preset) return null;

  return mergeConfig({
    ...current,
    ...preset.config,
    customPresets: current.customPresets,
  });
}

export function applyNextPresetToConfig(config) {
  const current = mergeConfig(config || {});
  const presets = getSortedCustomPresets(current);
  if (presets.length === 0) return null;

  const activeIndex = presets.findIndex(preset => isPresetActive(current, preset));
  return applyPresetToConfig(current, presets[(activeIndex + 1) % presets.length].id);
}

export function toggleDocumentationInConfig(config) {
  const current = mergeConfig(config || {});
  return mergeConfig({
    ...current,
    showDocumentation: !current.showDocumentation,
  });
}
