import type { Band } from '../../types/band';

interface Props {
  bands: Band[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label: string;
  hint?: string;
  multiple?: boolean;
}

export function BandPicker({
  bands,
  selectedIds,
  onChange,
  label,
  hint,
  multiple = false,
}: Props) {
  function toggle(id: string) {
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
          return (
            <button
              key={band.id}
              type="button"
              onClick={() => toggle(band.id)}
              className={`rounded-full border px-3 py-1 font-display-heavy text-sm tracking-wide transition-colors ${
                active
                  ? 'border-accent-600 bg-accent-600 text-white'
                  : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {band.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
