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
    this.attachEventListeners();
    await this.loadCurrentConfig();
    this.updateUI();
    this.updatePreview();
  }

  /**
   * Cache DOM elements
   */
  cacheElements() {
    this.elements = {
      // Theme
      themeToggle: document.getElementById('themeToggle'),

      // Preview
      previewModal: document.getElementById('previewModal'),
      previewEditor: document.getElementById('previewEditor'),
      previewDoc: document.getElementById('previewDoc'),
      previewDocText: document.getElementById('previewDocText'),

      // Presets
      presetButtons: document.querySelectorAll('.preset-btn'),

      // Modal size
      modalWidth: document.getElementById('modalWidth'),
      modalHeight: document.getElementById('modalHeight'),
      widthValue: document.getElementById('widthValue'),
      heightValue: document.getElementById('heightValue'),

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

    // Modal size sliders with live preview
    this.elements.modalWidth.addEventListener('input', (e) => {
      this.elements.widthValue.textContent = `${e.target.value}%`;
      this.updatePreview();
    });

    this.elements.modalHeight.addEventListener('input', (e) => {
      this.elements.heightValue.textContent = `${e.target.value}%`;
      this.updatePreview();
    });

    // Documentation checkbox with live preview
    this.elements.showDocumentation.addEventListener('change', (e) => {
      this.toggleDocumentationOptions(e.target.checked);
      this.updatePreview();
    });

    // Position buttons with live preview
    this.elements.positionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handlePositionClick(e);
        this.updatePreview();
      });
    });

    // Editor proportion slider with live preview
    this.elements.editorProportion.addEventListener('input', (e) => {
      this.elements.proportionValue.textContent = `${e.target.value}%`;
      this.updatePreview();
    });

    // Action buttons
    this.elements.saveBtn.addEventListener('click', () => this.handleSave());
    this.elements.resetBtn.addEventListener('click', () => this.handleReset());
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
    this.elements.widthValue.textContent = `${this.config.modalWidth}%`;
    this.elements.heightValue.textContent = `${this.config.modalHeight}%`;

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
      showDocumentation: this.elements.showDocumentation.checked,
      documentationPosition: selectedPosition ? selectedPosition.dataset.position : 'right',
      editorProportion: parseInt(this.elements.editorProportion.value)
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
      this.updatePresetButtons();
      this.showStatus('Configuration sauvegardée avec succès !', 'success');
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

  /**
   * Update live preview based on current settings
   */
  updatePreview() {
    const showDoc = this.elements.showDocumentation.checked;
    const position = document.querySelector('.position-btn.active')?.dataset.position || 'right';
    const modalWidth = parseInt(this.elements.modalWidth.value);
    const modalHeight = parseInt(this.elements.modalHeight.value);
    const editorProportion = parseInt(this.elements.editorProportion.value);
    const docProportion = 100 - editorProportion;

    // Base dimensions
    const baseWidth = 180;
    const baseHeight = 100;
    const padding = 5;
    const gap = 5;

    // Calculate modal size based on percentage
    const modalScaleW = modalWidth / 95;
    const modalScaleH = modalHeight / 95;
    const modalW = baseWidth * modalScaleW;
    const modalH = baseHeight * modalScaleH;

    // Update modal size
    this.elements.previewModal.setAttribute('width', modalW);
    this.elements.previewModal.setAttribute('height', modalH);

    const contentX = 10 + padding;
    const contentY = 10 + padding + 5; // +5 for header space
    const contentW = modalW - (padding * 2);
    const contentH = modalH - (padding * 2) - 5;

    if (!showDoc) {
      // Hide documentation
      this.elements.previewEditor.setAttribute('x', contentX);
      this.elements.previewEditor.setAttribute('y', contentY);
      this.elements.previewEditor.setAttribute('width', contentW);
      this.elements.previewEditor.setAttribute('height', contentH);
      this.elements.previewDoc.setAttribute('width', 0);
      this.elements.previewDoc.setAttribute('height', 0);
      this.elements.previewDocText.style.display = 'none';
    } else {
      this.elements.previewDocText.style.display = 'block';

      // Calculate proportions
      const editorSize = editorProportion / 100;
      const docSize = docProportion / 100;

      if (position === 'left' || position === 'right') {
        // Horizontal layout
        const editorW = (contentW - gap) * editorSize;
        const docW = (contentW - gap) * docSize;

        if (position === 'left') {
          // Doc on left
          this.elements.previewDoc.setAttribute('x', contentX);
          this.elements.previewDoc.setAttribute('y', contentY);
          this.elements.previewDoc.setAttribute('width', docW);
          this.elements.previewDoc.setAttribute('height', contentH);

          this.elements.previewEditor.setAttribute('x', contentX + docW + gap);
          this.elements.previewEditor.setAttribute('y', contentY);
          this.elements.previewEditor.setAttribute('width', editorW);
          this.elements.previewEditor.setAttribute('height', contentH);

          this.elements.previewDocText.setAttribute('x', contentX + docW / 2);
          this.elements.previewDocText.setAttribute('y', contentY + contentH / 2);
        } else {
          // Doc on right
          this.elements.previewEditor.setAttribute('x', contentX);
          this.elements.previewEditor.setAttribute('y', contentY);
          this.elements.previewEditor.setAttribute('width', editorW);
          this.elements.previewEditor.setAttribute('height', contentH);

          this.elements.previewDoc.setAttribute('x', contentX + editorW + gap);
          this.elements.previewDoc.setAttribute('y', contentY);
          this.elements.previewDoc.setAttribute('width', docW);
          this.elements.previewDoc.setAttribute('height', contentH);

          this.elements.previewDocText.setAttribute('x', contentX + editorW + gap + docW / 2);
          this.elements.previewDocText.setAttribute('y', contentY + contentH / 2);
        }
      } else {
        // Vertical layout
        const editorH = (contentH - gap) * editorSize;
        const docH = (contentH - gap) * docSize;

        if (position === 'top') {
          // Doc on top
          this.elements.previewDoc.setAttribute('x', contentX);
          this.elements.previewDoc.setAttribute('y', contentY);
          this.elements.previewDoc.setAttribute('width', contentW);
          this.elements.previewDoc.setAttribute('height', docH);

          this.elements.previewEditor.setAttribute('x', contentX);
          this.elements.previewEditor.setAttribute('y', contentY + docH + gap);
          this.elements.previewEditor.setAttribute('width', contentW);
          this.elements.previewEditor.setAttribute('height', editorH);

          this.elements.previewDocText.setAttribute('x', contentX + contentW / 2);
          this.elements.previewDocText.setAttribute('y', contentY + docH / 2);
        } else {
          // Doc on bottom
          this.elements.previewEditor.setAttribute('x', contentX);
          this.elements.previewEditor.setAttribute('y', contentY);
          this.elements.previewEditor.setAttribute('width', contentW);
          this.elements.previewEditor.setAttribute('height', editorH);

          this.elements.previewDoc.setAttribute('x', contentX);
          this.elements.previewDoc.setAttribute('y', contentY + editorH + gap);
          this.elements.previewDoc.setAttribute('width', contentW);
          this.elements.previewDoc.setAttribute('height', docH);

          this.elements.previewDocText.setAttribute('x', contentX + contentW / 2);
          this.elements.previewDocText.setAttribute('y', contentY + editorH + gap + docH / 2);
        }
      }
    }
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
