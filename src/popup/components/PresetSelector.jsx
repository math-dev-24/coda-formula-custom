import { DEFAULT_CONFIG } from '../../shared/config.js';

const PRESETS = [
  {
    name: 'default', label: 'Default', size: '80%',
    icon: <rect x="5" y="5" width="14" height="14" rx="2" />,
  },
  {
    name: 'medium', label: 'Medium', size: '90%',
    icon: <rect x="3" y="3" width="18" height="18" rx="2" />,
  },
  {
    name: 'fullscreen', label: 'Full', size: '95%',
    icon: <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />,
  },
];

export default function PresetSelector({ config, onApply }) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Presets</h2>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(p => {
          const preset = DEFAULT_CONFIG.presets[p.name];
          const isActive = preset
            && preset.modalWidth === config.modalWidth
            && preset.modalHeight === config.modalHeight
            && preset.editorProportion === config.editorProportion;

          return (
            <button
              key={p.name}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg cursor-pointer text-xs border
                transition-all duration-200 active:scale-[0.97]
                ${isActive
                  ? 'bg-coda-500 text-white border-coda-500 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-coda-300 dark:hover:border-coda-700 hover:text-coda-600 dark:hover:text-coda-400'}`}
              onClick={() => onApply(p.name)}
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{p.icon}</svg>
              <span className="font-medium">{p.label}</span>
              <span className={`text-[10px] ${isActive ? 'text-white/70' : 'opacity-40'}`}>{p.size}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
