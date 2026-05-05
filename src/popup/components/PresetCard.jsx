import { useState, useRef, useEffect } from 'react';

export default function PresetCard({ preset, onApply, onRename, onDuplicate, onDelete }) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(preset.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const commitRename = async () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== preset.name) {
      await onRename(preset.id, trimmed);
    } else {
      setDraft(preset.name);
    }
    setRenaming(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    }
    if (e.key === 'Escape') {
      setDraft(preset.name);
      setRenaming(false);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete preset "${preset.name}"?`)) onDelete(preset.id);
  };

  const c = preset.config || {};

  return (
    <div className="group relative p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-coda-300 dark:hover:border-coda-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        {renaming ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKey}
            onBlur={commitRename}
            className="flex-1 text-[13px] font-medium bg-transparent outline-none border-b border-coda-400"
            maxLength={50}
          />
        ) : (
          <button
            type="button"
            onClick={() => onApply(preset.id)}
            className="flex-1 text-left text-[13px] font-medium text-gray-800 dark:text-gray-200 hover:text-coda-600 dark:hover:text-coda-400 truncate cursor-pointer"
            title="Click to apply"
          >
            {preset.name}
          </button>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setRenaming(true); }}
            className="p-1 text-gray-400 hover:text-coda-500"
            title="Rename"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDuplicate?.(preset.id); }}
            className="p-1 text-gray-400 hover:text-coda-500"
            title="Duplicate"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{c.modalWidth}x{c.modalHeight}%</span>
        {c.editorTheme && <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{c.editorTheme}</span>}
        {c.documentationPosition && <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">doc {c.documentationPosition}</span>}
        {c.editorFontFamily && c.editorFontFamily !== 'monospace' && (
          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{c.editorFontFamily}</span>
        )}
      </div>
    </div>
  );
}
