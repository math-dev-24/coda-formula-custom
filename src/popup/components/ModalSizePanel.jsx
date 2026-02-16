import ToggleSwitch from './ToggleSwitch';

function positionLabel(value, low, high) {
  if (value < 25) return low;
  if (value > 75) return high;
  return 'Center';
}

function Slider({ label, value, unit, min, max, step, onChange, hints }) {
  return (
    <div className="space-y-1.5">
      <label className="flex justify-between items-center text-[13px] text-gray-600 dark:text-gray-400">
        <span>{label}</span>
        <span className="tabular-nums text-xs font-medium text-coda-600 dark:text-coda-400">{value}{unit}</span>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} />
      {hints && (
        <div className="flex justify-between text-[10px] text-gray-300 dark:text-gray-600">
          {hints.map((h, i) => <span key={i}>{h}</span>)}
        </div>
      )}
    </div>
  );
}

export default function ModalSizePanel({ config, onChange }) {
  return (
    <>
      <Slider label="Width" value={config.modalWidth} unit="%" min={20} max={98}
        onChange={e => onChange('modalWidth', parseInt(e.target.value))} />
      <Slider label="Height" value={config.modalHeight} unit="%" min={20} max={98}
        onChange={e => onChange('modalHeight', parseInt(e.target.value))} />
      <Slider label="Horizontal" value={config.modalLeft} unit=""
        min={0} max={100} hints={['Left', 'Center', 'Right']}
        onChange={e => onChange('modalLeft', parseInt(e.target.value))} />
      <Slider label="Vertical" value={config.modalTop} unit=""
        min={0} max={100} hints={['Top', 'Center', 'Bottom']}
        onChange={e => onChange('modalTop', parseInt(e.target.value))} />
      <ToggleSwitch
        checked={config.transparentBackground}
        onChange={v => onChange('transparentBackground', v)}
        label="Transparent background"
      />
    </>
  );
}
