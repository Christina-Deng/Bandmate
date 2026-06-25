import { useState } from 'react';
import { useBand } from '../../hooks/useBand';
import { StyleMultiSelect } from '../shared/StyleMultiSelect';

export function CreateBandForm({ onSuccess }: { onSuccess?: () => void }) {
  const { createBand } = useBand();
  const [name, setName] = useState('');
  const [stylePreferences, setStylePreferences] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createBand(name, stylePreferences.length > 0 ? stylePreferences : undefined);
      setName('');
      setStylePreferences([]);
      onSuccess?.();
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
      <StyleMultiSelect
        label="乐队风格偏好（可选）"
        hint="可多选，帮助成员对齐排练方向"
        selected={stylePreferences}
        onChange={setStylePreferences}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-accent-600 px-4 py-2 font-medium hover:bg-accent-500 disabled:opacity-50"
      >
        {loading ? '创建中…' : '创建'}
      </button>
    </form>
  );
}
