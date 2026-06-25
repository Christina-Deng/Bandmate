import { useState } from 'react';
import { useBand } from '../../hooks/useBand';

export function JoinBandForm() {
  const { joinBand } = useBand();
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await joinBand(inviteCode.trim());
    } catch {
      setError('邀请码无效或你已加入乐队');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold">加入乐队</h3>
      <input
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        placeholder="输入邀请码"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg border border-indigo-500 px-4 py-2 font-medium hover:bg-indigo-500/10 disabled:opacity-50"
      >
        {loading ? '加入中…' : '加入'}
      </button>
    </form>
  );
}
