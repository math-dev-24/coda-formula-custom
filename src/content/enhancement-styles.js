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

    .cfw-formula-line[data-coda-formula-long-line="true"] {
      box-shadow: inset -3px 0 0 rgba(237, 106, 82, 0.55);
      background-image: linear-gradient(to right, transparent, transparent calc(100% - 12px), rgba(237, 106, 82, 0.08));
    }

    .cfw-panel-layout:has(.cfw-focus-mode) > .cfw-panel-side,
    .cfw-panel-layout:has(.cfw-focus-mode) > .cfw-panel-handle {
      display: none !important;
    }

    .cfw-panel-layout:has(.cfw-focus-mode) > .cfw-panel-main {
      flex: 1 1 100% !important;
    }

    .cfw-focus-mode {
      box-shadow: inset 0 0 0 2px rgba(237, 106, 82, 0.22);
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

    .cfw-command-palette-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: min(12vh, 96px) 16px 16px;
      background: rgba(17, 24, 39, 0.22);
      box-sizing: border-box;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .cfw-command-palette {
      width: min(640px, 100%);
      max-height: min(560px, calc(100vh - 48px));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #111827;
      background: #ffffff;
      border: 1px solid rgba(17, 24, 39, 0.12);
      border-radius: 8px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.25);
    }

    .cfw-command-palette-input-wrap {
      position: relative;
      border-bottom: 1px solid #e5e7eb;
    }

    .cfw-command-palette-input {
      width: 100%;
      height: 52px;
      padding: 0 132px 0 16px;
      border: 0;
      outline: 0;
      box-sizing: border-box;
      font: 500 15px/1.4 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #111827;
      background: #ffffff;
    }

    .cfw-command-palette-input::placeholder {
      color: #6b7280;
    }

    .cfw-command-palette-shortcut {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      font-size: 11px;
      line-height: 1;
      padding: 5px 7px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #f9fafb;
      pointer-events: none;
    }

    .cfw-command-palette-list {
      overflow-y: auto;
      padding: 6px;
    }

    .cfw-command-palette-item {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr;
      gap: 2px;
      padding: 10px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    .cfw-command-palette-item.is-selected,
    .cfw-command-palette-item:hover {
      background: #eef2ff;
    }

    .cfw-command-palette-item-title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      font-weight: 650;
      color: #111827;
    }

    .cfw-command-palette-item-subtitle {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: #6b7280;
    }

    .cfw-command-palette-empty,
    .cfw-command-palette-status {
      padding: 12px 14px;
      color: #6b7280;
      font-size: 12px;
    }

    .cfw-command-palette-status:empty {
      display: none;
    }

    @media (prefers-color-scheme: dark) {
      .cfw-command-palette {
        color: #f9fafb;
        background: #111827;
        border-color: rgba(255, 255, 255, 0.12);
      }

      .cfw-command-palette-input-wrap {
        border-bottom-color: rgba(255, 255, 255, 0.12);
      }

      .cfw-command-palette-input {
        color: #f9fafb;
        background: #111827;
      }

      .cfw-command-palette-input::placeholder,
      .cfw-command-palette-shortcut,
      .cfw-command-palette-item-subtitle,
      .cfw-command-palette-empty,
      .cfw-command-palette-status {
        color: #9ca3af;
      }

      .cfw-command-palette-shortcut {
        border-color: rgba(255, 255, 255, 0.16);
        background: #1f2937;
      }

      .cfw-command-palette-item.is-selected,
      .cfw-command-palette-item:hover {
        background: #1f2937;
      }

      .cfw-command-palette-item-title {
        color: #f9fafb;
      }
    }
  `;
  document.head.appendChild(style);
}
