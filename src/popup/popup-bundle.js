/**
 * Popup UI Controller - Bundled Version
 * No ES6 modules for Chrome extension compatibility
 */

(function () {
  "use strict";

  // ============================================================================
  // Configuration and Storage
  // ============================================================================

  const STORAGE_KEY = "codaFormulaConfig";

  const DEFAULT_CONFIG = {
    modalWidth: 95,
    modalHeight: 95,
    showDocumentation: true,
    documentationPosition: "right",
    editorProportion: 66,
    documentationProportion: 34,
    editorFontSize: 14,
    editorLineHeight: 1.5,
    editorFontFamily: "monospace",
    editorTheme: "light",
    showIndentGuides: true,
    indentGuideStyle: "dotted",
    highlightActiveIndent: true,
    presets: {
      default: { modalWidth: 80, modalHeight: 80, editorProportion: 66 },
      medium: { modalWidth: 90, modalHeight: 90, editorProportion: 60 },
      fullscreen: { modalWidth: 95, modalHeight: 95, editorProportion: 70 },
    },
  };

  function validateConfig(config) {
    if (!config) return false;
    if (config.modalWidth < 20 || config.modalWidth > 98) return false;
    if (config.modalHeight < 20 || config.modalHeight > 98) return false;
    const validPositions = ["left", "right", "top", "bottom", "none"];
    if (!validPositions.includes(config.documentationPosition)) return false;
    if (config.editorProportion < 30 || config.editorProportion > 80)
      return false;
    if (
      config.editorFontSize &&
      (config.editorFontSize < 10 || config.editorFontSize > 24)
    )
      return false;
    if (
      config.editorLineHeight &&
      (config.editorLineHeight < 1.0 || config.editorLineHeight > 2.5)
    )
      return false;
    const validFonts = [
      "monospace",
      "fira-code",
      "jetbrains-mono",
      "source-code-pro",
      "opendyslexic",
    ];
    if (
      config.editorFontFamily &&
      !validFonts.includes(config.editorFontFamily)
    )
      return false;
    const validThemes = [
      "light",
      "dark",
      "sepia",
      "high-contrast",
      "protanopia",
      "deuteranopia",
      "tritanopia",
    ];
    if (config.editorTheme && !validThemes.includes(config.editorTheme))
      return false;
    const validIndentStyles = ["solid", "dotted", "dashed"];
    if (
      config.indentGuideStyle &&
      !validIndentStyles.includes(config.indentGuideStyle)
    )
      return false;
    return true;
  }

  function mergeConfig(userConfig) {
    return {
      ...DEFAULT_CONFIG,
      ...userConfig,
      documentationProportion:
        100 - (userConfig.editorProportion || DEFAULT_CONFIG.editorProportion),
    };
  }

  const StorageManager = {
    async getConfig() {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const storedConfig = result[STORAGE_KEY];
        if (!storedConfig) {
          await this.saveConfig(DEFAULT_CONFIG);
          return DEFAULT_CONFIG;
        }
        return mergeConfig(storedConfig);
      } catch (error) {
        console.error("[Coda Extension] Error getting config:", error);
        return DEFAULT_CONFIG;
      }
    },

    async saveConfig(config) {
      try {
        if (!validateConfig(config)) {
          console.error("[Coda Extension] Invalid configuration");
          return false;
        }
        const finalConfig = mergeConfig(config);
        await chrome.storage.local.set({ [STORAGE_KEY]: finalConfig });
        await this.notifyConfigChange(finalConfig);
        return true;
      } catch (error) {
        console.error("[Coda Extension] Error saving config:", error);
        return false;
      }
    },

    async applyPreset(presetName) {
      try {
        const currentConfig = await this.getConfig();
        const preset = DEFAULT_CONFIG.presets[presetName];
        if (!preset) {
          console.error("[Coda Extension] Invalid preset name:", presetName);
          return false;
        }
        const newConfig = { ...currentConfig, ...preset };
        return await this.saveConfig(newConfig);
      } catch (error) {
        console.error("[Coda Extension] Error applying preset:", error);
        return false;
      }
    },

    async resetToDefaults() {
      return await this.saveConfig(DEFAULT_CONFIG);
    },

    async notifyConfigChange(config) {
      try {
        const tabs = await chrome.tabs.query({ url: "*://*.coda.io/d/*" });
        for (const tab of tabs) {
          chrome.tabs
            .sendMessage(tab.id, { type: "CONFIG_UPDATE", config: config })
            .catch(() => {});
        }
      } catch (error) {
        console.error("[Coda Extension] Error notifying config change:", error);
      }
    },
  };

  // ============================================================================
  // Popup Controller
  // ============================================================================

  class PopupController {
    constructor() {
      this.config = null;
      this.elements = {};
      this.currentTheme = "light";
      this.init();
    }

    async init() {
      this.cacheElements();
      this.loadTheme();
      this.initAccordion();
      this.attachEventListeners();
      await this.loadCurrentConfig();
      this.updateUI();
    }

    cacheElements() {
      this.elements = {
        // Theme
        themeToggle: document.getElementById("themeToggle"),

        // Presets
        presetButtons: document.querySelectorAll(".preset-btn"),

        // Modal size
        modalWidth: document.getElementById("modalWidth"),
        modalHeight: document.getElementById("modalHeight"),
        widthValue: document.getElementById("widthValue"),
        heightValue: document.getElementById("heightValue"),

        // Editor settings
        editorFontSize: document.getElementById("editorFontSize"),
        fontSizeValue: document.getElementById("fontSizeValue"),
        editorLineHeight: document.getElementById("editorLineHeight"),
        lineHeightValue: document.getElementById("lineHeightValue"),
        editorFontFamily: document.getElementById("editorFontFamily"),
        editorTheme: document.getElementById("editorTheme"),

        // Indent guides
        showIndentGuides: document.getElementById("showIndentGuides"),
        indentGuidesOptions: document.getElementById("indentGuidesOptions"),
        indentGuideStyle: document.getElementById("indentGuideStyle"),
        highlightActiveIndent: document.getElementById("highlightActiveIndent"),

        // Documentation
        showDocumentation: document.getElementById("showDocumentation"),
        documentationOptions: document.getElementById("documentationOptions"),
        positionButtons: document.querySelectorAll(".position-btn"),
        editorProportion: document.getElementById("editorProportion"),
        proportionValue: document.getElementById("proportionValue"),

        // Actions
        saveBtn: document.getElementById("saveBtn"),
        resetBtn: document.getElementById("resetBtn"),
        statusMessage: document.getElementById("statusMessage"),
      };
    }

    attachEventListeners() {
      // Theme toggle
      this.elements.themeToggle.addEventListener("click", () =>
        this.toggleTheme()
      );

      // Presets
      this.elements.presetButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => this.handlePresetClick(e));
      });

      // Modal size sliders
      this.elements.modalWidth.addEventListener("input", (e) => {
        this.elements.widthValue.textContent = `${e.target.value}%`;
      });

      this.elements.modalHeight.addEventListener("input", (e) => {
        this.elements.heightValue.textContent = `${e.target.value}%`;
      });

      // Editor settings
      this.elements.editorFontSize.addEventListener("input", (e) => {
        this.elements.fontSizeValue.textContent = `${e.target.value}px`;
      });

      this.elements.editorLineHeight.addEventListener("input", (e) => {
        this.elements.lineHeightValue.textContent = e.target.value;
      });

      // Indent guides checkbox
      this.elements.showIndentGuides.addEventListener("change", (e) => {
        this.toggleIndentGuidesOptions(e.target.checked);
      });

      // Documentation checkbox
      this.elements.showDocumentation.addEventListener("change", (e) => {
        this.toggleDocumentationOptions(e.target.checked);
      });

      // Position buttons
      this.elements.positionButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.handlePositionClick(e);
        });
      });

      // Editor proportion slider
      this.elements.editorProportion.addEventListener("input", (e) => {
        this.elements.proportionValue.textContent = `${e.target.value}%`;
      });

      // Action buttons
      this.elements.saveBtn.addEventListener("click", () => this.handleSave());
      this.elements.resetBtn.addEventListener("click", () => this.handleReset());
    }

    initAccordion() {
      const accordionHeaders = document.querySelectorAll(".accordion-header");

      accordionHeaders.forEach((header) => {
        header.addEventListener("click", () => {
          const accordionId = header.dataset.accordion;
          const content = document.querySelector(
            `[data-accordion-content="${accordionId}"]`
          );
          const isOpen = header.classList.contains("active");

          if (isOpen) {
            header.classList.remove("active");
            content.classList.remove("open");
          } else {
            header.classList.add("active");
            content.classList.add("open");
          }
        });
      });

      // Open first accordion by default
      const firstHeader = document.querySelector('[data-accordion="editor"]');
      const firstContent = document.querySelector(
        '[data-accordion-content="editor"]'
      );
      if (firstHeader && firstContent) {
        firstHeader.classList.add("active");
        firstContent.classList.add("open");
      }
    }

    async loadCurrentConfig() {
      this.config = await StorageManager.getConfig();
    }

    updateUI() {
      if (!this.config) return;

      // Modal size
      this.elements.modalWidth.value = this.config.modalWidth;
      this.elements.modalHeight.value = this.config.modalHeight;
      this.elements.widthValue.textContent = `${this.config.modalWidth}%`;
      this.elements.heightValue.textContent = `${this.config.modalHeight}%`;

      // Editor settings
      this.elements.editorFontSize.value = this.config.editorFontSize || 14;
      this.elements.fontSizeValue.textContent = `${
        this.config.editorFontSize || 14
      }px`;
      this.elements.editorLineHeight.value = this.config.editorLineHeight || 1.5;
      this.elements.lineHeightValue.textContent =
        this.config.editorLineHeight || 1.5;
      this.elements.editorFontFamily.value =
        this.config.editorFontFamily || "monospace";
      this.elements.editorTheme.value = this.config.editorTheme || "light";

      // Indent guides
      this.elements.showIndentGuides.checked =
        this.config.showIndentGuides !== false;
      this.toggleIndentGuidesOptions(this.config.showIndentGuides !== false);
      this.elements.indentGuideStyle.value =
        this.config.indentGuideStyle || "dotted";
      this.elements.highlightActiveIndent.checked =
        this.config.highlightActiveIndent !== false;

      // Documentation
      this.elements.showDocumentation.checked = this.config.showDocumentation;
      this.toggleDocumentationOptions(this.config.showDocumentation);

      // Documentation position
      this.updatePositionButtons(this.config.documentationPosition);

      // Editor proportion
      this.elements.editorProportion.value = this.config.editorProportion;
      this.elements.proportionValue.textContent = `${this.config.editorProportion}%`;

      // Check if current config matches a preset
      this.updatePresetButtons();
    }

    toggleIndentGuidesOptions(show) {
      if (show) {
        this.elements.indentGuidesOptions.classList.remove("hidden");
      } else {
        this.elements.indentGuidesOptions.classList.add("hidden");
      }
    }

    toggleDocumentationOptions(show) {
      if (show) {
        this.elements.documentationOptions.classList.remove("hidden");
      } else {
        this.elements.documentationOptions.classList.add("hidden");
      }
    }

    updatePositionButtons(position) {
      this.elements.positionButtons.forEach((btn) => {
        if (btn.dataset.position === position) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    updatePresetButtons() {
      const presets = DEFAULT_CONFIG.presets;

      this.elements.presetButtons.forEach((btn) => {
        const presetName = btn.dataset.preset;
        const preset = presets[presetName];

        if (
          preset &&
          preset.modalWidth === this.config.modalWidth &&
          preset.modalHeight === this.config.modalHeight &&
          preset.editorProportion === this.config.editorProportion
        ) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    async handlePresetClick(e) {
      const btn = e.currentTarget;
      const presetName = btn.dataset.preset;

      const success = await StorageManager.applyPreset(presetName);

      if (success) {
        await this.loadCurrentConfig();
        this.updateUI();
        this.showStatus("Préréglage appliqué avec succès !", "success");
      } else {
        this.showStatus("Erreur lors de l'application du préréglage", "error");
      }
    }

    handlePositionClick(e) {
      const btn = e.currentTarget;
      const position = btn.dataset.position;
      this.updatePositionButtons(position);
    }

    getConfigFromUI() {
      const selectedPosition = document.querySelector(".position-btn.active");

      return {
        modalWidth: parseInt(this.elements.modalWidth.value),
        modalHeight: parseInt(this.elements.modalHeight.value),
        showDocumentation: this.elements.showDocumentation.checked,
        documentationPosition: selectedPosition
          ? selectedPosition.dataset.position
          : "right",
        editorProportion: parseInt(this.elements.editorProportion.value),
        editorFontSize: parseInt(this.elements.editorFontSize.value),
        editorLineHeight: parseFloat(this.elements.editorLineHeight.value),
        editorFontFamily: this.elements.editorFontFamily.value,
        editorTheme: this.elements.editorTheme.value,
        showIndentGuides: this.elements.showIndentGuides.checked,
        indentGuideStyle: this.elements.indentGuideStyle.value,
        highlightActiveIndent: this.elements.highlightActiveIndent.checked,
      };
    }

    async handleSave() {
      const newConfig = this.getConfigFromUI();

      // Check if documentation position changed
      const positionChanged = this.config && this.config.documentationPosition !== newConfig.documentationPosition;

      const success = await StorageManager.saveConfig(newConfig);

      if (success) {
        this.config = newConfig;
        this.updatePresetButtons();

        if (positionChanged) {
          this.showStatus("Configuration sauvegardée ! Fermez et rouvrez l'éditeur de formule pour appliquer la nouvelle position.", "success");
        } else {
          this.showStatus("Configuration sauvegardée avec succès !", "success");
        }
      } else {
        this.showStatus("Erreur lors de la sauvegarde", "error");
      }
    }

    async handleReset() {
      if (!confirm("Voulez-vous vraiment réinitialiser la configuration ?")) {
        return;
      }

      const success = await StorageManager.resetToDefaults();

      if (success) {
        await this.loadCurrentConfig();
        this.updateUI();
        this.showStatus("Configuration réinitialisée !", "success");
      } else {
        this.showStatus("Erreur lors de la réinitialisation", "error");
      }
    }

    showStatus(message, type) {
      const statusEl = this.elements.statusMessage;

      statusEl.textContent = message;
      statusEl.className = `status-message ${type} show`;

      setTimeout(() => {
        statusEl.classList.remove("show");
      }, 3000);
    }

    loadTheme() {
      const savedTheme = localStorage.getItem("codaFormulaTheme") || "light";
      this.currentTheme = savedTheme;

      if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");
      }
    }

    toggleTheme() {
      this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
      document.body.classList.toggle("dark-theme");
      localStorage.setItem("codaFormulaTheme", this.currentTheme);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      new PopupController();
    });
  } else {
    new PopupController();
  }
})();
