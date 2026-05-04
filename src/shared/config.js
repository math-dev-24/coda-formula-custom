/**
 * Default configuration for Coda Formula Modal Customizer
 * Single source of truth for config, validation and merging
 */

export const STORAGE_KEY = 'codaFormulaConfig';
export const CONFIG_EXPORT_TYPE = 'codaFormulaCustom.configs';
export const CONFIG_EXPORT_VERSION = 1;

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
  showIndentGuides: true,
  indentGuideStyle: 'dotted',
  highlightActiveIndent: true,
  customPresets: {},
};

export const PRESET_SNAPSHOT_KEYS = [
  'modalWidth', 'modalHeight', 'modalLeft', 'modalTop', 'transparentBackground',
  'showDocumentation', 'documentationPosition', 'editorProportion', 'documentationProportion',
  'editorFontSize', 'editorLineHeight', 'editorFontFamily', 'editorTheme',
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
  if (config.modalWidth < 20 || config.modalWidth > 98) return false;
  if (config.modalHeight < 20 || config.modalHeight > 98) return false;
  if (config.modalLeft < 0 || config.modalLeft > 100) return false;
  if (config.modalTop < 0 || config.modalTop > 100) return false;

  const validPositions = ['left', 'right', 'top', 'bottom', 'none'];
  if (!validPositions.includes(config.documentationPosition)) return false;
  if (config.editorProportion < 30 || config.editorProportion > 80) return false;

  if (config.editorFontSize && (config.editorFontSize < 10 || config.editorFontSize > 24)) return false;
  if (config.editorLineHeight && (config.editorLineHeight < 1.0 || config.editorLineHeight > 2.5)) return false;

  const validFonts = ['monospace', 'fira-code', 'jetbrains-mono', 'source-code-pro', 'opendyslexic'];
  if (config.editorFontFamily && !validFonts.includes(config.editorFontFamily)) return false;

  const validThemes = ['light', 'dark', 'sepia', 'high-contrast', 'protanopia', 'deuteranopia', 'tritanopia', 'solarized', 'monokai', 'dracula'];
  if (config.editorTheme && !validThemes.includes(config.editorTheme)) return false;

  const validIndentStyles = ['solid', 'dotted', 'dashed'];
  if (config.indentGuideStyle && !validIndentStyles.includes(config.indentGuideStyle)) return false;

  return true;
}

/**
 * Merge user config with defaults
 * @param {Object} userConfig - User configuration
 * @returns {Object} Merged configuration
 */
export function mergeConfig(userConfig) {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    documentationProportion: 100 - (userConfig.editorProportion || DEFAULT_CONFIG.editorProportion),
  };
}
