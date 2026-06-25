import { useState } from 'react';

interface Props {
  onSubmit: (input: {
    durationMinutes: number;
    note?: string;
    audio?: File;
  }) => Promise<void>;
}

export function CheckInForm({ onSubmit }: Props) {
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [note, setNote] = useState('');
  const [audio, setAudio] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({ durationMinutes, note: note || undefined, audio });
      setNote('');
      setAudio(undefined);
    } catch {
      setError('打卡失败，可能今天已经打卡过了');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold">今日打卡</h3>
      <label className="block text-sm">
        练习时长（分钟）
        <input
          type="number"
          min={1}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          required
        />
      </label>
      <label className="block text-sm">
        备注（可选）
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </label>
      <label className="block text-sm">
        练习录音（可选，mp3/wav）
        <input
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          className="mt-1 block w-full text-sm"
          onChange={(e) => setAudio(e.target.files?.[0])}
        />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? '提交中…' : '提交打卡'}
      </button>
    </form>
  );
}
