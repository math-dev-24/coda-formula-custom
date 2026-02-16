import ToggleSwitch from './ToggleSwitch';

const POSITIONS = [
  {
    value: 'left', label: 'Left',
    icon: <><rect x="2" y="3" width="8" height="18" rx="1" /><rect x="12" y="3" width="10" height="18" rx="1" opacity="0.25" /></>,
  },
  {
    value: 'right', label: 'Right',
    icon: <><rect x="2" y="3" width="10" height="18" rx="1" opacity="0.25" /><rect x="14" y="3" width="8" height="18" rx="1" /></>,
  },
  {
    value: 'top', label: 'Top',
    icon: <><rect x="3" y="2" width="18" height="8" rx="1" /><rect x="3" y="12" width="18" height="10" rx="1" opacity="0.25" /></>,
  },
  {
    value: 'bottom', label: 'Bottom',
    icon: <><rect x="3" y="2" width="18" height="10" rx="1" opacity="0.25" /><rect x="3" y="14" width="18" height="8" rx="1" /></>,
  },
];

export default function DocumentationPanel({ config, onChange }) {
  return (
    <>
      <ToggleSwitch
        checked={config.showDocumentation}
        onChange={v => onChange('showDocumentation', v)}
        label="Show documentation"
      />

      <div className={`transition-all duration-300 ease-out overflow-hidden ${config.showDocumentation ? 'max-h-[400px] opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <label className="text-[13px] text-gray-600 dark:text-gray-400">Position</label>
          <div className="grid grid-cols-4 gap-1.5">
            {POSITIONS.map(pos => (
              <button
                key={pos.value}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg cursor-pointer text-[11px] border
                  transition-all duration-150 active:scale-[0.96]
                  ${config.documentationPosition === pos.value
                    ? 'bg-coda-500 text-white border-coda-500'
                    : 'bg-white dark:bg-gray-750 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-600 hover:border-coda-300 hover:text-coda-500'}`}
                onClick={() => onChange('documentationPosition', pos.value)}
                type="button"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">{pos.icon}</svg>
                <span className="font-medium">{pos.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="flex justify-between items-center text-[13px] text-gray-600 dark:text-gray-400">
              <span>Editor proportion</span>
              <span className="tabular-nums text-xs font-medium text-coda-600 dark:text-coda-400">{config.editorProportion}%</span>
            </label>
            <input type="range" min={30} max={80} value={config.editorProportion}
              onChange={e => onChange('editorProportion', parseInt(e.target.value))} />
            <div className="flex justify-between text-[10px] text-gray-300 dark:text-gray-600">
              <span>More doc</span><span>More editor</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
