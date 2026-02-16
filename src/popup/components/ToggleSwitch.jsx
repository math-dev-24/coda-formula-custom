export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer select-none group">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      <span className="text-[13px] text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-150">
        {label}
      </span>
    </label>
  );
}
