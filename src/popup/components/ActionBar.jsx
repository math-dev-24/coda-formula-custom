export default function ActionBar({ onReset }) {
  return (
    <section className="fixed bottom-0 left-0 right-0 p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-10">
      <button
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium cursor-pointer
          text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 bg-transparent
          hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20
          transition-colors duration-200 active:scale-[0.98]"
        onClick={onReset} type="button"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
        Reset to defaults
      </button>
    </section>
  );
}
