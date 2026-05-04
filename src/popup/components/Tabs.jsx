export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {tabs.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-[13px] font-medium transition-all
            ${active === t.id
              ? 'bg-white dark:bg-gray-700 text-coda-600 dark:text-coda-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          {t.icon}
          {t.label}
          {typeof t.badge === 'number' && t.badge > 0 && (
            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full
              ${active === t.id ? 'bg-coda-100 dark:bg-coda-900/40 text-coda-700 dark:text-coda-300' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
