/**
 * Default configuration for Coda Formula Modal Customizer
 * Following SOLID principles - Single Responsibility
 */

const DEFAULT_CONFIG = {
  // Modal dimensions
  modalWidth: 95, // Percentage (50-95)
  modalHeight: 95, // Percentage (50-95)

  // Documentation settings
  showDocumentation: true,
  documentationPosition: 'right', // 'left', 'right', 'top', 'bottom', 'none'

  // Layout proportions (when documentation is visible)
  // Values represent the flex ratio
  editorProportion: 66, // Percentage (30-80)
  documentationProportion: 34, // Auto-calculated as 100 - editorProportion

  // Editor settings
  editorFontSize: 14, // Font size in pixels (10-24)
  editorLineHeight: 1.5, // Line height (1.0-2.5)
  editorFontFamily: 'monospace', // monospace, fira-code, jetbrains-mono, source-code-pro
  showLineNumbers: true,
  editorTheme: 'light', // light, dark

  // Presets
  presets: {
    default: {
      modalWidth: 80,
      modalHeight: 80,
      editorProportion: 66
    },
    medium: {
      modalWidth: 90,
      modalHeight: 90,
      editorProportion: 60
    },
    fullscreen: {
      modalWidth: 95,
      modalHeight: 95,
      editorProportion: 70
    }
  }
};

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {boolean} - True if valid
 */
function validateConfig(config) {
  if (!config) return false;

  // Validate modal dimensions
  if (config.modalWidth < 50 || config.modalWidth > 95) return false;
  if (config.modalHeight < 50 || config.modalHeight > 95) return false;

  // Validate documentation position
  const validPositions = ['left', 'right', 'top', 'bottom', 'none'];
  if (!validPositions.includes(config.documentationPosition)) return false;

  // Validate proportions
  if (config.editorProportion < 30 || config.editorProportion > 80) return false;

  // Validate editor font size
  if (config.editorFontSize && (config.editorFontSize < 10 || config.editorFontSize > 24)) return false;

  // Validate editor line height
  if (config.editorLineHeight && (config.editorLineHeight < 1.0 || config.editorLineHeight > 2.5)) return false;

  // Validate font family
  const validFonts = ['monospace', 'fira-code', 'jetbrains-mono', 'source-code-pro'];
  if (config.editorFontFamily && !validFonts.includes(config.editorFontFamily)) return false;

  // Validate editor theme
  const validThemes = ['light', 'dark'];
  if (config.editorTheme && !validThemes.includes(config.editorTheme)) return false;

  return true;
}

/**
 * Merge user config with defaults
 * @param {Object} userConfig - User configuration
 * @returns {Object} - Merged configuration
 */
function mergeConfig(userConfig) {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    documentationProportion: 100 - (userConfig.editorProportion || DEFAULT_CONFIG.editorProportion)
  };
}
