import { useEffect, useState } from 'react';
import { getRecommendations } from '../api/songs';
import { BandPicker } from '../components/band/BandPicker';
import { useBand } from '../hooks/useBand';

export function SongRecommendPage() {
  const { bands, loading } = useBand();
  const [viewBandId, setViewBandId] = useState('');
  const [message, setMessage] = useState('加载中…');

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

  useEffect(() => {
    if (!viewBandId) return;
    void getRecommendations(viewBandId).then((res) => setMessage(res.message ?? '功能开发中'));
  }, [viewBandId]);

  if (loading) return <p className="text-slate-400">加载中…</p>;

  if (bands.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-8 text-center text-slate-400">
        请先加入或创建乐队
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">🎵 歌单推荐</h1>
        <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">即将上线</span>
      </div>

      {bands.length > 1 && (
        <BandPicker
          bands={bands}
          selectedIds={viewBandId ? [viewBandId] : []}
          onChange={(ids) => setViewBandId(ids[0] ?? '')}
          label="选择乐队"
          hint="为哪个乐队查看推荐（功能开发中）"
        />
      )}

      <p className="text-slate-400">
        根据 {viewBand?.name} 成员水平和风格偏好，智能推荐适合排练的歌曲。
      </p>

      <div className="flex flex-wrap gap-3">
        <select disabled className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 opacity-50">
          <option>摇滚</option>
        </select>
        <select disabled className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 opacity-50">
          <option>全部难度</option>
        </select>
      </div>

      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
        <p className="text-lg text-slate-300">暂无推荐 — 功能开发中</p>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
