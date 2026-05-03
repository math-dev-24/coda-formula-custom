/** Clamp a number between two bounds. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Format a pixel value without fractional noise. */
export function px(value) {
  return `${Math.round(value)}px`;
}

/** Detect controls or editable surfaces that should keep their native behavior. */
export function isInteractiveElement(element) {
  if (!element || typeof element.closest !== 'function') return false;
  return Boolean(element.closest(
    'button, input, textarea, select, a, [role="button"], [contenteditable="true"]'
  ));
}
