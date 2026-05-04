/**
 * StyleManager - Handles all styling operations
 * Single Responsibility: Style application and CSS injection
 */

export class StyleManager {
  constructor() {
    this.fontMap = {
      'monospace': 'monospace',
      'fira-code': '"Fira Code", "Cascadia Code", monospace',
      'jetbrains-mono': '"JetBrains Mono", monospace',
      'source-code-pro': '"Source Code Pro", monospace',
      'opendyslexic': '"OpenDyslexic", "OpenDyslexic3", "Comic Sans MS", sans-serif',
    };
    this.styleElementId = 'coda-formula-editor-styles';
    this.indentGuideId = 'coda-indent-guides-styles';
    this.indentObserver = null;
  }

  /**
   * Apply all editor styles (font, theme, indent guides)
   * @param {HTMLElement} formulaDiv - The formula editor element
   * @param {Object} config - Current configuration
   */
  applyEditorStyles(formulaDiv, config) {
    if (!formulaDiv) return;
    this.injectGlobalStyles(config);
    this.applyInlineStyles(formulaDiv, config);
    this.applyToEditorElements(formulaDiv, config);
    this.applyTheme(formulaDiv, config);
    this.applyIndentGuides(config);
  }

  /**
   * Inject global CSS styles with high specificity
   * @param {Object} config - Current configuration
   */
  injectGlobalStyles(config) {
    const existingStyle = document.getElementById(this.styleElementId);
    if (existingStyle) existingStyle.remove();

    const styleEl = document.createElement('style');
    styleEl.id = this.styleElementId;

    const fontFamily = this.fontMap[config.editorFontFamily] || 'monospace';
    const fontSize = config.editorFontSize || 14;
    const lineHeight = config.editorLineHeight || 1.5;

    styleEl.textContent = `
      [data-coda-ui-id="formula-editor"],
      [data-coda-ui-id="formula-editor"] *,
      [data-coda-ui-id="formula-editor"] .kr-slate-editor,
      [data-coda-ui-id="formula-editor"] .kr-line,
      [data-coda-ui-id="formula-editor"] .kr-span,
      [data-coda-ui-id="formula-editor"] .kr-paragraph,
      [data-coda-ui-id="formula-editor"] div[data-editable-id],
      [data-coda-ui-id="formula-editor"] span[class*="kr-"] {
        font-family: ${fontFamily} !important;
        font-size: ${fontSize}px !important;
        line-height: ${lineHeight} !important;
      }
      [data-coda-ui-id="formula-editor"] .kr-object-e,
      [data-coda-ui-id="formula-editor"] .E8UyKa9Q,
      [data-coda-ui-id="formula-editor"] .n3CTm3JI {
        font-family: ${fontFamily} !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  /**
   * Apply inline styles to formula div
   * @param {HTMLElement} formulaDiv - The formula editor element
   * @param {Object} config - Current configuration
   */
  applyInlineStyles(formulaDiv, config) {
    const fontFamily = this.fontMap[config.editorFontFamily] || 'monospace';
    if (config.editorFontSize) {
      formulaDiv.style.setProperty('font-size', `${config.editorFontSize}px`, 'important');
    }
    if (config.editorLineHeight) {
      formulaDiv.style.setProperty('line-height', `${config.editorLineHeight}`, 'important');
    }
    if (config.editorFontFamily) {
      formulaDiv.style.setProperty('font-family', fontFamily, 'important');
    }
  }

  /**
   * Apply styles to all editor elements (Monaco/Slate)
   * @param {HTMLElement} formulaDiv - The formula editor element
   * @param {Object} config - Current configuration
   */
  applyToEditorElements(formulaDiv, config) {
    const fontFamily = this.fontMap[config.editorFontFamily] || 'monospace';
    const selectors = [
      '.monaco-editor', '.view-lines', '.view-line', '.mtk1',
      '.monaco-editor .view-line span', '.monaco-editor-background',
      '.margin', '.line-numbers',
      '.kr-slate-editor', '.kr-line', '.kr-span', '.kr-paragraph',
      '.oxXY9v4G', 'div[data-editable-id]', 'span[class*="kr-"]',
    ];

    selectors.forEach(selector => {
      formulaDiv.querySelectorAll(selector).forEach(el => {
        if (config.editorFontSize) el.style.setProperty('font-size', `${config.editorFontSize}px`, 'important');
        if (config.editorLineHeight) el.style.setProperty('line-height', `${config.editorLineHeight}`, 'important');
        if (config.editorFontFamily) el.style.setProperty('font-family', fontFamily, 'important');
      });
    });
  }

  /**
   * Apply theme (background and text colors)
   * @param {HTMLElement} formulaDiv - The formula editor element
   * @param {Object} config - Current configuration
   */
  applyTheme(formulaDiv, config) {
    const themes = {
      light: { bg: '#ffffff', color: '#000000' },
      dark: { bg: '#1e1e1e', color: '#d4d4d4' },
      sepia: { bg: '#f4ecd8', color: '#5b4636' },
      'high-contrast': { bg: '#000000', color: '#ffffff' },
      protanopia: { bg: '#f5f5f0', color: '#005a9c' },
      deuteranopia: { bg: '#f0f0f5', color: '#8b4513' },
      tritanopia: { bg: '#fff5f0', color: '#c41e3a' },
      solarized: { bg: '#002b36', color: '#839496' },
      monokai: { bg: '#272822', color: '#f8f8f2' },
      dracula: { bg: '#282a36', color: '#f8f8f2' },
    };
    const theme = themes[config.editorTheme] || themes.light;

    formulaDiv.style.setProperty('background-color', theme.bg, 'important');
    formulaDiv.style.setProperty('color', theme.color, 'important');

    const monacoBackground = formulaDiv.querySelector('.monaco-editor-background');
    if (monacoBackground) {
      monacoBackground.style.setProperty('background-color', theme.bg, 'important');
    }
  }

  /**
   * Apply indent guides with pastel rainbow colors
   * @param {Object} config - Current configuration
   */
  applyIndentGuides(config) {
    if (!config.showIndentGuides) {
      const existingStyle = document.getElementById(this.indentGuideId);
      if (existingStyle) existingStyle.remove();
      this.stopIndentObserver();
      document.querySelectorAll('[data-indent-level], [data-indent-guides]').forEach(line => {
        line.removeAttribute('data-indent-level');
        line.removeAttribute('data-indent-guides');
      });
      return;
    }

    const pastelColors = [
      'rgba(255, 120, 130, 0.8)',
      'rgba(255, 180, 120, 0.8)',
      'rgba(240, 220, 100, 0.8)',
      'rgba(120, 220, 150, 0.8)',
      'rgba(120, 180, 255, 0.8)',
      'rgba(200, 140, 210, 0.8)',
      'rgba(255, 150, 190, 0.8)',
      'rgba(180, 130, 130, 0.8)',
    ];

    const guideStyle = config.indentGuideStyle || 'solid';

    /**
     * Build a CSS background-image for a single guide line at a given position.
     * - solid: continuous 1px line
     * - dashed: repeating 6px on / 4px off
     * - dotted: repeating 2px on / 3px off
     */
    const buildGuide = (pos, color) => {
      if (guideStyle === 'solid') {
        return `linear-gradient(to right, transparent ${pos}em, ${color} ${pos}em, ${color} calc(${pos}em + 1px), transparent calc(${pos}em + 1px))`;
      }
      // For dashed / dotted we use a repeating-linear-gradient on the Y axis
      // combined with a positioned background
      const dash = guideStyle === 'dashed' ? '6px' : '2px';
      const gap  = guideStyle === 'dashed' ? '4px' : '3px';
      return `repeating-linear-gradient(to bottom, ${color} 0, ${color} ${dash}, transparent ${dash}, transparent calc(${dash} + ${gap}))`;
    };

    let css = `
      .kr-slate-editor .kr-line,
      .kr-slate-editor .kr-paragraph { position: relative; }
      .kr-slate-editor .kr-line[data-indent-guides]::before,
      .kr-slate-editor .kr-paragraph[data-indent-guides]::before {
        content: ''; position: absolute; left: 0; top: 0; bottom: 0;
        pointer-events: none; z-index: 0;
      }
    `;

    const offset = -0.4;
    for (let i = 0; i < pastelColors.length; i++) {
      const indentLevel = i + 1;

      if (guideStyle === 'solid') {
        // Solid: use a single background-image with multiple gradient stops
        const guides = [];
        for (let j = 1; j <= indentLevel; j++) {
          const pos = (j * 2 - 1) * 0.6 + offset;
          guides.push(buildGuide(pos, pastelColors[j - 1]));
        }
        css += `
          .kr-slate-editor .kr-line[data-indent-level="${indentLevel}"]::before,
          .kr-slate-editor .kr-paragraph[data-indent-level="${indentLevel}"]::before {
            background-image: ${guides.join(', ')};
            width: 100%; opacity: ${config.highlightActiveIndent ? '0.7' : '0.5'};
          }
        `;
      } else {
        // Dashed / dotted: need separate pseudo-element layers via box-shadow trick
        // or multiple backgrounds with explicit positions
        const bgs = [];
        const positions = [];
        const sizes = [];
        for (let j = 1; j <= indentLevel; j++) {
          const pos = (j * 2 - 1) * 0.6 + offset;
          bgs.push(buildGuide(pos, pastelColors[j - 1]));
          positions.push(`${pos}em 0`);
          sizes.push(`1px 100%`);
        }
        css += `
          .kr-slate-editor .kr-line[data-indent-level="${indentLevel}"]::before,
          .kr-slate-editor .kr-paragraph[data-indent-level="${indentLevel}"]::before {
            background-image: ${bgs.join(', ')};
            background-position: ${positions.join(', ')};
            background-size: ${sizes.join(', ')};
            background-repeat: repeat-y;
            width: 100%; opacity: ${config.highlightActiveIndent ? '0.7' : '0.5'};
          }
        `;
      }

      if (config.highlightActiveIndent) {
        css += `
          .kr-slate-editor .kr-line[data-indent-level="${indentLevel}"]:hover::before,
          .kr-slate-editor .kr-paragraph[data-indent-level="${indentLevel}"]:hover::before {
            opacity: 1;
          }
        `;
      }
    }

    let styleElement = document.getElementById(this.indentGuideId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = this.indentGuideId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;

    this.updateIndentLevels();
    this.startIndentObserver();
  }

  /** Detect and mark indent levels on editor lines */
  updateIndentLevels() {
    document.querySelectorAll('.kr-slate-editor').forEach(editor => {
      editor.querySelectorAll('.kr-line, .kr-paragraph').forEach(line => {
        const firstSpan = line.querySelector('.kr-span:first-child');
        if (!firstSpan) return;
        const leadingSpaces = (firstSpan.textContent || '').match(/^(\s*)/)[0].length;
        const indentLevel = Math.floor(leadingSpaces / 2);
        if (indentLevel > 0 && indentLevel <= 8) {
          line.setAttribute('data-indent-level', indentLevel);
          line.setAttribute('data-indent-guides', 'true');
        } else {
          line.removeAttribute('data-indent-level');
          line.removeAttribute('data-indent-guides');
        }
      });
    });
  }

  /** Start observing editor for changes to update indent guides */
  startIndentObserver() {
    if (this.indentObserver) this.indentObserver.disconnect();
    this.indentObserver = new MutationObserver(() => this.updateIndentLevels());
    document.querySelectorAll('.kr-slate-editor').forEach(editor => {
      this.indentObserver.observe(editor, {
        childList: true, subtree: true, characterData: true,
      });
    });
  }

  /** Stop observing editor changes */
  stopIndentObserver() {
    if (this.indentObserver) {
      this.indentObserver.disconnect();
      this.indentObserver = null;
    }
  }

  /**
   * Reset all styles on an element
   * @param {HTMLElement} element - Element to reset
   */
  resetStyles(element) {
    const props = [
      'display', 'flex', 'overflow', 'order',
      'borderLeft', 'borderRight', 'borderTop', 'borderBottom',
      'flexDirection', 'height', 'width', 'maxWidth', 'maxHeight',
    ];
    props.forEach(prop => { element.style[prop] = ''; });
  }
}
