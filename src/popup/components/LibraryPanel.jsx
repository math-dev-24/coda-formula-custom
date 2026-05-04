import PresetCard from './PresetCard';

export default function LibraryPanel({ presets, onApply, onRename, onDelete }) {
  const list = Object.values(presets || {}).sort((a, b) => b.createdAt - a.createdAt);

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        <p className="text-[13px] font-medium text-gray-600 dark:text-gray-300">No saved presets yet</p>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 max-w-[260px]">
          Configure your settings in the <span className="font-medium">Custom</span> tab,<br />
          then save them here as a preset.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {list.map(p => (
        <PresetCard key={p.id} preset={p} onApply={onApply} onRename={onRename} onDelete={onDelete} />
      ))}
    </div>
  );
}
