/**
 * Default configuration for Coda Formula Modal Customizer
 * Single source of truth for config, validation and merging
 */

export const STORAGE_KEY = 'codaFormulaConfig';

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
  presets: {
    default: { modalWidth: 80, modalHeight: 80, editorProportion: 66 },
    medium: { modalWidth: 90, modalHeight: 90, editorProportion: 60 },
    fullscreen: { modalWidth: 95, modalHeight: 95, editorProportion: 70 },
  },
};

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

  const validThemes = ['light', 'dark', 'sepia', 'high-contrast', 'protanopia', 'deuteranopia', 'tritanopia'];
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
