import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveMediaUrl } from '../api/client';
import {
  getMonthPractices,
  getPracticeStats,
  getTodayStatus,
  submitPractice,
} from '../api/practices';
import { BandPicker } from '../components/band/BandPicker';
import { PageHeader } from '../components/layout/PageHeader';
import { CheckInForm, type CheckInResult } from '../components/practice/CheckInForm';
import { PersonalStatsPanel } from '../components/practice/PersonalStatsPanel';
import { PracticeCalendar } from '../components/practice/PracticeCalendar';
import { TeamStatsPanel } from '../components/practice/TeamStatsPanel';
import { TeamStatusPanel } from '../components/practice/TeamStatusPanel';
import { PracticeToolsLayout } from '../components/practice/tools/PracticeToolsLayout';
import { createToast, ToastStack, type ToastMessage } from '../components/shared/ToastStack';
import { useAuth } from '../hooks/useAuth';
import { useBand } from '../hooks/useBand';
import { celebrateCheckIn, celebrateTeamComplete } from '../lib/celebration';
import type { PracticeLog, PracticeStats, TodayMemberStatus } from '../types/practice';

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
  const [checkedInBandIds, setCheckedInBandIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [stats, setStats] = useState<PracticeStats | null>(null);

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

  const refreshCheckInStatus = useCallback(async () => {
    if (!user || bands.length === 0) {
      setCheckedInBandIds([]);
      return;
    }

    const results = await Promise.all(
      bands.map(async (band) => {
        const members = await getTodayStatus(band.id);
        const me = members.find((member) => member.userId === user.id);
        return me?.checkedIn ? band.id : null;
      }),
    );
    setCheckedInBandIds(results.filter((id): id is string => id !== null));
  }, [bands, user]);

  const refresh = useCallback(async () => {
    if (!viewBandId) return;
    const [monthData, todayData] = await Promise.all([
      getMonthPractices(viewBandId, month),
      getTodayStatus(viewBandId),
      getPracticeStats(viewBandId).then(setStats),
    ]);
    setPractices(monthData);
    setTodayMembers(todayData);
  }, [viewBandId, month]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), refreshCheckInStatus()]);
  }, [refresh, refreshCheckInStatus]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

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
  }): Promise<CheckInResult> {
    const succeeded: string[] = [];
    const failed: string[] = [];
    const succeededBandIds: string[] = [];
    const failedBandIds: string[] = [];
    for (const bandId of input.bandIds) {
      const formData = new FormData();
      formData.append('bandId', bandId);
      formData.append('durationMinutes', String(input.durationMinutes));
      if (input.note) formData.append('note', input.note);
      if (input.audio) formData.append('audio', input.audio);
      try {
        await submitPractice(formData);
        const bandName = bands.find((b) => b.id === bandId)?.name ?? '未知乐队';
        succeeded.push(bandName);
        succeededBandIds.push(bandId);
      } catch {
        const bandName = bands.find((b) => b.id === bandId)?.name ?? '未知乐队';
        failed.push(bandName);
        failedBandIds.push(bandId);
      }
    }
    if (succeeded.length > 0) {
      await refreshAll();
    }
    return { succeeded, failed, succeededBandIds, failedBandIds };
  }

  async function handleCheckInSuccess(result: CheckInResult, durationMinutes: number) {
    celebrateCheckIn();

    const bandText =
      result.succeeded.length === 1
        ? result.succeeded[0]
        : result.succeeded.join('、');

    let personalStats = stats?.personal;
    if (viewBandId) {
      try {
        const latest = await getPracticeStats(viewBandId);
        setStats(latest);
        personalStats = latest.personal;
      } catch {
        /* keep existing stats */
      }
    }

    let toastText = `打卡成功！${bandText} · ${durationMinutes} 分钟`;
    if (personalStats) {
      if (personalStats.streakDays > 0) {
        toastText += ` · 连续 ${personalStats.streakDays} 天`;
      }
      toastText += ` · 本周 ${personalStats.weekMinutes} 分钟`;
    }

    setToasts((prev) => [...prev, createToast(toastText)]);

    for (const bandId of result.succeededBandIds) {
      try {
        const bandStats = await getPracticeStats(bandId);
        if (bandStats.band.teamToday.allCheckedIn) {
          const bandName = bands.find((b) => b.id === bandId)?.name ?? '乐队';
          celebrateTeamComplete();
          setToasts((prev) => [
            ...prev,
            createToast(`🎉 ${bandName} 今日全员到齐！`),
          ]);
        }
      } catch {
        /* ignore stats errors */
      }
    }

    if (result.failed.length > 0) {
      setToasts((prev) => [
        ...prev,
        createToast(`${result.failed.join('、')} 未能打卡（可能今日已打卡）`, 'warning'),
      ]);
    }
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }

  return (
    <PracticeToolsLayout>
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <PageHeader
        title="练习打卡"
        lead={
          bands.length > 1
            ? '你加入了多个乐队，可分别打卡和查看团队状态'
            : viewBand?.name
        }
      />

      {stats && <PersonalStatsPanel stats={stats.personal} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <CheckInForm
          bands={bands}
          checkedInBandIds={checkedInBandIds}
          onSubmit={handleCheckIn}
          onSuccess={(result, minutes) => void handleCheckInSuccess(result, minutes)}
        />

        <div className="space-y-3">
          <BandPicker
            bands={bands}
            selectedIds={viewBandId ? [viewBandId] : []}
            onChange={(ids) => setViewBandId(ids[0] ?? '')}
            label="查看团队练习"
            hint="选择要查看今日打卡情况的乐队"
          />
          {stats && viewBand && <TeamStatsPanel stats={stats.band} bandName={viewBand.name} />}
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
        <div className="poster-card rounded-xl p-4">
          <p className="rock-kicker">SESSION LOG</p>
          <h3 className="section-title mt-1">
            {viewBand?.name} · {selectedDate}
          </h3>
          {selectedDayLogs.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">当天暂无打卡</p>
          ) : (
            <ul className="mt-3 space-y-3 text-sm">
              {selectedDayLogs.map((log) => {
                const audioSrc = resolveMediaUrl(log.audioUrl);
                return (
                  <li
                    key={log.id}
                    className="rounded-lg border border-slate-700/80 bg-slate-950/40 px-3 py-2"
                  >
                    <p>
                      {log.user.displayName} — {log.durationMinutes} 分钟
                      {log.note ? ` · ${log.note}` : ''}
                    </p>
                    {audioSrc && (
                      <audio controls preload="metadata" className="mt-2 w-full max-w-md" src={audioSrc}>
                        你的浏览器不支持音频播放
                      </audio>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="poster-card rounded-xl border-dashed p-4 text-sm text-slate-500">
        <span className="rock-tag mr-2">SOON</span>
        即将推出：练习邮件提醒
      </div>
    </div>
    </PracticeToolsLayout>
  );
}
