import type { PracticeLog } from '../../types/practice';

interface Props {
  month: string;
  practices: PracticeLog[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onMonthChange: (month: string) => void;
}

function daysInMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function PracticeCalendar({
  month,
  practices,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: Props) {
  const days = daysInMonth(month);
  const [year, mon] = month.split('-').map(Number);
  const activeDates = new Set(practices.map((p) => p.date.slice(0, 10)));

  function shiftMonth(delta: number) {
    const d = new Date(year, mon - 1 + delta, 1);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(next);
    onSelectDate(null);
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shiftMonth(-1)} className="px-2 text-slate-400 hover:text-emphasis">
          ←
        </button>
        <span className="font-medium">{month}</span>
        <button type="button" onClick={() => shiftMonth(1)} className="px-2 text-slate-400 hover:text-emphasis">
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const dateStr = `${month}-${String(day).padStart(2, '0')}`;
          const hasLog = activeDates.has(dateStr);
          const selected = selectedDate === dateStr;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(selected ? null : dateStr)}
              className={`rounded-lg py-2 ${
                selected
                  ? 'bg-accent-600 text-white'
                  : hasLog
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
