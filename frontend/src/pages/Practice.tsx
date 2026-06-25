import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getMonthPractices,
  getTodayStatus,
  submitPractice,
} from '../api/practices';
import { CheckInForm } from '../components/practice/CheckInForm';
import { PracticeCalendar } from '../components/practice/PracticeCalendar';
import { TeamStatusPanel } from '../components/practice/TeamStatusPanel';
import { useBand } from '../hooks/useBand';
import type { PracticeLog, TodayMemberStatus } from '../types/practice';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function PracticePage() {
  const { band, loading } = useBand();
  const [month, setMonth] = useState(currentMonth());
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [todayMembers, setTodayMembers] = useState<TodayMemberStatus[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!band) return;
    const [monthData, todayData] = await Promise.all([
      getMonthPractices(band.id, month),
      getTodayStatus(band.id),
    ]);
    setPractices(monthData);
    setTodayMembers(todayData);
  }, [band, month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedDayLogs = useMemo(() => {
    if (!selectedDate) return [];
    return practices.filter((p) => p.date.slice(0, 10) === selectedDate);
  }, [practices, selectedDate]);

  if (loading) return <p className="text-slate-400">加载中…</p>;

  if (!band) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-8 text-center text-slate-400">
        请先加入或创建乐队
      </div>
    );
  }

  async function handleCheckIn(input: {
    durationMinutes: number;
    note?: string;
    audio?: File;
  }) {
    const formData = new FormData();
    formData.append('bandId', band!.id);
    formData.append('durationMinutes', String(input.durationMinutes));
    if (input.note) formData.append('note', input.note);
    if (input.audio) formData.append('audio', input.audio);
    await submitPractice(formData);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{band.name} · 练习打卡</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <CheckInForm onSubmit={handleCheckIn} />
        <TeamStatusPanel members={todayMembers} />
      </div>

      <PracticeCalendar
        month={month}
        practices={practices}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onMonthChange={setMonth}
      />

      {selectedDate && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h3 className="mb-2 font-semibold">{selectedDate} 练习记录</h3>
          {selectedDayLogs.length === 0 ? (
            <p className="text-sm text-slate-500">当天暂无打卡</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {selectedDayLogs.map((log) => (
                <li key={log.id}>
                  {log.user.displayName} — {log.durationMinutes} 分钟
                  {log.note ? ` · ${log.note}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-500">
        即将推出：练习邮件提醒 · 内置节拍器 · 调音器
      </div>
    </div>
  );
}
