import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getMonthPractices,
  getTodayStatus,
  submitPractice,
} from '../api/practices';
import { BandPicker } from '../components/band/BandPicker';
import { CheckInForm } from '../components/practice/CheckInForm';
import { PracticeCalendar } from '../components/practice/PracticeCalendar';
import { TeamStatusPanel } from '../components/practice/TeamStatusPanel';
import { useAuth } from '../hooks/useAuth';
import { useBand } from '../hooks/useBand';
import type { PracticeLog, TodayMemberStatus } from '../types/practice';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function PracticePage() {
  const { user } = useAuth();
  const { bands, loading } = useBand();
  const [viewBandId, setViewBandId] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [practices, setPractices] = useState<PracticeLog[]>([]);
  const [todayMembers, setTodayMembers] = useState<TodayMemberStatus[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (bands.length === 0) {
      setViewBandId('');
      return;
    }
    if (!bands.some((b) => b.id === viewBandId)) {
      setViewBandId(bands[0].id);
    }
  }, [bands, viewBandId]);

  const viewBand = bands.find((b) => b.id === viewBandId);

  const refresh = useCallback(async () => {
    if (!viewBandId) return;
    const [monthData, todayData] = await Promise.all([
      getMonthPractices(viewBandId, month),
      getTodayStatus(viewBandId),
    ]);
    setPractices(monthData);
    setTodayMembers(todayData);
  }, [viewBandId, month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedDayLogs = useMemo(() => {
    if (!selectedDate) return [];
    return practices.filter((p) => p.date.slice(0, 10) === selectedDate);
  }, [practices, selectedDate]);

  if (loading) return <p className="text-slate-400">加载中…</p>;

  if (bands.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-8 text-center text-slate-400">
        请先加入或创建乐队
      </div>
    );
  }

  async function handleCheckIn(input: {
    bandIds: string[];
    durationMinutes: number;
    note?: string;
    audio?: File;
  }) {
    const errors: string[] = [];
    for (const bandId of input.bandIds) {
      const formData = new FormData();
      formData.append('bandId', bandId);
      formData.append('durationMinutes', String(input.durationMinutes));
      if (input.note) formData.append('note', input.note);
      if (input.audio) formData.append('audio', input.audio);
      try {
        await submitPractice(formData);
      } catch {
        const bandName = bands.find((b) => b.id === bandId)?.name ?? '未知乐队';
        errors.push(bandName);
      }
    }
    if (errors.length === input.bandIds.length) {
      throw new Error('all failed');
    }
    await refresh();
    if (errors.length > 0) {
      throw new Error(`partial: ${errors.join('、')}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">练习打卡</h1>
        <p className="mt-1 text-sm text-slate-400">
          {bands.length > 1 ? '你加入了多个乐队，可分别打卡和查看团队状态' : viewBand?.name}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CheckInForm bands={bands} onSubmit={handleCheckIn} />

        <div className="space-y-3">
          <BandPicker
            bands={bands}
            selectedIds={viewBandId ? [viewBandId] : []}
            onChange={(ids) => setViewBandId(ids[0] ?? '')}
            label="查看团队练习"
            hint="选择要查看今日打卡情况的乐队"
          />
          <TeamStatusPanel members={todayMembers} currentUserId={user?.id} />
        </div>
      </div>

      <div className="space-y-3">
        <BandPicker
          bands={bands}
          selectedIds={viewBandId ? [viewBandId] : []}
          onChange={(ids) => setViewBandId(ids[0] ?? '')}
          label="练习日历"
          hint="选择要查看打卡记录的乐队"
        />
        <PracticeCalendar
          month={month}
          practices={practices}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onMonthChange={setMonth}
        />
      </div>

      {selectedDate && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h3 className="mb-2 font-semibold">
            {viewBand?.name} · {selectedDate} 练习记录
          </h3>
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

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-500">
        即将推出：练习邮件提醒 · 内置节拍器 · 调音器
      </div>
    </div>
  );
}
