const STYLE_ID = 'coda-formula-enhancement-styles';

export function ensureEnhancementStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .cfw-dialog-root {
      position: fixed !important;
      margin: 0 !important;
      transform: none !important;
      resize: both !important;
      overflow: hidden !important;
      min-width: 480px !important;
      min-height: 320px !important;
      max-width: calc(100vw - 16px) !important;
      max-height: calc(100vh - 16px) !important;
      box-sizing: border-box !important;
      opacity: 1;
      transition: opacity 120ms ease;
    }

    .cfw-dialog-root.cfw-dialog-dimmed {
      opacity: 0.5;
    }

    .cfw-panel-layout {
      display: flex;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      gap: 0;
      min-width: 0;
      min-height: 0;
    }

    .cfw-panel-main,
    .cfw-panel-side {
      min-width: 0;
      min-height: 0;
    }

    .cfw-panel-side {
      overflow: auto;
    }

    .cfw-panel-handle {
      cursor: col-resize;
      position: relative;
      z-index: 2;
      touch-action: none;
      background: transparent;
      border-left: 1px rgb(var(--neutral200-rgb, 240, 240, 240)) solid;
      border-right: 1px rgb(var(--neutral200-rgb, 240, 240, 240)) solid;
      box-sizing: border-box;
    }

    .cfw-panel-handle.cfw-panel-handle-horizontal {
      flex: 0 0 6px;
      width: 6px;
    }

    .cfw-panel-handle.cfw-panel-handle-vertical {
      flex: 0 0 6px;
      height: 6px;
      cursor: row-resize;
      border-left: 0;
      border-right: 0;
      border-top: 1px rgb(var(--neutral200-rgb, 240, 240, 240)) solid;
      border-bottom: 1px rgb(var(--neutral200-rgb, 240, 240, 240)) solid;
    }

    .cfw-panel-handle-dots {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      gap: 2px;
      pointer-events: none;
    }

    .cfw-panel-handle-vertical .cfw-panel-handle-dots {
      flex-direction: row;
    }

    .cfw-panel-handle-dot {
      width: 2px;
      height: 2px;
      border-radius: 50%;
      background: rgb(var(--neutral400-rgb, 190, 190, 190));
    }

    .cfw-formula-editor {
      position: relative;
      overflow-x: auto !important;
      overflow-y: auto !important;
      min-width: 0 !important;
    }

    .cfw-formula-editor::-webkit-scrollbar-corner {
      background: transparent;
    }

    .cfw-formula-editable {
      position: relative;
      z-index: 1;
      min-width: 100%;
      padding-right: 14px;
      box-sizing: border-box;
    }

    .cfw-formula-gutter-backdrop {
      position: absolute;
      left: 0;
      top: 0;
      width: 16px;
      pointer-events: none;
      z-index: 3;
      background: rgb(var(--neutral100-rgb, 248, 248, 248));
      border-right: 1px solid rgba(var(--neutral200-rgb, 230, 230, 230), 0.7);
      box-sizing: border-box;
    }

    .cfw-formula-gutter {
      position: absolute;
      left: 0;
      top: 0;
      width: 16px;
      overflow: hidden;
      pointer-events: none;
      z-index: 4;
    }

    .cfw-formula-decorations {
      position: absolute;
      left: 0;
      top: 0;
      pointer-events: none;
      z-index: 2;
      width: 0;
      height: 0;
      overflow: visible;
    }

    .cfw-formula-line {
      position: relative;
      display: block;
      width: max-content;
      min-width: 100%;
      padding-left: 18px;
      box-sizing: border-box;
      white-space: pre !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
    }

    .cfw-formula-line .kr-span {
      white-space: pre !important;
      overflow-wrap: normal !important;
      word-break: normal !important;
    }

    .cfw-formula-line::after {
      content: "";
      display: inline-block;
      width: 14px;
      height: 1px;
    }

    .cfw-fold-control {
      position: absolute;
      left: 2px;
      transform: translateY(-50%);
      width: 12px;
      height: 16px;
      padding: 0;
      border: 0;
      background: transparent;
      color: rgb(var(--neutral500-rgb, 130, 130, 130));
      cursor: pointer;
      pointer-events: auto;
    }

    .cfw-fold-icon {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 0;
      height: 0;
      transform: translate(-50%, -50%);
    }

    .cfw-fold-icon-folded {
      border-top: 3px solid transparent;
      border-bottom: 3px solid transparent;
      border-left: 6px solid rgb(var(--neutral500-rgb, 130, 130, 130));
    }

    .cfw-fold-icon-open {
      border-left: 3px solid transparent;
      border-right: 3px solid transparent;
      border-top: 6px solid rgb(var(--neutral500-rgb, 130, 130, 130));
    }

    .cfw-collapsed-suffix {
      position: absolute;
      transform: translateY(-50%);
      cursor: pointer;
      pointer-events: auto;
      white-space: pre;
    }

    .cfw-collapsed-ellipsis,
    .cfw-collapsed-row-suffix {
      color: rgb(var(--neutral500-rgb, 130, 130, 130));
    }

    .cfw-collapsed-row {
      position: absolute;
      left: 0;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}
