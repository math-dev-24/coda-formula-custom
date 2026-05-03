/**
 * Runtime-only state shared by content-script enhancements.
 * Nothing here is persisted to chrome.storage; it resets with the page.
 */

export const sessionState = {
  dialogRect: null,
  dialogRestoreRect: null,
  dialogMaximized: false,
  panelWidthPercent: null,
  panelHidden: false,
  foldedRegionsByFormulaHash: new Map(),
  dialogGestureActive: false,
  suppressOutsideDimUntil: 0,
};
