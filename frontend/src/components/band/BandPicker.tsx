import type { Band } from '../../types/band';

interface Props {
  bands: Band[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label: string;
  hint?: string;
  multiple?: boolean;
  disabledIds?: string[];
}

export function BandPicker({
  bands,
  selectedIds,
  onChange,
  label,
  hint,
  multiple = false,
  disabledIds = [],
}: Props) {
  function toggle(id: string) {
    if (disabledIds.includes(id)) return;
    if (multiple) {
      if (selectedIds.includes(id)) {
        onChange(selectedIds.filter((s) => s !== id));
      } else {
        onChange([...selectedIds, id]);
      }
    } else {
      onChange([id]);
    }
  }

  if (bands.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-slate-300">{label}</h3>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {bands.map((band) => {
          const active = selectedIds.includes(band.id);
          const disabled = disabledIds.includes(band.id);
          return (
            <button
              key={band.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(band.id)}
              className={`rounded-full border px-3 py-1 font-display-heavy text-sm tracking-wide transition-colors ${
                disabled
                  ? 'control-toggle-disabled border opacity-60'
                  : active
                    ? 'border-accent-600 bg-accent-600 text-white'
                    : 'chip-idle border hover:border-slate-500'
              }`}
            >
              {band.name}
              {disabled && <span className="ml-1 text-[10px] font-sans font-normal">已打卡</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
