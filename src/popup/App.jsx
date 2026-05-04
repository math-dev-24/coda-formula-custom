import { useCallback, useState } from 'react';
import { useChromeStorage } from './hooks/useChromeStorage';
import Header from './components/Header';
import Tabs from './components/Tabs';
import LibraryPanel from './components/LibraryPanel';
import SavePresetBar from './components/SavePresetBar';
import Accordion from './components/Accordion';
import ModalSizePanel from './components/ModalSizePanel';
import EditorSettingsPanel from './components/EditorSettingsPanel';
import IndentGuidesPanel from './components/IndentGuidesPanel';
import DocumentationPanel from './components/DocumentationPanel';
import ActionBar from './components/ActionBar';
import StatusMessage from './components/StatusMessage';

const ModalIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);
const EditorIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const IndentIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 6 10 6" /><polyline points="4 12 14 12" />
    <polyline points="4 18 10 18" /><line x1="20" y1="6" x2="20" y2="18" />
  </svg>
);
const DocIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const LibraryIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);
const SlidersIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
  </svg>
);

function SkeletonLoader() {
  return (
    <div className="w-[480px] min-h-[600px] bg-white dark:bg-gray-900">
      <div className="bg-coda-500 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="skeleton w-5 h-5 rounded" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="skeleton w-32 h-4" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="skeleton h-9 rounded-lg" />
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-11 rounded-lg" />)}
      </div>
    </div>
  );
}

export default function App() {
  const {
    config, updateConfig, resetConfig, loading, status,
    saveCustomPreset, applyCustomPreset, renameCustomPreset, deleteCustomPreset,
    exportCustomPresets, importCustomPresets,
  } = useChromeStorage();
  const [tab, setTab] = useState('custom');

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all settings to defaults?')) resetConfig();
  }, [resetConfig]);

  if (loading) return <SkeletonLoader />;

  const presetCount = Object.keys(config.customPresets || {}).length;

  return (
    <div className="w-[480px] min-h-[600px] flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans text-sm antialiased transition-colors duration-200">
      <div className="animate-in"><Header /></div>

      <div className="px-4 pt-3">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'custom', label: 'Custom', icon: <SlidersIcon /> },
            { id: 'library', label: 'Library', icon: <LibraryIcon />, badge: presetCount },
          ]}
        />
      </div>

      <main className="flex-1 p-4 pb-16 flex flex-col gap-4 overflow-y-auto max-h-[calc(600px-100px)] custom-scroll">
        {tab === 'custom' ? (
          <>
            <div className="animate-in">
              <SavePresetBar onSave={saveCustomPreset} />
            </div>
            <div className="animate-in delay-1">
              <Accordion title="Modal Size & Position" icon={<ModalIcon />}>
                <ModalSizePanel config={config} onChange={updateConfig} />
              </Accordion>
            </div>
            <div className="animate-in delay-2">
              <Accordion title="Editor" icon={<EditorIcon />}>
                <EditorSettingsPanel config={config} onChange={updateConfig} />
              </Accordion>
            </div>
            <div className="animate-in delay-3">
              <Accordion title="Indent Guides" icon={<IndentIcon />}>
                <IndentGuidesPanel config={config} onChange={updateConfig} />
              </Accordion>
            </div>
            <div className="animate-in delay-4">
              <Accordion title="Documentation" icon={<DocIcon />}>
                <DocumentationPanel config={config} onChange={updateConfig} />
              </Accordion>
            </div>
            <div className="animate-in delay-5 flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Changes are saved automatically. Refresh the Coda page or reopen the formula editor to see updates.</span>
            </div>
          </>
        ) : (
          <div className="animate-in">
            <LibraryPanel
              presets={config.customPresets}
              onApply={applyCustomPreset}
              onRename={renameCustomPreset}
              onDelete={deleteCustomPreset}
              onExport={exportCustomPresets}
              onImport={importCustomPresets}
            />
          </div>
        )}
      </main>

      {tab === 'custom' && <div className="animate-in delay-5"><ActionBar onReset={handleReset} /></div>}
      <StatusMessage message={status.message} type={status.type} />
    </div>
  );
}
