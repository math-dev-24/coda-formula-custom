import { useState, useRef, useEffect } from 'react';

export default function SavePresetBar({ onSave }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = await onSave(trimmed);
    if (id) {
      setName('');
      setEditing(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setEditing(false); setName(''); }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[13px] font-medium border border-dashed border-coda-300 dark:border-coda-800 text-coda-600 dark:text-coda-400 hover:bg-coda-50 dark:hover:bg-coda-950/30 transition-colors active:scale-[0.99]"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Save current config as preset
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-1.5 rounded-lg border border-coda-300 dark:border-coda-700 bg-coda-50/50 dark:bg-coda-950/20">
      <input
        ref={inputRef}
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Preset name…"
        className="flex-1 px-2 py-1 text-[13px] bg-transparent outline-none placeholder:text-gray-400"
        maxLength={50}
      />
      <button type="button" onClick={handleSave} disabled={!name.trim()}
        className="px-3 py-1 text-[12px] font-medium rounded bg-coda-500 text-white hover:bg-coda-600 disabled:opacity-40 disabled:cursor-not-allowed">
        Save
      </button>
      <button type="button" onClick={() => { setEditing(false); setName(''); }}
        className="px-2 py-1 text-[12px] text-gray-500 hover:text-gray-700 dark:text-gray-400">
        Cancel
      </button>
    </div>
  );
}
