import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONFIG_EXPORT_TYPE,
  CONFIG_EXPORT_VERSION,
  applyNextPresetToConfig,
  applyPresetToConfig,
  createConfigExport,
  getSortedCustomPresets,
  isPresetActive,
  parseConfigImport,
  toggleDocumentationInConfig,
  validateConfig,
} from '../src/shared/config.js';

const preset = {
  id: 'preset-1',
  name: 'Wide dark editor',
  createdAt: 1710000000000,
  config: {
    modalWidth: 90,
    modalHeight: 92,
    modalLeft: 50,
    modalTop: 50,
    transparentBackground: false,
    showDocumentation: true,
    documentationPosition: 'right',
    editorProportion: 70,
    documentationProportion: 30,
    editorFontSize: 16,
    editorLineHeight: 1.6,
    editorFontFamily: 'jetbrains-mono',
    editorTheme: 'dark',
    showIndentGuides: true,
    indentGuideStyle: 'dashed',
    highlightActiveIndent: true,
  },
};

test('createConfigExport produces a versioned preset export', () => {
  const exported = createConfigExport({ customPresets: { [preset.id]: preset } });

  assert.equal(exported.type, CONFIG_EXPORT_TYPE);
  assert.equal(exported.version, CONFIG_EXPORT_VERSION);
  assert.equal(exported.presets.length, 1);
  assert.deepEqual(exported.presets[0].config, preset.config);
});

test('parseConfigImport reads exported presets', () => {
  const exported = createConfigExport({ customPresets: { [preset.id]: preset } });
  const imported = parseConfigImport(JSON.stringify(exported));

  assert.equal(imported.length, 1);
  assert.equal(imported[0].name, preset.name);
  assert.equal(imported[0].config.editorTheme, 'dark');
});

test('parseConfigImport supports legacy customPresets objects', () => {
  const imported = parseConfigImport({ customPresets: { [preset.id]: preset } });

  assert.equal(imported.length, 1);
  assert.equal(imported[0].id, preset.id);
});

test('parseConfigImport skips invalid configs', () => {
  const imported = parseConfigImport({
    presets: [
      preset,
      { name: 'Invalid', config: { ...preset.config, modalWidth: 10 } },
    ],
  });

  assert.equal(imported.length, 1);
  assert.equal(imported[0].name, preset.name);
});

test('validateConfig rejects malformed imported scalar values', () => {
  assert.equal(validateConfig({ ...preset.config, modalWidth: '90' }), false);
  assert.equal(validateConfig({ ...preset.config, editorLineHeight: Number.NaN }), false);
  assert.equal(validateConfig({ ...preset.config, showDocumentation: 'true' }), false);
  assert.equal(validateConfig(preset.config), true);
});

test('preset helpers apply configs while preserving the library', () => {
  const current = {
    customPresets: { [preset.id]: preset },
    editorTheme: 'light',
    modalWidth: 80,
  };

  const next = applyPresetToConfig(current, preset.id);

  assert.equal(next.editorTheme, 'dark');
  assert.equal(next.modalWidth, 90);
  assert.equal(next.customPresets[preset.id].name, preset.name);
});

test('applyNextPresetToConfig cycles after the active preset', () => {
  const olderPreset = {
    ...preset,
    id: 'preset-2',
    name: 'Older',
    createdAt: 1700000000000,
    config: { ...preset.config, editorTheme: 'sepia' },
  };
  const current = {
    ...preset.config,
    customPresets: {
      [preset.id]: preset,
      [olderPreset.id]: olderPreset,
    },
  };

  assert.equal(isPresetActive(current, preset), true);
  assert.deepEqual(getSortedCustomPresets(current).map(p => p.id), ['preset-1', 'preset-2']);
  assert.equal(applyNextPresetToConfig(current).editorTheme, 'sepia');
});

test('toggleDocumentationInConfig flips visibility without dropping presets', () => {
  const next = toggleDocumentationInConfig({
    showDocumentation: true,
    customPresets: { [preset.id]: preset },
  });

  assert.equal(next.showDocumentation, false);
  assert.equal(next.customPresets[preset.id].name, preset.name);
});
