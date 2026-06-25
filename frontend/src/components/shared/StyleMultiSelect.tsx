import { MUSIC_STYLES } from '../../constants/music';

interface Props {
  label: string;
  hint?: string;
  selected: string[];
  onChange: (next: string[]) => void;
}

export function StyleMultiSelect({ label, hint, selected, onChange }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-slate-300">{label}</h3>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {MUSIC_STYLES.map(({ id, label: styleLabel }) => {
          const active = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {styleLabel}
            </button>
          );
        })}
      </div>
    </section>
  );
}
