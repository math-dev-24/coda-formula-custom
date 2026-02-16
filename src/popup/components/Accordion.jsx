import { useState, useRef, useEffect, useCallback } from 'react';

export default function Accordion({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [height, setHeight] = useState(defaultOpen ? 'auto' : '0px');

  const recalcHeight = useCallback(() => {
    if (!contentRef.current) return;
    if (open) {
      setHeight(`${contentRef.current.scrollHeight}px`);
      const timer = setTimeout(() => setHeight('auto'), 300);
      return () => clearTimeout(timer);
    } else {
      setHeight(`${contentRef.current.scrollHeight}px`);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight('0px'));
      });
    }
  }, [open]);

  useEffect(() => recalcHeight(), [recalcHeight]);

  return (
    <div className={`rounded-lg border transition-colors duration-200 ${open ? 'border-coda-200 dark:border-coda-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
      <button
        className={`w-full flex items-center gap-3 px-4 py-3 border-none cursor-pointer text-[13px] font-medium text-left transition-colors duration-150 bg-transparent rounded-lg
          ${open ? 'text-coda-600 dark:text-coda-400' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'}`}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span className={`w-4 h-4 shrink-0 transition-colors duration-150 ${open ? 'text-coda-500' : 'text-gray-400 dark:text-gray-500'}`}>
          {icon}
        </span>
        <span className="flex-1 truncate">{title}</span>
        <svg
          className={`w-3.5 h-3.5 ml-auto transition-transform duration-250 ${open ? 'rotate-180 text-coda-500' : 'text-gray-400'}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        ref={contentRef}
        className="transition-[height] duration-300 ease-out overflow-hidden"
        style={{ height }}
      >
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-100 dark:border-gray-700/50">
          {children}
        </div>
      </div>
    </div>
  );
}
