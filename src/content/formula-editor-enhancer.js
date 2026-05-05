/**
 * FormulaEditorEnhancer - Adds folding controls and horizontal scrolling.
 * Fold regions are inferred from bracket depth and remembered by formula hash
 * for the current page session.
 */

import { ensureEnhancementStyles } from './enhancement-styles.js';
import { sessionState } from './session-state.js';
import { px } from './utils.js';

export class FormulaEditorEnhancer {
  constructor() {
    this.enhancements = new WeakMap();
  }

  enhance(formulaEditor, config = {}) {
    if (!formulaEditor || this.enhancements.has(formulaEditor)) return;

    const editable = formulaEditor.querySelector('[data-coda-ui-id="editable"][contenteditable="true"]');
    if (!editable) return;

    ensureEnhancementStyles();
    formulaEditor.classList.add('cfw-formula-editor');
    editable.classList.add('cfw-formula-editable');

    const controller = new AbortController();
    const gutterBackdrop = document.createElement('div');
    gutterBackdrop.dataset.codaFormulaFoldGutterBackdrop = 'true';
    gutterBackdrop.classList.add('cfw-formula-gutter-backdrop');

    const gutter = document.createElement('div');
    gutter.dataset.codaFormulaFoldGutter = 'true';
    gutter.classList.add('cfw-formula-gutter');

    const decorationLayer = document.createElement('div');
    decorationLayer.dataset.codaFormulaFoldDecorations = 'true';
    decorationLayer.classList.add('cfw-formula-decorations');

    formulaEditor.appendChild(gutterBackdrop);
    formulaEditor.appendChild(gutter);
    formulaEditor.appendChild(decorationLayer);

    const state = {
      controller,
      editable,
      gutter,
      gutterBackdrop,
      decorationLayer,
      refreshQueued: false,
      currentFormulaHash: null,
      latestLineInfos: null,
      restoredInitialFolds: false,
      editorObserver: null,
      editorResizeObserver: null,
      closeObserver: null,
      config,
    };

    this.enhancements.set(formulaEditor, state);
    this.bindEditor(formulaEditor, state);
    this.refreshEditorDecorations(formulaEditor, state);
  }

  updateConfig(formulaEditor, config = {}) {
    const state = this.enhancements.get(formulaEditor);
    if (!state) return;
    state.config = config;
    formulaEditor.classList.toggle('cfw-focus-mode', Boolean(config.focusMode));
    this.queueRefreshEditorDecorations(formulaEditor, state);
  }

  reset(formulaEditor) {
    const state = this.enhancements.get(formulaEditor);
    if (!state) return;

    this.rememberFoldedRegions(state.currentFormulaHash, state.latestLineInfos);
    state.controller.abort();
    if (state.editorObserver) state.editorObserver.disconnect();
    if (state.editorResizeObserver) state.editorResizeObserver.disconnect();
    if (state.closeObserver) state.closeObserver.disconnect();
    state.gutter.remove();
    state.gutterBackdrop.remove();
    state.decorationLayer.remove();
    state.editable.classList.remove('cfw-formula-editable');
    formulaEditor.classList.remove('cfw-formula-editor');
    formulaEditor.querySelectorAll('.cfw-formula-line').forEach(line => {
      line.classList.remove('cfw-formula-line');
      line.style.minWidth = '';
      line.style.marginTop = '';
      line.style.display = '';
      delete line.dataset.codaFormulaFolded;
      delete line.dataset.codaFormulaLongLine;
    });
    this.enhancements.delete(formulaEditor);
  }

  bindEditor(formulaEditor, state) {
    const { editable, controller } = state;

    editable.addEventListener('click', event => {
      const line = event.target.closest('.kr-line, .kr-paragraph');
      if (!line || line.dataset.codaFormulaFolded !== 'true') return;
      if (event.clientX < this.getLineTextEndX(line) - 8) return;
      this.unfoldLine(formulaEditor, state, line);
    }, { capture: true, signal: controller.signal });

    editable.addEventListener('beforeinput', () => {
      const selection = window.getSelection();
      const anchorNode = selection?.anchorNode;
      const anchorElement = anchorNode && (
        anchorNode.nodeType === Node.ELEMENT_NODE ? anchorNode : anchorNode.parentElement
      );
      this.unfoldLine(formulaEditor, state, anchorElement?.closest('.kr-line, .kr-paragraph'));
    }, { capture: true, signal: controller.signal });

    formulaEditor.addEventListener('scroll', () => {
      this.queueRefreshEditorDecorations(formulaEditor, state);
    }, { signal: controller.signal });

    state.editorResizeObserver = new ResizeObserver(() => {
      this.queueRefreshEditorDecorations(formulaEditor, state);
      this.queueFollowupRefresh(formulaEditor, state);
    });
    state.editorResizeObserver.observe(formulaEditor);
    state.editorResizeObserver.observe(editable);

    state.editorObserver = new MutationObserver(() => {
      this.queueRefreshEditorDecorations(formulaEditor, state);
    });
    state.editorObserver.observe(editable, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    state.closeObserver = new MutationObserver(() => {
      if (formulaEditor.isConnected) return;
      this.reset(formulaEditor);
    });

    if (document.body) {
      state.closeObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  queueRefreshEditorDecorations(formulaEditor, state) {
    if (state.refreshQueued) return;
    state.refreshQueued = true;
    requestAnimationFrame(() => this.refreshEditorDecorations(formulaEditor, state));
  }

  queueFollowupRefresh(formulaEditor, state) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.refreshEditorDecorations(formulaEditor, state));
    });
  }

  rememberAndRefresh(formulaEditor, state) {
    this.rememberFoldedRegions(state.currentFormulaHash, state.latestLineInfos);
    this.refreshEditorDecorations(formulaEditor, state);
    this.queueFollowupRefresh(formulaEditor, state);
  }

  refreshEditorDecorations(formulaEditor, state) {
    if (!formulaEditor.isConnected) {
      this.reset(formulaEditor);
      return;
    }

    state.refreshQueued = false;
    const lines = Array.from(state.editable.querySelectorAll(':scope > .kr-line, :scope > .kr-paragraph'));
    state.gutter.replaceChildren();
    state.decorationLayer.replaceChildren();
    state.editable.style.minHeight = '0';
    state.editable.style.height = 'auto';
    state.decorationLayer.style.width = '0';
    state.decorationLayer.style.height = '0';

    let depth = 0;
    const lineInfos = lines.map(line => {
      const text = this.getLineText(line);
      const depthBefore = Math.max(0, depth);
      const leadingSpaces = this.countLeadingSpaces(text);
      const indentLevel = leadingSpaces > 0 ? Math.floor(leadingSpaces / 2) : depthBefore;
      const bracketMetrics = this.getBracketLineMetrics(text, depthBefore);

      depth = bracketMetrics.depthAfter;

      return {
        line,
        text,
        depthBefore,
        depthAfter: bracketMetrics.depthAfter,
        minDepth: bracketMetrics.minDepth,
        indentLevel,
        foldBaseDepth: Math.min(depthBefore, bracketMetrics.minDepth),
        foldEndIndex: null,
        isFoldable: false,
        usesSeparateCollapsedLine: false,
      };
    });

    const formulaHash = this.hashString(lineInfos.map(info => info.text).join('\n'));
    const shouldRestoreSavedFolds = !state.restoredInitialFolds;
    state.currentFormulaHash = formulaHash;

    lineInfos.forEach((info, index) => {
      const nextInfo = lineInfos[index + 1];
      info.isFoldable = Boolean(
        nextInfo &&
        info.depthAfter > info.foldBaseDepth &&
        nextInfo.depthBefore > info.foldBaseDepth
      );

      if (info.isFoldable) {
        info.foldEndIndex = this.findFoldEnd(lineInfos, index);
        const closeInfo = lineInfos[info.foldEndIndex];
        info.usesSeparateCollapsedLine = Boolean(
          closeInfo &&
          (this.shouldUseSeparateCollapsedLine(closeInfo.text) || info.minDepth < info.depthBefore)
        );
      } else {
        delete info.line.dataset.codaFormulaFolded;
      }
    });

    if (shouldRestoreSavedFolds) {
      const savedFoldedIndexes = sessionState.foldedRegionsByFormulaHash.get(formulaHash);
      lineInfos.forEach((info, index) => {
        if (!info.isFoldable) return;
        info.line.dataset.codaFormulaFolded =
          savedFoldedIndexes && savedFoldedIndexes.has(index) ? 'true' : 'false';
      });
      state.restoredInitialFolds = true;
    }

    state.latestLineInfos = lineInfos;

    const hiddenLines = new Array(lineInfos.length).fill(false);
    lineInfos.forEach((info, index) => {
      if (!info.isFoldable || info.line.dataset.codaFormulaFolded !== 'true') return;

      const hideEndIndex = this.getFoldHideEndIndex(lineInfos, index);
      for (let i = index + 1; i <= hideEndIndex; i++) {
        hiddenLines[i] = true;
      }
    });

    lineInfos.forEach((info, index) => {
      info.line.classList.add('cfw-formula-line');
      info.line.dataset.codaFormulaLongLine = this.isLongLine(info.text, state.config) ? 'true' : 'false';
      info.line.style.minWidth = '';
      info.line.style.marginTop = '';
      info.line.style.display = hiddenLines[index] ? 'none' : 'block';
    });

    lineInfos.forEach(info => {
      if (!info.isFoldable || info.line.dataset.codaFormulaFolded !== 'true') return;
      if (!info.usesSeparateCollapsedLine) return;

      const closeInfo = lineInfos[info.foldEndIndex];
      if (!closeInfo || hiddenLines[info.foldEndIndex]) return;

      const lineHeight = closeInfo.line.getBoundingClientRect().height ||
        parseFloat(window.getComputedStyle(closeInfo.line).lineHeight) ||
        20;
      closeInfo.line.style.marginTop = px(lineHeight);
    });

    lineInfos.forEach((info, index) => {
      if (!info.isFoldable || hiddenLines[index]) return;
      this.createFoldControl(formulaEditor, state, lineInfos, index);
      this.createCollapsedSuffix(formulaEditor, state, lineInfos, index);
    });

    const editorHeight = Math.max(0, formulaEditor.offsetHeight);
    state.gutterBackdrop.style.height = px(editorHeight);
    state.gutter.style.height = px(editorHeight);
    formulaEditor.classList.toggle('cfw-focus-mode', Boolean(state.config?.focusMode));
  }

  isLongLine(text, config = {}) {
    if (!config.highlightLongLines) return false;
    const column = Number.isFinite(config.longLineColumn) ? config.longLineColumn : 120;
    return this.visibleLength(text) > column;
  }

  visibleLength(text) {
    return String(text || '').replace(/\t/g, '  ').length;
  }

  countLeadingSpaces(text) {
    const match = text.match(/^ */);
    return match ? match[0].length : 0;
  }

  getLineText(line) {
    return Array.from(line.childNodes)
      .filter(node => !(node.nodeType === Node.ELEMENT_NODE && node.dataset?.codaFormulaFoldControl === 'true'))
      .map(node => node.textContent)
      .join('')
      .replace(/\u2060/g, '');
  }

  hashString(value) {
    let hash = 2166136261;

    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(36);
  }

  getBracketLineMetrics(text, initialDepth) {
    let depth = initialDepth;
    let minDepth = initialDepth;
    let quote = null;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }
        continue;
      }

      if (char === '/' && next === '/') break;
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (char === '(' || char === '[' || char === '{') depth++;
      if (char === ')' || char === ']' || char === '}') depth--;
      minDepth = Math.min(minDepth, depth);
    }

    return {
      depthAfter: Math.max(0, depth),
      minDepth: Math.max(0, minDepth),
    };
  }

  findFoldEnd(lineInfos, startIndex) {
    const startDepth = lineInfos[startIndex].foldBaseDepth;

    for (let i = startIndex + 1; i < lineInfos.length; i++) {
      if (lineInfos[i].text.trim() && lineInfos[i].minDepth <= startDepth) {
        return i;
      }
    }

    return lineInfos.length - 1;
  }

  getFoldHideEndIndex(lineInfos, startIndex) {
    const info = lineInfos[startIndex];
    return info.usesSeparateCollapsedLine ? info.foldEndIndex - 1 : info.foldEndIndex;
  }

  setFoldedRange(lineInfos, startIndex, folded) {
    const hideEndIndex = this.getFoldHideEndIndex(lineInfos, startIndex);

    for (let i = startIndex + 1; i <= hideEndIndex; i++) {
      lineInfos[i].line.style.display = folded ? 'none' : '';
    }
    lineInfos[startIndex].line.dataset.codaFormulaFolded = folded ? 'true' : 'false';
  }

  rememberFoldedRegions(formulaHash, lineInfos) {
    if (!formulaHash || !lineInfos) return;

    const foldedIndexes = lineInfos
      .map((info, index) => (
        info.isFoldable && info.line.dataset.codaFormulaFolded === 'true' ? index : null
      ))
      .filter(index => index !== null);

    if (foldedIndexes.length) {
      sessionState.foldedRegionsByFormulaHash.set(formulaHash, new Set(foldedIndexes));
    } else {
      sessionState.foldedRegionsByFormulaHash.delete(formulaHash);
    }
  }

  getInlineClosingToken(text) {
    const trimmed = text.trim();
    const firstCloseIndex = trimmed.search(/[)\]}]/);
    if (firstCloseIndex < 0) return ')';

    const closingBracket = trimmed[firstCloseIndex];
    const afterClose = trimmed.slice(firstCloseIndex + 1).trim();
    return afterClose === ',' ? `${closingBracket},` : closingBracket;
  }

  shouldUseSeparateCollapsedLine(closeText) {
    const trimmed = closeText.trim();
    const closingMatches = trimmed.match(/[)\]}]/g) || [];
    if (closingMatches.length > 1) return true;

    const firstCloseIndex = trimmed.search(/[)\]}]/);
    if (firstCloseIndex < 0) return false;

    const afterClose = trimmed.slice(firstCloseIndex + 1).trim();
    return afterClose.length > 0 && afterClose !== ',';
  }

  getCollapsedRowSpacePrefix(lineInfos, index) {
    const info = lineInfos[index];
    const baseSpaces = this.countLeadingSpaces(info.text);
    const hideEndIndex = this.getFoldHideEndIndex(lineInfos, index);
    let collapsedSpaces = baseSpaces + 2;

    for (let i = index + 1; i <= hideEndIndex; i++) {
      const text = lineInfos[i].text;
      if (!text.trim()) continue;

      const leadingSpaces = this.countLeadingSpaces(text);
      if (leadingSpaces > baseSpaces) {
        collapsedSpaces = leadingSpaces;
        break;
      }
    }

    return ' '.repeat(collapsedSpaces);
  }

  createFoldControl(formulaEditor, state, lineInfos, index) {
    const line = lineInfos[index].line;
    const lineRect = line.getBoundingClientRect();
    const editorRect = formulaEditor.getBoundingClientRect();
    const control = document.createElement('button');
    const folded = line.dataset.codaFormulaFolded === 'true';
    const icon = document.createElement('span');

    control.type = 'button';
    control.dataset.codaFormulaFoldControl = 'true';
    control.classList.add('cfw-fold-control');
    control.style.top = px(lineRect.top - editorRect.top + lineRect.height / 2);
    control.title = folded ? 'Unfold section' : 'Fold section';

    icon.classList.add('cfw-fold-icon', folded ? 'cfw-fold-icon-folded' : 'cfw-fold-icon-open');
    control.appendChild(icon);

    control.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
    });

    control.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const shouldFold = line.dataset.codaFormulaFolded !== 'true';
      this.setFoldedRange(lineInfos, index, shouldFold);
      this.rememberAndRefresh(formulaEditor, state);
    });

    state.gutter.appendChild(control);
  }

  createCollapsedSuffix(formulaEditor, state, lineInfos, index) {
    const info = lineInfos[index];
    if (info.line.dataset.codaFormulaFolded !== 'true') return;

    if (!info.usesSeparateCollapsedLine) {
      const range = document.createRange();
      range.selectNodeContents(info.line);
      const rects = Array.from(range.getClientRects()).filter(rect => rect.width || rect.height);
      range.detach();

      const lineRect = info.line.getBoundingClientRect();
      const editorRect = formulaEditor.getBoundingClientRect();
      const anchorRect = rects[rects.length - 1] || lineRect;
      const suffix = document.createElement('span');
      const ellipsis = document.createElement('span');
      const closeBracket = document.createElement('span');
      const lineStyle = window.getComputedStyle(info.line);

      suffix.dataset.codaFormulaCollapsedSuffix = 'true';
      suffix.classList.add('cfw-collapsed-suffix');
      suffix.style.left = px(anchorRect.right - editorRect.left + formulaEditor.scrollLeft);
      suffix.style.top = px(lineRect.top - editorRect.top + formulaEditor.scrollTop + lineRect.height / 2);
      suffix.style.font = lineStyle.font;
      suffix.title = 'Unfold section';

      ellipsis.classList.add('cfw-collapsed-ellipsis');
      ellipsis.textContent = '...';

      closeBracket.textContent = this.getInlineClosingToken(lineInfos[info.foldEndIndex].text);
      closeBracket.style.color = lineStyle.color;

      suffix.appendChild(ellipsis);
      suffix.appendChild(closeBracket);
      suffix.addEventListener('pointerdown', event => {
        event.preventDefault();
        event.stopPropagation();
      });
      suffix.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        this.setFoldedRange(lineInfos, index, false);
        this.rememberAndRefresh(formulaEditor, state);
      });

      state.decorationLayer.appendChild(suffix);
      return;
    }

    const closeLine = lineInfos[info.foldEndIndex]?.line;
    if (!closeLine) return;

    const closeLineRect = closeLine.getBoundingClientRect();
    const editorRect = formulaEditor.getBoundingClientRect();
    const lineStyle = window.getComputedStyle(info.line);
    const lineHeight = closeLineRect.height || parseFloat(lineStyle.lineHeight) || 20;
    const collapsedRow = document.createElement('div');
    const suffix = document.createElement('span');

    collapsedRow.dataset.codaFormulaCollapsedRow = 'true';
    collapsedRow.classList.add('cfw-collapsed-row');
    collapsedRow.style.top = px(closeLineRect.top - editorRect.top + formulaEditor.scrollTop - lineHeight);
    collapsedRow.style.width = px(formulaEditor.clientWidth);
    collapsedRow.style.height = px(lineHeight);

    suffix.dataset.codaFormulaCollapsedSuffix = 'true';
    suffix.classList.add('cfw-collapsed-suffix', 'cfw-collapsed-row-suffix');
    suffix.style.left = '18px';
    suffix.style.top = '50%';
    suffix.style.font = lineStyle.font;
    suffix.title = 'Unfold section';
    suffix.textContent = `${this.getCollapsedRowSpacePrefix(lineInfos, index)}...`;
    suffix.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
    });
    suffix.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      this.setFoldedRange(lineInfos, index, false);
      this.rememberAndRefresh(formulaEditor, state);
    });

    collapsedRow.appendChild(suffix);
    state.decorationLayer.appendChild(collapsedRow);
  }

  getLineTextEndX(line) {
    const range = document.createRange();
    range.selectNodeContents(line);
    const rects = Array.from(range.getClientRects()).filter(rect => rect.width || rect.height);
    range.detach();

    const anchorRect = rects[rects.length - 1] || line.getBoundingClientRect();
    return anchorRect.right;
  }

  unfoldLine(formulaEditor, state, line) {
    if (!line || line.dataset.codaFormulaFolded !== 'true') return false;
    line.dataset.codaFormulaFolded = 'false';
    this.rememberFoldedRegions(state.currentFormulaHash, state.latestLineInfos);
    this.refreshEditorDecorations(formulaEditor, state);
    this.queueFollowupRefresh(formulaEditor, state);
    return true;
  }
}
