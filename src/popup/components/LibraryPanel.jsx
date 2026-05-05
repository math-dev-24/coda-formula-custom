import PresetCard from './PresetCard';
import { useMemo, useState } from 'react';

function LibraryActions({ count, onExport, onImport }) {
  const handleExport = async () => {
    const exported = await onExport();
    if (!exported) return;

    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coda-configs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const text = await file.text();
    await onImport(text);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-coda-300 dark:hover:border-coda-700 hover:text-coda-600 dark:hover:text-coda-400 cursor-pointer transition-colors">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Import
        <input type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
      </label>
      <button
        type="button"
        onClick={handleExport}
        disabled={count === 0}
        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[12px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-coda-300 dark:hover:border-coda-700 hover:text-coda-600 dark:hover:text-coda-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export
      </button>
    </div>
  );
}

export default function LibraryPanel({ presets, onApply, onRename, onDuplicate, onDelete, onExport, onImport }) {
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return Object.values(presets || {})
      .filter(preset => {
        if (!normalized) return true;
        const config = preset.config || {};
        return [
          preset.name,
          config.editorTheme,
          config.editorFontFamily,
          config.documentationPosition,
        ].filter(Boolean).join(' ').toLowerCase().includes(normalized);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [presets, query]);
  const total = Object.keys(presets || {}).length;

  if (total === 0) {
    return (
      <div className="space-y-3">
        <LibraryActions count={0} onExport={onExport} onImport={onImport} />
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          <p className="text-[13px] font-medium text-gray-600 dark:text-gray-300">No saved presets yet</p>
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 max-w-[260px]">
            Configure your settings in the <span className="font-medium">Custom</span> tab,<br />
            then save them here as a preset.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <LibraryActions count={total} onExport={onExport} onImport={onImport} />
      <input
        type="search"
        value={query}
        onChange={event => setQuery(event.target.value)}
        placeholder="Search presets"
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[12px] text-gray-700 dark:text-gray-200 outline-none focus:border-coda-400 focus:ring-1 focus:ring-coda-400/20"
      />
      {list.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center text-[12px] text-gray-400">
          No presets match this search.
        </div>
      )}
      {list.map(p => (
        <PresetCard key={p.id} preset={p} onApply={onApply} onRename={onRename} onDuplicate={onDuplicate} onDelete={onDelete} />
      ))}
    </div>
  );
}
