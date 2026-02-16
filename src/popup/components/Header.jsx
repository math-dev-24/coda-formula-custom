import { useState, useEffect } from 'react';

export default function Header() {
  const [dark, setDark] = useState(() => localStorage.getItem('codaFormulaTheme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('codaFormulaTheme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <header className="bg-coda-500 text-white px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg className="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <h1 className="text-base font-semibold tracking-tight">Formula Customizer</h1>
        </div>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors duration-200 cursor-pointer"
          onClick={() => setDark(d => !d)}
          title="Toggle theme"
          type="button"
        >
          <svg
            className={`w-4 h-4 absolute transition-all duration-400 ${dark ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <svg
            className={`w-4 h-4 absolute transition-all duration-400 ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
