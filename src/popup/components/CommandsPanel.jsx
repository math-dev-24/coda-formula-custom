const SHORTCUTS = [
  {
    keys: 'Alt/Option + Shift + P',
    title: 'Open command palette',
    description: 'Show the in-page command palette inside Coda.',
  },
  {
    keys: 'Alt/Option + Shift + Y',
    title: 'Open extension popup',
    description: 'Open the full Coda Formula Customizer popup.',
  },
  {
    keys: 'Alt/Option + Shift + N',
    title: 'Apply next preset',
    description: 'Cycle through saved configurations.',
  },
  {
    keys: 'Alt/Option + Shift + D',
    title: 'Toggle documentation',
    description: 'Show or hide the formula documentation panel.',
  },
];

const PALETTE_COMMANDS = [
  ['/popup', 'Open the extension popup'],
  ['/next', 'Apply the next saved preset'],
  ['/docs', 'Show or hide documentation'],
  ['/guides', 'Show or hide indent guides'],
  ['/reset', 'Restore default settings'],
  ['/doc right', 'Move documentation to the right'],
  ['/doc left', 'Move documentation to the left'],
  ['/doc top', 'Move documentation to the top'],
  ['/doc bottom', 'Move documentation to the bottom'],
  ['Preset name', 'Apply a saved configuration by name'],
];

function KeyboardIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M8 13h.01M12 13h.01M16 13h.01M7 17h10" />
    </svg>
  );
}

function SlashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  );
}

function Section({ title, icon, children }) {
  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 text-[13px] font-semibold text-gray-700 dark:text-gray-200">
        <span className="text-coda-500">{icon}</span>
        {title}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {children}
      </div>
    </section>
  );
}

export default function CommandsPanel() {
  return (
    <div className="space-y-3">
      <Section title="Keyboard Shortcuts" icon={<KeyboardIcon />}>
        {SHORTCUTS.map(shortcut => (
          <div key={shortcut.keys} className="grid grid-cols-[150px_1fr] gap-3 p-3">
            <div className="min-w-0">
              <kbd className="inline-block max-w-full px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[11px] font-semibold text-gray-700 dark:text-gray-200 leading-tight break-words">
                {shortcut.keys}
              </kbd>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-800 dark:text-gray-100">{shortcut.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-gray-500 dark:text-gray-400">{shortcut.description}</p>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Palette Commands" icon={<SlashIcon />}>
        {PALETTE_COMMANDS.map(([command, description]) => (
          <div key={command} className="grid grid-cols-[118px_1fr] gap-3 p-3">
            <code className="min-w-0 text-[12px] font-semibold text-coda-600 dark:text-coda-400 truncate">
              {command}
            </code>
            <p className="min-w-0 text-[12px] leading-snug text-gray-600 dark:text-gray-300">
              {description}
            </p>
          </div>
        ))}
      </Section>
    </div>
  );
}
