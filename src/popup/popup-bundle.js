/**
 * Popup UI Controller - Bundled Version
 * No ES6 modules for Chrome extension compatibility
 */

(function () {
  "use strict";

  // Copy of storage manager code for popup
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
    showLineNumbers: true,
    editorTheme: "light",
    presets: {
      default: { modalWidth: 80, modalHeight: 80, editorProportion: 66 },
      medium: { modalWidth: 90, modalHeight: 90, editorProportion: 60 },
      fullscreen: { modalWidth: 95, modalHeight: 95, editorProportion: 70 },
    },
  };

  function validateConfig(config) {
    if (!config) return false;
    if (config.modalWidth < 50 || config.modalWidth > 95) return false;
    if (config.modalHeight < 50 || config.modalHeight > 95) return false;
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
    ];
    if (
      config.editorFontFamily &&
      !validFonts.includes(config.editorFontFamily)
    )
      return false;
    const validThemes = ["light", "dark"];
    if (config.editorTheme && !validThemes.includes(config.editorTheme))
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

  class StorageManager {
    static async getConfig() {
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
    }

    static async saveConfig(config) {
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
    }

    static async applyPreset(presetName) {
      try {
        const currentConfig = await this.getConfig();
        const preset = DEFAULT_CONFIG.presets[presetName];
        if (!preset) return false;
        const newConfig = { ...currentConfig, ...preset };
        return await this.saveConfig(newConfig);
      } catch (error) {
        return false;
      }
    }

    static async resetToDefaults() {
      return await this.saveConfig(DEFAULT_CONFIG);
    }

    static async notifyConfigChange(config) {
      try {
        const tabs = await chrome.tabs.query({ url: "*://*.coda.io/d/*" });
        for (const tab of tabs) {
          chrome.tabs
            .sendMessage(tab.id, {
              type: "CONFIG_UPDATE",
              config: config,
            })
            .catch(() => {});
        }
      } catch (error) {}
    }

    static onConfigChange(callback) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && changes[STORAGE_KEY]) {
          const newConfig = mergeConfig(changes[STORAGE_KEY].newValue);
          callback(newConfig);
        }
      });
    }
  }

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
      this.attachEventListeners();
      await this.loadCurrentConfig();
      this.updateUI();
      this.updatePreview();
    }

    cacheElements() {
      this.elements = {
        themeToggle: document.getElementById("themeToggle"),
        previewModal: document.getElementById("previewModal"),
        previewEditor: document.getElementById("previewEditor"),
        previewEditorText: document.getElementById("previewEditorText"),
        previewDoc: document.getElementById("previewDoc"),
        previewDocText: document.getElementById("previewDocText"),
        presetButtons: document.querySelectorAll(".preset-btn"),
        modalWidth: document.getElementById("modalWidth"),
        modalHeight: document.getElementById("modalHeight"),
        widthValue: document.getElementById("widthValue"),
        heightValue: document.getElementById("heightValue"),
        editorFontSize: document.getElementById("editorFontSize"),
        fontSizeValue: document.getElementById("fontSizeValue"),
        editorLineHeight: document.getElementById("editorLineHeight"),
        lineHeightValue: document.getElementById("lineHeightValue"),
        editorFontFamily: document.getElementById("editorFontFamily"),
        editorTheme: document.getElementById("editorTheme"),
        showLineNumbers: document.getElementById("showLineNumbers"),
        showDocumentation: document.getElementById("showDocumentation"),
        documentationOptions: document.getElementById("documentationOptions"),
        positionButtons: document.querySelectorAll(".position-btn"),
        editorProportion: document.getElementById("editorProportion"),
        proportionValue: document.getElementById("proportionValue"),
        saveBtn: document.getElementById("saveBtn"),
        resetBtn: document.getElementById("resetBtn"),
        statusMessage: document.getElementById("statusMessage"),
      };
    }

    attachEventListeners() {
      this.elements.themeToggle.addEventListener("click", () =>
        this.toggleTheme()
      );

      this.elements.presetButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => this.handlePresetClick(e));
      });

      this.elements.modalWidth.addEventListener("input", (e) => {
        this.elements.widthValue.textContent = `${e.target.value}%`;
        this.updatePreview();
      });

      this.elements.modalHeight.addEventListener("input", (e) => {
        this.elements.heightValue.textContent = `${e.target.value}%`;
        this.updatePreview();
      });

      this.elements.editorFontSize.addEventListener("input", (e) => {
        this.elements.fontSizeValue.textContent = `${e.target.value}px`;
      });

      this.elements.editorLineHeight.addEventListener("input", (e) => {
        this.elements.lineHeightValue.textContent = parseFloat(
          e.target.value
        ).toFixed(1);
      });

      this.elements.showDocumentation.addEventListener("change", (e) => {
        this.toggleDocumentationOptions(e.target.checked);
        this.updatePreview();
      });

      this.elements.positionButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.handlePositionClick(e);
          this.updatePreview();
        });
      });

      this.elements.editorProportion.addEventListener("input", (e) => {
        this.elements.proportionValue.textContent = `${e.target.value}%`;
        this.updatePreview();
      });

      this.elements.saveBtn.addEventListener("click", () => this.handleSave());
      this.elements.resetBtn.addEventListener("click", () =>
        this.handleReset()
      );
    }

    async loadCurrentConfig() {
      this.config = await StorageManager.getConfig();
    }

    updateUI() {
      if (!this.config) return;

      this.elements.modalWidth.value = this.config.modalWidth;
      this.elements.modalHeight.value = this.config.modalHeight;
      this.elements.widthValue.textContent = `${this.config.modalWidth}%`;
      this.elements.heightValue.textContent = `${this.config.modalHeight}%`;

      this.elements.editorFontSize.value = this.config.editorFontSize || 14;
      this.elements.fontSizeValue.textContent = `${
        this.config.editorFontSize || 14
      }px`;

      this.elements.editorLineHeight.value =
        this.config.editorLineHeight || 1.5;
      this.elements.lineHeightValue.textContent = (
        this.config.editorLineHeight || 1.5
      ).toFixed(1);

      this.elements.editorFontFamily.value =
        this.config.editorFontFamily || "monospace";
      this.elements.editorTheme.value = this.config.editorTheme || "light";
      this.elements.showLineNumbers.checked =
        this.config.showLineNumbers !== false;

      this.elements.showDocumentation.checked = this.config.showDocumentation;
      this.toggleDocumentationOptions(this.config.showDocumentation);

      this.updatePositionButtons(this.config.documentationPosition);

      this.elements.editorProportion.value = this.config.editorProportion;
      this.elements.proportionValue.textContent = `${this.config.editorProportion}%`;

      this.updatePresetButtons();
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
        this.updatePreview();
        this.showStatus("Preset applied successfully!", "success");
      } else {
        this.showStatus("Error applying preset", "error");
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
        showLineNumbers: this.elements.showLineNumbers.checked,
        editorTheme: this.elements.editorTheme.value,
      };
    }

    async handleSave() {
      const newConfig = this.getConfigFromUI();
      const success = await StorageManager.saveConfig(newConfig);
      if (success) {
        this.config = newConfig;
        this.updatePresetButtons();
        this.showStatus(
          "Configuration saved! Close and reopen the formula to apply all changes.",
          "success"
        );
      } else {
        this.showStatus("Error saving configuration", "error");
      }
    }

    async handleReset() {
      if (!confirm("Do you really want to reset the configuration?")) {
        return;
      }
      const success = await StorageManager.resetToDefaults();
      if (success) {
        await this.loadCurrentConfig();
        this.updateUI();
        this.updatePreview();
        this.showStatus("Configuration reset!", "success");
      } else {
        this.showStatus("Error resetting configuration", "error");
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

    updatePreview() {
      const showDoc = this.elements.showDocumentation.checked;
      const position =
        document.querySelector(".position-btn.active")?.dataset.position ||
        "right";
      const modalWidth = parseInt(this.elements.modalWidth.value);
      const modalHeight = parseInt(this.elements.modalHeight.value);
      const editorProportion = parseInt(this.elements.editorProportion.value);

      const baseWidth = 180;
      const baseHeight = 100;
      const padding = 5;
      const gap = 5;

      const modalScaleW = modalWidth / 95;
      const modalScaleH = modalHeight / 95;
      const modalW = baseWidth * modalScaleW;
      const modalH = baseHeight * modalScaleH;

      this.elements.previewModal.setAttribute("width", modalW);
      this.elements.previewModal.setAttribute("height", modalH);

      const contentX = 10 + padding;
      const contentY = 10 + padding + 5;
      const contentW = modalW - padding * 2;
      const contentH = modalH - padding * 2 - 5;

      if (!showDoc) {
        this.elements.previewEditor.setAttribute("x", contentX);
        this.elements.previewEditor.setAttribute("y", contentY);
        this.elements.previewEditor.setAttribute("width", contentW);
        this.elements.previewEditor.setAttribute("height", contentH);
        this.elements.previewEditorText.setAttribute(
          "x",
          contentX + contentW / 2
        );
        this.elements.previewEditorText.setAttribute(
          "y",
          contentY + contentH / 2
        );
        this.elements.previewDoc.setAttribute("width", 0);
        this.elements.previewDoc.setAttribute("height", 0);
        this.elements.previewDocText.style.display = "none";
      } else {
        this.elements.previewDocText.style.display = "block";

        const editorSize = editorProportion / 100;
        const docSize = (100 - editorProportion) / 100;

        if (position === "left" || position === "right") {
          const editorW = (contentW - gap) * editorSize;
          const docW = (contentW - gap) * docSize;

          if (position === "left") {
            this.elements.previewDoc.setAttribute("x", contentX);
            this.elements.previewDoc.setAttribute("y", contentY);
            this.elements.previewDoc.setAttribute("width", docW);
            this.elements.previewDoc.setAttribute("height", contentH);

            this.elements.previewEditor.setAttribute(
              "x",
              contentX + docW + gap
            );
            this.elements.previewEditor.setAttribute("y", contentY);
            this.elements.previewEditor.setAttribute("width", editorW);
            this.elements.previewEditor.setAttribute("height", contentH);

            this.elements.previewEditorText.setAttribute(
              "x",
              contentX + docW + gap + editorW / 2
            );
            this.elements.previewEditorText.setAttribute(
              "y",
              contentY + contentH / 2
            );
            this.elements.previewDocText.setAttribute("x", contentX + docW / 2);
            this.elements.previewDocText.setAttribute(
              "y",
              contentY + contentH / 2
            );
          } else {
            this.elements.previewEditor.setAttribute("x", contentX);
            this.elements.previewEditor.setAttribute("y", contentY);
            this.elements.previewEditor.setAttribute("width", editorW);
            this.elements.previewEditor.setAttribute("height", contentH);

            this.elements.previewDoc.setAttribute(
              "x",
              contentX + editorW + gap
            );
            this.elements.previewDoc.setAttribute("y", contentY);
            this.elements.previewDoc.setAttribute("width", docW);
            this.elements.previewDoc.setAttribute("height", contentH);

            this.elements.previewEditorText.setAttribute(
              "x",
              contentX + editorW / 2
            );
            this.elements.previewEditorText.setAttribute(
              "y",
              contentY + contentH / 2
            );
            this.elements.previewDocText.setAttribute(
              "x",
              contentX + editorW + gap + docW / 2
            );
            this.elements.previewDocText.setAttribute(
              "y",
              contentY + contentH / 2
            );
          }
        } else {
          const editorH = (contentH - gap) * editorSize;
          const docH = (contentH - gap) * docSize;

          if (position === "top") {
            this.elements.previewDoc.setAttribute("x", contentX);
            this.elements.previewDoc.setAttribute("y", contentY);
            this.elements.previewDoc.setAttribute("width", contentW);
            this.elements.previewDoc.setAttribute("height", docH);

            this.elements.previewEditor.setAttribute("x", contentX);
            this.elements.previewEditor.setAttribute(
              "y",
              contentY + docH + gap
            );
            this.elements.previewEditor.setAttribute("width", contentW);
            this.elements.previewEditor.setAttribute("height", editorH);

            this.elements.previewEditorText.setAttribute(
              "x",
              contentX + contentW / 2
            );
            this.elements.previewEditorText.setAttribute(
              "y",
              contentY + docH + gap + editorH / 2
            );
            this.elements.previewDocText.setAttribute(
              "x",
              contentX + contentW / 2
            );
            this.elements.previewDocText.setAttribute("y", contentY + docH / 2);
          } else {
            this.elements.previewEditor.setAttribute("x", contentX);
            this.elements.previewEditor.setAttribute("y", contentY);
            this.elements.previewEditor.setAttribute("width", contentW);
            this.elements.previewEditor.setAttribute("height", editorH);

            this.elements.previewDoc.setAttribute("x", contentX);
            this.elements.previewDoc.setAttribute(
              "y",
              contentY + editorH + gap
            );
            this.elements.previewDoc.setAttribute("width", contentW);
            this.elements.previewDoc.setAttribute("height", docH);

            this.elements.previewEditorText.setAttribute(
              "x",
              contentX + contentW / 2
            );
            this.elements.previewEditorText.setAttribute(
              "y",
              contentY + editorH / 2
            );
            this.elements.previewDocText.setAttribute(
              "x",
              contentX + contentW / 2
            );
            this.elements.previewDocText.setAttribute(
              "y",
              contentY + editorH + gap + docH / 2
            );
          }
        }
      }
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
