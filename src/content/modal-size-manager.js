/**
 * ModalSizeManager - Handles modal size and position adjustments
 * Single Responsibility: Modal sizing and positioning
 */

export class ModalSizeManager {
  /**
   * Apply size and position to the modal root div
   * @param {HTMLElement} rootDiv - Root div of the dialog
   * @param {Object} config - Current configuration
   */
  applySize(rootDiv, config) {
    const { modalWidth, modalHeight, modalLeft, modalTop } = config;

    rootDiv.style.width = `${modalWidth}%`;
    rootDiv.style.height = `${modalHeight}%`;
    rootDiv.style.maxWidth = `${modalWidth}%`;
    rootDiv.style.maxHeight = `${modalHeight}%`;

    rootDiv.style.position = 'absolute';
    rootDiv.style.left = `${modalLeft}%`;
    rootDiv.style.top = `${modalTop}%`;
    rootDiv.style.transform = `translate(-${modalLeft}%, -${modalTop}%)`;
  }
}
