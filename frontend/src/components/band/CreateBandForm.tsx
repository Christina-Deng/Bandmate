import { useState } from 'react';
import { useBand } from '../../hooks/useBand';

export function CreateBandForm() {
  const { createBand } = useBand();
  const [name, setName] = useState('');
  const [style, setStyle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createBand(name, style || undefined);
    } catch {
      setError('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="font-semibold">创建乐队</h3>
      <input
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        placeholder="乐队名称"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
        placeholder="风格偏好（可选）"
        value={style}
        onChange={(e) => setStyle(e.target.value)}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? '创建中…' : '创建'}
      </button>
    </form>
  );
}
