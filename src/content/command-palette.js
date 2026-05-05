import { ensureEnhancementStyles } from './enhancement-styles.js';
import { StorageManager } from '../shared/storage.js';
import { PRESET_SNAPSHOT_KEYS } from '../shared/config.js';

const PALETTE_SHORTCUT = 'Alt/Option+Shift+P';
const DOC_POSITIONS = [
  ['right', 'Move documentation right', '/doc right'],
  ['left', 'Move documentation left', '/doc left'],
  ['bottom', 'Move documentation bottom', '/doc bottom'],
  ['top', 'Move documentation top', '/doc top'],
  ['none', 'Hide documentation panel', '/doc none'],
];

function getSortedPresets(config) {
  return Object.values(config.customPresets || {})
    .filter(preset => preset?.id && preset?.config)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function matchesPreset(config, preset) {
  return PRESET_SNAPSHOT_KEYS.every(key => config[key] === preset.config?.[key]);
}

function searchText(command) {
  return [command.title, command.subtitle, ...(command.aliases || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export class CommandPalette {
  constructor(actions = {}) {
    this.actions = actions;
    this.config = null;
    this.root = null;
    this.input = null;
    this.list = null;
    this.status = null;
    this.commands = [];
    this.filteredCommands = [];
    this.selectedIndex = 0;
    this.controller = null;
  }

  init() {
    ensureEnhancementStyles();
    window.addEventListener('keydown', event => {
      if (!this.isPaletteShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
      this.toggle();
    }, { capture: true });
  }

  isPaletteShortcut(event) {
    return event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'p';
  }

  async toggle() {
    if (this.root) {
      this.close();
      return;
    }
    await this.open();
  }

  async open() {
    this.config = await StorageManager.getConfig();
    this.commands = this.buildCommands(this.config);
    this.filteredCommands = this.commands;
    this.selectedIndex = 0;
    this.render();
  }

  close() {
    this.controller?.abort();
    this.root?.remove();
    this.root = null;
    this.input = null;
    this.list = null;
    this.status = null;
  }

  buildCommands(config) {
    const commands = [
      {
        id: 'open-popup',
        title: 'Open extension popup',
        subtitle: 'Open the full Coda Formula Customizer panel',
        aliases: ['/popup', 'settings', 'config'],
        run: () => this.openPopup(),
      },
      {
        id: 'next-preset',
        title: 'Apply next saved preset',
        subtitle: 'Cycle through your preset library',
        aliases: ['/next', '/preset next', 'switch config'],
        run: () => this.applyNextPreset(),
      },
      {
        id: 'toggle-docs',
        title: config.showDocumentation ? 'Hide documentation' : 'Show documentation',
        subtitle: 'Toggle the Coda formula documentation panel',
        aliases: ['/docs', '/documentation'],
        run: () => this.savePartial({ showDocumentation: !this.config.showDocumentation }),
      },
      {
        id: 'toggle-indent-guides',
        title: config.showIndentGuides ? 'Hide indent guides' : 'Show indent guides',
        subtitle: 'Toggle formula indentation guides',
        aliases: ['/guides', '/indent'],
        run: () => this.savePartial({ showIndentGuides: !this.config.showIndentGuides }),
      },
      {
        id: 'reset',
        title: 'Reset to defaults',
        subtitle: 'Restore the default formula editor configuration',
        aliases: ['/reset', 'defaults'],
        run: () => this.resetToDefaults(),
      },
    ];

    for (const [position, label, alias] of DOC_POSITIONS) {
      commands.push({
        id: `doc-${position}`,
        title: label,
        subtitle: 'Change documentation placement',
        aliases: [alias, 'documentation position'],
        run: () => this.savePartial({
          documentationPosition: position,
          showDocumentation: position !== 'none',
        }),
      });
    }

    for (const preset of getSortedPresets(config)) {
      const active = matchesPreset(config, preset);
      commands.push({
        id: `preset-${preset.id}`,
        title: `Apply preset: ${preset.name}`,
        subtitle: active ? 'Current preset' : 'Saved configuration',
        aliases: ['/preset', '/config', preset.name],
        run: () => this.applyPreset(preset.id),
      });
    }

    return commands;
  }

  render() {
    this.controller = new AbortController();
    this.root = document.createElement('div');
    this.root.className = 'cfw-command-palette-backdrop';
    this.root.innerHTML = `
      <div class="cfw-command-palette" role="dialog" aria-modal="true" aria-label="Coda Formula Customizer command palette">
        <div class="cfw-command-palette-input-wrap">
          <input class="cfw-command-palette-input" type="text" autocomplete="off" spellcheck="false" placeholder="Type /popup, /next, /docs, or a preset name" />
          <span class="cfw-command-palette-shortcut">${PALETTE_SHORTCUT}</span>
        </div>
        <div class="cfw-command-palette-list" role="listbox"></div>
        <div class="cfw-command-palette-status" aria-live="polite"></div>
      </div>
    `;

    document.body.appendChild(this.root);
    this.input = this.root.querySelector('.cfw-command-palette-input');
    this.list = this.root.querySelector('.cfw-command-palette-list');
    this.status = this.root.querySelector('.cfw-command-palette-status');

    this.root.addEventListener('pointerdown', event => {
      if (event.target === this.root) this.close();
    }, { signal: this.controller.signal });

    this.input.addEventListener('input', () => this.filter(this.input.value), {
      signal: this.controller.signal,
    });
    this.input.addEventListener('keydown', event => this.handleInputKeydown(event), {
      signal: this.controller.signal,
    });

    this.renderList();
    requestAnimationFrame(() => this.input?.focus());
  }

  filter(query) {
    const normalizedQuery = query.trim().toLowerCase();
    this.filteredCommands = normalizedQuery
      ? this.commands.filter(command => searchText(command).includes(normalizedQuery))
      : this.commands;
    this.selectedIndex = 0;
    this.renderList();
  }

  renderList() {
    if (!this.list) return;
    if (this.filteredCommands.length === 0) {
      this.list.innerHTML = '<div class="cfw-command-palette-empty">No matching command</div>';
      return;
    }

    this.list.innerHTML = '';
    this.filteredCommands.forEach((command, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = `cfw-command-palette-item${index === this.selectedIndex ? ' is-selected' : ''}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', index === this.selectedIndex ? 'true' : 'false');
      item.innerHTML = `
        <span class="cfw-command-palette-item-title">${this.escapeHtml(command.title)}</span>
        <span class="cfw-command-palette-item-subtitle">${this.escapeHtml(command.subtitle || '')}</span>
      `;
      item.addEventListener('pointerenter', () => {
        this.selectedIndex = index;
        this.renderList();
      }, { signal: this.controller.signal });
      item.addEventListener('click', () => this.runSelected(), { signal: this.controller.signal });
      this.list.appendChild(item);
    });
  }

  handleInputKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveSelection(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveSelection(-1);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.runSelected();
    }
  }

  moveSelection(delta) {
    if (this.filteredCommands.length === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + this.filteredCommands.length) % this.filteredCommands.length;
    this.renderList();
  }

  async runSelected() {
    const command = this.filteredCommands[this.selectedIndex];
    if (!command) return;

    this.showStatus('Running...');
    const success = await command.run();
    if (success) {
      this.close();
      return;
    }
    this.showStatus('Command failed');
  }

  async openPopup() {
    if (this.actions.openPopup) return this.actions.openPopup();
    try {
      const response = await chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      return Boolean(response?.success);
    } catch (error) {
      console.warn('[Coda Formula Customizer] open popup failed:', error);
      return false;
    }
  }

  async applyNextPreset() {
    if (this.actions.applyNextPreset) return this.actions.applyNextPreset();
    try {
      const response = await chrome.runtime.sendMessage({ type: 'APPLY_NEXT_PRESET' });
      return Boolean(response?.success);
    } catch (error) {
      console.warn('[Coda Formula Customizer] next preset failed:', error);
      return false;
    }
  }

  async applyPreset(id) {
    if (this.actions.applyPreset) return this.actions.applyPreset(id);
    return StorageManager.applyCustomPreset(id);
  }

  async savePartial(partial) {
    if (this.actions.savePartialConfig) {
      const success = await this.actions.savePartialConfig(partial);
      if (success) this.config = { ...this.config, ...partial };
      return success;
    }
    this.config = { ...this.config, ...partial };
    return StorageManager.saveConfig(this.config);
  }

  async resetToDefaults() {
    if (this.actions.resetConfig) return this.actions.resetConfig();
    return false;
  }

  showStatus(message) {
    if (!this.status) return;
    this.status.textContent = message;
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
