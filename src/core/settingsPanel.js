/**
 * Settings Panel - Overlay configuration panel for in-page settings
 */

import { StorageManager } from './storage.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';

export class SettingsPanel {
  constructor() {
    this.panel = null;
    this.config = null;
    this.elements = {};
  }

  /**
   * Create and show the settings panel
   */
  async show() {
    // Load current config
    this.config = await StorageManager.getConfig();

    // Create panel if it doesn't exist
    if (!this.panel) {
      this.createPanel();
    }

    // Update UI with current config
    this.updateUI();

    // Show panel
    this.panel.style.display = 'block';
  }

  /**
   * Hide the settings panel
   */
  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }

  /**
   * Toggle panel visibility
   */
  async toggle() {
    if (this.panel && this.panel.style.display === 'block') {
      this.hide();
    } else {
      await this.show();
    }
  }

  /**
   * Create the panel DOM structure
   */
  createPanel() {
    // Create overlay container
    this.panel = document.createElement('div');
    this.panel.setAttribute('data-coda-formula-settings-panel', 'true');
    this.panel.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      width: 500px;
      max-height: 80vh;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 10000;
      display: none;
      overflow: hidden;
    `;

    // Create panel content
    this.panel.innerHTML = `
      <div style="padding: 20px; max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">Formula Editor Settings</h2>
          <button id="closeSettingsPanel" style="background: none; border: none; cursor: pointer; font-size: 24px; color: #6b7280;">&times;</button>
        </div>

        <!-- Modal Size Section -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">Modal Size</h3>

          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 13px; color: #6b7280;">Width</span>
              <span id="widthValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">95%</span>
            </div>
            <input type="range" id="modalWidth" min="20" max="98" value="95" style="width: 100%;" />
          </div>

          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 13px; color: #6b7280;">Height</span>
              <span id="heightValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">95%</span>
            </div>
            <input type="range" id="modalHeight" min="20" max="98" value="95" style="width: 100%;" />
          </div>

          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 13px; color: #6b7280;">Horizontal Position</span>
              <span id="leftValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">Center</span>
            </div>
            <input type="range" id="modalLeft" min="0" max="100" value="50" style="width: 100%;" />
          </div>

          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 13px; color: #6b7280;">Vertical Position</span>
              <span id="topValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">Center</span>
            </div>
            <input type="range" id="modalTop" min="0" max="100" value="50" style="width: 100%;" />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="transparentBackground" />
              <span style="font-size: 13px; color: #374151;">Transparent background</span>
            </label>
          </div>
        </div>

        <!-- Editor Settings Section -->
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 12px;">Editor Settings</h3>

          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 13px; color: #6b7280;">Font Size</span>
              <span id="fontSizeValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">14px</span>
            </div>
            <input type="range" id="editorFontSize" min="10" max="24" value="14" style="width: 100%;" />
          </div>

          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 13px; color: #6b7280;">Line Height</span>
              <span id="lineHeightValue" style="font-size: 13px; color: #4f46e5; font-weight: 500;">1.5</span>
            </div>
            <input type="range" id="editorLineHeight" min="1.0" max="2.5" step="0.1" value="1.5" style="width: 100%;" />
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px;">Font Family</label>
            <select id="editorFontFamily" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
              <option value="monospace">Monospace</option>
              <option value="fira-code">Fira Code</option>
              <option value="jetbrains-mono">JetBrains Mono</option>
              <option value="source-code-pro">Source Code Pro</option>
              <option value="opendyslexic">OpenDyslexic</option>
            </select>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; font-size: 13px; color: #6b7280; margin-bottom: 4px;">Theme</label>
            <select id="editorTheme" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="sepia">Sepia</option>
              <option value="high-contrast">High Contrast</option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="resetSettingsBtn" style="padding: 8px 16px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: #374151;">Reset</button>
          <button id="saveSettingsBtn" style="padding: 8px 16px; background: #4f46e5; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: white;">Save</button>
        </div>

        <div id="settingsStatus" style="margin-top: 12px; padding: 8px; border-radius: 6px; font-size: 13px; text-align: center; display: none;"></div>
      </div>
    `;

    // Append to body
    document.body.appendChild(this.panel);

    // Cache elements
    this.cacheElements();

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      closeBtn: this.panel.querySelector('#closeSettingsPanel'),
      saveBtn: this.panel.querySelector('#saveSettingsBtn'),
      resetBtn: this.panel.querySelector('#resetSettingsBtn'),
      status: this.panel.querySelector('#settingsStatus'),

      // Modal size
      modalWidth: this.panel.querySelector('#modalWidth'),
      modalHeight: this.panel.querySelector('#modalHeight'),
      modalLeft: this.panel.querySelector('#modalLeft'),
      modalTop: this.panel.querySelector('#modalTop'),
      widthValue: this.panel.querySelector('#widthValue'),
      heightValue: this.panel.querySelector('#heightValue'),
      leftValue: this.panel.querySelector('#leftValue'),
      topValue: this.panel.querySelector('#topValue'),
      transparentBackground: this.panel.querySelector('#transparentBackground'),

      // Editor settings
      editorFontSize: this.panel.querySelector('#editorFontSize'),
      fontSizeValue: this.panel.querySelector('#fontSizeValue'),
      editorLineHeight: this.panel.querySelector('#editorLineHeight'),
      lineHeightValue: this.panel.querySelector('#lineHeightValue'),
      editorFontFamily: this.panel.querySelector('#editorFontFamily'),
      editorTheme: this.panel.querySelector('#editorTheme')
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    this.elements.closeBtn.addEventListener('click', () => this.hide());

    // Close on outside click
    this.panel.addEventListener('click', (e) => {
      if (e.target === this.panel) {
        this.hide();
      }
    });

    // Sliders
    this.elements.modalWidth.addEventListener('input', (e) => {
      this.elements.widthValue.textContent = `${e.target.value}%`;
    });

    this.elements.modalHeight.addEventListener('input', (e) => {
      this.elements.heightValue.textContent = `${e.target.value}%`;
    });

    this.elements.modalLeft.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      let label = 'Center';
      if (value < 25) label = 'Left';
      else if (value > 75) label = 'Right';
      this.elements.leftValue.textContent = label;
    });

    this.elements.modalTop.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      let label = 'Center';
      if (value < 25) label = 'Top';
      else if (value > 75) label = 'Bottom';
      this.elements.topValue.textContent = label;
    });

    this.elements.editorFontSize.addEventListener('input', (e) => {
      this.elements.fontSizeValue.textContent = `${e.target.value}px`;
    });

    this.elements.editorLineHeight.addEventListener('input', (e) => {
      this.elements.lineHeightValue.textContent = e.target.value;
    });

    // Action buttons
    this.elements.saveBtn.addEventListener('click', () => this.handleSave());
    this.elements.resetBtn.addEventListener('click', () => this.handleReset());
  }

  /**
   * Update UI with current configuration
   */
  updateUI() {
    if (!this.config) return;

    // Modal size
    this.elements.modalWidth.value = this.config.modalWidth;
    this.elements.modalHeight.value = this.config.modalHeight;
    this.elements.modalLeft.value = this.config.modalLeft || 50;
    this.elements.modalTop.value = this.config.modalTop || 50;
    this.elements.widthValue.textContent = `${this.config.modalWidth}%`;
    this.elements.heightValue.textContent = `${this.config.modalHeight}%`;

    const leftValue = this.config.modalLeft || 50;
    let leftLabel = 'Center';
    if (leftValue < 25) leftLabel = 'Left';
    else if (leftValue > 75) leftLabel = 'Right';
    this.elements.leftValue.textContent = leftLabel;

    const topValue = this.config.modalTop || 50;
    let topLabel = 'Center';
    if (topValue < 25) topLabel = 'Top';
    else if (topValue > 75) topLabel = 'Bottom';
    this.elements.topValue.textContent = topLabel;

    this.elements.transparentBackground.checked = this.config.transparentBackground || false;

    // Editor settings
    this.elements.editorFontSize.value = this.config.editorFontSize || 14;
    this.elements.fontSizeValue.textContent = `${this.config.editorFontSize || 14}px`;
    this.elements.editorLineHeight.value = this.config.editorLineHeight || 1.5;
    this.elements.lineHeightValue.textContent = this.config.editorLineHeight || 1.5;
    this.elements.editorFontFamily.value = this.config.editorFontFamily || 'monospace';
    this.elements.editorTheme.value = this.config.editorTheme || 'light';
  }

  /**
   * Get configuration from UI
   */
  getConfigFromUI() {
    return {
      modalWidth: parseInt(this.elements.modalWidth.value),
      modalHeight: parseInt(this.elements.modalHeight.value),
      modalLeft: parseInt(this.elements.modalLeft.value),
      modalTop: parseInt(this.elements.modalTop.value),
      transparentBackground: this.elements.transparentBackground.checked,
      showDocumentation: this.config.showDocumentation,
      documentationPosition: this.config.documentationPosition,
      editorProportion: this.config.editorProportion,
      editorFontSize: parseInt(this.elements.editorFontSize.value),
      editorLineHeight: parseFloat(this.elements.editorLineHeight.value),
      editorFontFamily: this.elements.editorFontFamily.value,
      editorTheme: this.elements.editorTheme.value,
      showIndentGuides: this.config.showIndentGuides,
      indentGuideStyle: this.config.indentGuideStyle,
      highlightActiveIndent: this.config.highlightActiveIndent
    };
  }

  /**
   * Handle save button click
   */
  async handleSave() {
    const newConfig = this.getConfigFromUI();
    const success = await StorageManager.saveConfig(newConfig);

    if (success) {
      this.config = newConfig;
      this.showStatus('Settings saved successfully!', 'success');

      // Notify that config changed (modalCustomizer will pick it up)
      window.dispatchEvent(new CustomEvent('codaFormulaConfigChanged', { detail: newConfig }));

      // Auto-close after 1 second
      setTimeout(() => this.hide(), 1000);
    } else {
      this.showStatus('Error saving settings', 'error');
    }
  }

  /**
   * Handle reset button click
   */
  async handleReset() {
    if (!confirm('Reset all settings to defaults?')) {
      return;
    }

    const success = await StorageManager.resetToDefaults();

    if (success) {
      this.config = await StorageManager.getConfig();
      this.updateUI();
      this.showStatus('Settings reset to defaults!', 'success');

      // Notify that config changed
      window.dispatchEvent(new CustomEvent('codaFormulaConfigChanged', { detail: this.config }));
    } else {
      this.showStatus('Error resetting settings', 'error');
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type) {
    const statusEl = this.elements.status;
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    statusEl.style.background = type === 'success' ? '#d1fae5' : '#fee2e2';
    statusEl.style.color = type === 'success' ? '#065f46' : '#991b1b';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}
