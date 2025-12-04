/**
 * Popup UI Controller
 * Manages the user interface for the extension settings
 */

import { StorageManager } from '../core/storage.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';

class PopupController {
  constructor() {
    this.config = null;
    this.elements = {};
    this.currentTheme = 'light';
    this.init();
  }

  /**
   * Initialize the popup controller
   */
  async init() {
    this.cacheElements();
    this.loadTheme();
    this.initAccordion();
    this.attachEventListeners();
    await this.loadCurrentConfig();
    this.updateUI();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Theme
      themeToggle: document.getElementById('themeToggle'),

      // Presets
      presetButtons: document.querySelectorAll('.preset-btn'),

      // Modal size
      modalWidth: document.getElementById('modalWidth'),
      modalHeight: document.getElementById('modalHeight'),
      modalLeft: document.getElementById('modalLeft'),
      modalTop: document.getElementById('modalTop'),
      widthValue: document.getElementById('widthValue'),
      heightValue: document.getElementById('heightValue'),
      leftValue: document.getElementById('leftValue'),
      topValue: document.getElementById('topValue'),
      transparentBackground: document.getElementById('transparentBackground'),

      // Editor settings
      editorFontSize: document.getElementById('editorFontSize'),
      fontSizeValue: document.getElementById('fontSizeValue'),
      editorLineHeight: document.getElementById('editorLineHeight'),
      lineHeightValue: document.getElementById('lineHeightValue'),
      editorFontFamily: document.getElementById('editorFontFamily'),
      editorTheme: document.getElementById('editorTheme'),

      // Indent guides
      showIndentGuides: document.getElementById('showIndentGuides'),
      indentGuidesOptions: document.getElementById('indentGuidesOptions'),
      indentGuideStyle: document.getElementById('indentGuideStyle'),
      highlightActiveIndent: document.getElementById('highlightActiveIndent'),

      // Documentation
      showDocumentation: document.getElementById('showDocumentation'),
      documentationOptions: document.getElementById('documentationOptions'),
      positionButtons: document.querySelectorAll('.position-btn'),
      editorProportion: document.getElementById('editorProportion'),
      proportionValue: document.getElementById('proportionValue'),

      // Actions
      saveBtn: document.getElementById('saveBtn'),
      resetBtn: document.getElementById('resetBtn'),
      statusMessage: document.getElementById('statusMessage')
    };
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Theme toggle
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());

    // Presets
    this.elements.presetButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handlePresetClick(e));
    });

    // Modal size sliders
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

    // Editor settings
    this.elements.editorFontSize.addEventListener('input', (e) => {
      this.elements.fontSizeValue.textContent = `${e.target.value}px`;
    });

    this.elements.editorLineHeight.addEventListener('input', (e) => {
      this.elements.lineHeightValue.textContent = e.target.value;
    });

    // Indent guides checkbox
    this.elements.showIndentGuides.addEventListener('change', (e) => {
      this.toggleIndentGuidesOptions(e.target.checked);
    });

    // Documentation checkbox
    this.elements.showDocumentation.addEventListener('change', (e) => {
      this.toggleDocumentationOptions(e.target.checked);
    });

    // Position buttons
    this.elements.positionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handlePositionClick(e);
      });
    });

    // Editor proportion slider
    this.elements.editorProportion.addEventListener('input', (e) => {
      this.elements.proportionValue.textContent = `${e.target.value}%`;
    });

    // Action buttons
    this.elements.saveBtn.addEventListener('click', () => this.handleSave());
    this.elements.resetBtn.addEventListener('click', () => this.handleReset());
  }

  /**
   * Initialize accordion functionality
   */
  initAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const accordionId = header.dataset.accordion;
        const content = document.querySelector(`[data-accordion-content="${accordionId}"]`);
        const isOpen = header.classList.contains('active');

        // Toggle current accordion
        if (isOpen) {
          header.classList.remove('active');
          content.classList.remove('open');
        } else {
          header.classList.add('active');
          content.classList.add('open');
        }
      });
    });

    // Open first accordion by default (Editor Settings)
    const firstHeader = document.querySelector('[data-accordion="editor"]');
    const firstContent = document.querySelector('[data-accordion-content="editor"]');
    if (firstHeader && firstContent) {
      firstHeader.classList.add('active');
      firstContent.classList.add('open');
    }
  }

  /**
   * Load current configuration
   */
  async loadCurrentConfig() {
    this.config = await StorageManager.getConfig();
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

    // Transparent background
    this.elements.transparentBackground.checked = this.config.transparentBackground || false;

    // Editor settings
    this.elements.editorFontSize.value = this.config.editorFontSize || 14;
    this.elements.fontSizeValue.textContent = `${this.config.editorFontSize || 14}px`;
    this.elements.editorLineHeight.value = this.config.editorLineHeight || 1.5;
    this.elements.lineHeightValue.textContent = this.config.editorLineHeight || 1.5;
    this.elements.editorFontFamily.value = this.config.editorFontFamily || 'monospace';
    this.elements.editorTheme.value = this.config.editorTheme || 'light';

    // Indent guides
    this.elements.showIndentGuides.checked = this.config.showIndentGuides !== false;
    this.toggleIndentGuidesOptions(this.config.showIndentGuides !== false);
    this.elements.indentGuideStyle.value = this.config.indentGuideStyle || 'dotted';
    this.elements.highlightActiveIndent.checked = this.config.highlightActiveIndent !== false;

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

  /**
   * Toggle indent guides options visibility
   * @param {boolean} show - Whether to show the options
   */
  toggleIndentGuidesOptions(show) {
    if (show) {
      this.elements.indentGuidesOptions.classList.remove('hidden');
    } else {
      this.elements.indentGuidesOptions.classList.add('hidden');
    }
  }

  /**
   * Toggle documentation options visibility
   * @param {boolean} show - Whether to show the options
   */
  toggleDocumentationOptions(show) {
    if (show) {
      this.elements.documentationOptions.classList.remove('hidden');
    } else {
      this.elements.documentationOptions.classList.add('hidden');
    }
  }

  /**
   * Update position buttons active state
   * @param {string} position - Current position
   */
  updatePositionButtons(position) {
    this.elements.positionButtons.forEach(btn => {
      if (btn.dataset.position === position) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Update preset buttons active state
   */
  updatePresetButtons() {
    const presets = DEFAULT_CONFIG.presets;

    this.elements.presetButtons.forEach(btn => {
      const presetName = btn.dataset.preset;
      const preset = presets[presetName];

      if (preset &&
          preset.modalWidth === this.config.modalWidth &&
          preset.modalHeight === this.config.modalHeight &&
          preset.editorProportion === this.config.editorProportion) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Handle preset button click
   * @param {Event} e - Click event
   */
  async handlePresetClick(e) {
    const btn = e.currentTarget;
    const presetName = btn.dataset.preset;

    const success = await StorageManager.applyPreset(presetName);

    if (success) {
      await this.loadCurrentConfig();
      this.updateUI();
      this.showStatus('Préréglage appliqué avec succès !', 'success');
    } else {
      this.showStatus('Erreur lors de l\'application du préréglage', 'error');
    }
  }

  /**
   * Handle position button click
   * @param {Event} e - Click event
   */
  handlePositionClick(e) {
    const btn = e.currentTarget;
    const position = btn.dataset.position;
    this.updatePositionButtons(position);
  }

  /**
   * Get current configuration from UI
   * @returns {Object} Current configuration
   */
  getConfigFromUI() {
    const selectedPosition = document.querySelector('.position-btn.active');

    return {
      modalWidth: parseInt(this.elements.modalWidth.value),
      modalHeight: parseInt(this.elements.modalHeight.value),
      modalLeft: parseInt(this.elements.modalLeft.value),
      modalTop: parseInt(this.elements.modalTop.value),
      transparentBackground: this.elements.transparentBackground.checked,
      showDocumentation: this.elements.showDocumentation.checked,
      documentationPosition: selectedPosition ? selectedPosition.dataset.position : 'right',
      editorProportion: parseInt(this.elements.editorProportion.value),
      editorFontSize: parseInt(this.elements.editorFontSize.value),
      editorLineHeight: parseFloat(this.elements.editorLineHeight.value),
      editorFontFamily: this.elements.editorFontFamily.value,
      editorTheme: this.elements.editorTheme.value,
      showIndentGuides: this.elements.showIndentGuides.checked,
      indentGuideStyle: this.elements.indentGuideStyle.value,
      highlightActiveIndent: this.elements.highlightActiveIndent.checked
    };
  }

  /**
   * Handle save button click
   */
  async handleSave() {
    const newConfig = this.getConfigFromUI();

    // Check if documentation position changed
    const positionChanged = this.config && this.config.documentationPosition !== newConfig.documentationPosition;

    const success = await StorageManager.saveConfig(newConfig);

    if (success) {
      this.config = newConfig;
      this.updatePresetButtons();

      if (positionChanged) {
        this.showStatus('Configuration sauvegardée ! Fermez et rouvrez l\'éditeur de formule pour appliquer la nouvelle position.', 'success');
      } else {
        this.showStatus('Configuration sauvegardée avec succès !', 'success');
      }
    } else {
      this.showStatus('Erreur lors de la sauvegarde', 'error');
    }
  }

  /**
   * Handle reset button click
   */
  async handleReset() {
    if (!confirm('Voulez-vous vraiment réinitialiser la configuration ?')) {
      return;
    }

    const success = await StorageManager.resetToDefaults();

    if (success) {
      await this.loadCurrentConfig();
      this.updateUI();
      this.showStatus('Configuration réinitialisée !', 'success');
    } else {
      this.showStatus('Erreur lors de la réinitialisation', 'error');
    }
  }

  /**
   * Show status message
   * @param {string} message - Message to show
   * @param {string} type - Message type ('success' or 'error')
   */
  showStatus(message, type) {
    const statusEl = this.elements.statusMessage;

    statusEl.textContent = message;
    statusEl.className = `status-message ${type} show`;

    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);
  }

  /**
   * Load theme from localStorage
   */
  loadTheme() {
    const savedTheme = localStorage.getItem('codaFormulaTheme') || 'light';
    this.currentTheme = savedTheme;

    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  }

  /**
   * Toggle theme between light and dark
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('codaFormulaTheme', this.currentTheme);
  }

}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
  });
} else {
  new PopupController();
}
