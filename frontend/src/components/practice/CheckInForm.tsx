import { useEffect, useMemo, useState } from 'react';
import type { Band } from '../../types/band';
import { BandPicker } from '../band/BandPicker';

interface Props {
  bands: Band[];
  checkedInBandIds: string[];
  onSubmit: (input: {
    bandIds: string[];
    durationMinutes: number;
    note?: string;
    audio?: File;
  }) => Promise<void>;
}

export function CheckInForm({ bands, checkedInBandIds, onSubmit }: Props) {
  const [selectedBandIds, setSelectedBandIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [note, setNote] = useState('');
  const [audio, setAudio] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkedInBandNames = useMemo(
    () =>
      bands.filter((band) => checkedInBandIds.includes(band.id)).map((band) => band.name),
    [bands, checkedInBandIds],
  );

  const allCheckedIn = bands.length > 0 && checkedInBandIds.length === bands.length;

  useEffect(() => {
    setSelectedBandIds((prev) => prev.filter((id) => !checkedInBandIds.includes(id)));
  }, [checkedInBandIds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedBandIds.length === 0) {
      setError(allCheckedIn ? '今日所有乐队均已打卡' : '请至少选择一个乐队');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        bandIds: selectedBandIds,
        durationMinutes,
        note: note || undefined,
        audio,
      });
      setNote('');
      setAudio(undefined);
      setSelectedBandIds([]);
    } catch {
      setError('打卡失败，部分乐队可能今天已经打卡过了');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold">今日打卡</h3>

      {checkedInBandNames.length > 0 && (
        <p className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-300">
          今日已在 {checkedInBandNames.join('、')} 打卡
        </p>
      )}

      <BandPicker
        bands={bands}
        selectedIds={selectedBandIds}
        onChange={setSelectedBandIds}
        disabledIds={checkedInBandIds}
        label="选择乐队"
        hint={
          allCheckedIn
            ? '今日所有乐队均已打卡'
            : '可多选，为每个选中的乐队分别打卡'
        }
        multiple
      />

      <label className="block text-sm">
        练习时长（分钟）
        <input
          type="number"
          min={1}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          required
          disabled={allCheckedIn}
        />
      </label>
      <label className="block text-sm">
        备注（可选）
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          disabled={allCheckedIn}
        />
      </label>
      <label className="block text-sm">
        练习录音（可选，mp3/wav）
        <input
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          className="mt-1 block w-full text-sm"
          onChange={(e) => setAudio(e.target.files?.[0])}
          disabled={allCheckedIn}
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || allCheckedIn}
        className="rounded-lg bg-accent-600 px-4 py-2 font-medium hover:bg-accent-500 disabled:opacity-50"
      >
        {loading ? '提交中…' : allCheckedIn ? '今日已全部打卡' : '提交打卡'}
      </button>
    </form>
  );
}
