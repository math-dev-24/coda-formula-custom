import ToggleSwitch from './ToggleSwitch';

const STYLES = [
  { value: 'dotted', label: 'Dotted' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
];

export default function IndentGuidesPanel({ config, onChange }) {
  return (
    <>
      <ToggleSwitch
        checked={config.showIndentGuides}
        onChange={v => onChange('showIndentGuides', v)}
        label="Rainbow indent guides"
      />

      <div className={`transition-all duration-300 ease-out overflow-hidden ${config.showIndentGuides ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <div className="space-y-1.5">
            <label className="text-[13px] text-gray-600 dark:text-gray-400">Style</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-[13px] cursor-pointer outline-none appearance-none transition-colors duration-150 hover:border-gray-300 dark:hover:border-gray-500 focus:border-coda-400 focus:ring-1 focus:ring-coda-400/20"
              value={config.indentGuideStyle}
              onChange={e => onChange('indentGuideStyle', e.target.value)}
            >
              {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <ToggleSwitch
            checked={config.highlightActiveIndent}
            onChange={v => onChange('highlightActiveIndent', v)}
            label="Highlight active scope"
          />
        </div>
      </div>
    </>
  );
}
