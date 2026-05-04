function Slider({ label, value, unit, min, max, step, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="flex justify-between items-center text-[13px] text-gray-600 dark:text-gray-400">
        <span>{label}</span>
        <span className="tabular-nums text-xs font-medium text-coda-600 dark:text-coda-400">{value}{unit}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} />
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] text-gray-600 dark:text-gray-400">{label}</label>
      <select
        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px] cursor-pointer outline-none appearance-none transition-colors duration-150 hover:border-gray-300 dark:hover:border-gray-500 focus:border-coda-400 focus:ring-1 focus:ring-coda-400/20"
        value={value} onChange={onChange}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const FONTS = [
  { value: 'monospace', label: 'Monospace' },
  { value: 'fira-code', label: 'Fira Code' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono' },
  { value: 'source-code-pro', label: 'Source Code Pro' },
  { value: 'opendyslexic', label: 'OpenDyslexic' },
];

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'high-contrast', label: 'High Contrast' },
  { value: 'solarized', label: 'Solarized' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'protanopia', label: 'Protanopia' },
  { value: 'deuteranopia', label: 'Deuteranopia' },
  { value: 'tritanopia', label: 'Tritanopia' },
];

export default function EditorSettingsPanel({ config, onChange }) {
  return (
    <>
      <Slider label="Font Size" value={config.editorFontSize} unit="px" min={10} max={24}
        onChange={e => onChange('editorFontSize', parseInt(e.target.value))} />
      <Slider label="Line Height" value={config.editorLineHeight} unit="" min={1.0} max={2.5} step={0.1}
        onChange={e => onChange('editorLineHeight', parseFloat(e.target.value))} />
      <Select label="Font Family" value={config.editorFontFamily} options={FONTS}
        onChange={e => onChange('editorFontFamily', e.target.value)} />
      <Select label="Editor Theme" value={config.editorTheme} options={THEMES}
        onChange={e => onChange('editorTheme', e.target.value)} />
    </>
  );
}
