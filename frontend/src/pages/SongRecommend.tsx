import { useEffect, useState } from 'react';
import { getRecommendations } from '../api/songs';
import { BandPicker } from '../components/band/BandPicker';
import { PageHeader } from '../components/layout/PageHeader';
import { RecommendationCard } from '../components/songs/RecommendationCard';
import { useBand } from '../hooks/useBand';
import type { RecommendedSong } from '../types/song';

const USE_AI_STORAGE_KEY = 'bandmate-use-ai-recommendations';

function readUseAiPreference(): boolean {
  try {
    return localStorage.getItem(USE_AI_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function SongRecommendPage() {
  const { bands, loading } = useBand();
  const [viewBandId, setViewBandId] = useState('');
  const [useAi, setUseAi] = useState(readUseAiPreference);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [songs, setSongs] = useState<RecommendedSong[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');
  const [message, setMessage] = useState('');

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
    setStatus('loading');
    void getRecommendations(viewBandId, useAi)
      .then((res) => {
        setAiAvailable(res.aiAvailable === true);
        if (res.status === 'ok') {
          setSongs(res.songs);
          setStatus('ok');
          setMessage(res.message ?? '');
        } else if (res.status === 'empty') {
          setSongs([]);
          setStatus('empty');
          setMessage(res.message ?? '暂无匹配曲目');
        } else {
          setSongs([]);
          setStatus('empty');
          setMessage(res.message ?? '功能开发中');
        }
      })
      .catch(() => {
        setSongs([]);
        setStatus('error');
        setMessage('加载推荐失败，请稍后重试');
      });
  }, [viewBandId, useAi]);

  function handleUseAiChange(checked: boolean) {
    setUseAi(checked);
    try {
      localStorage.setItem(USE_AI_STORAGE_KEY, checked ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title="歌单推荐" lead="根据乐队成员水平与风格智能推荐曲目" />
      </div>

      {bands.length > 1 && (
        <BandPicker
          bands={bands}
          selectedIds={viewBandId ? [viewBandId] : []}
          onChange={(ids) => setViewBandId(ids[0] ?? '')}
          label="选择乐队"
          hint="为哪个乐队查看推荐"
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-400">
          根据 {viewBand?.name} 成员水平和风格偏好，推荐适合排练的歌曲。
        </p>
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            aiAvailable ?
              'border-slate-600 bg-slate-800/80 text-slate-200'
            : 'cursor-not-allowed border-slate-700 bg-slate-900/50 text-slate-500'
          }`}
          title={
            aiAvailable ?
              '勾选后使用 AI 生成个性化推荐理由'
            : '服务端未配置 LLM_API_KEY，仅使用规则推荐'
          }
        >
          <input
            type="checkbox"
            className="rounded border-slate-500 bg-slate-800"
            checked={useAi && aiAvailable}
            disabled={!aiAvailable}
            onChange={(e) => handleUseAiChange(e.target.checked)}
          />
          使用 AI 推荐语
        </label>
      </div>

      {status === 'loading' && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-12 text-center text-slate-400">
          {useAi && aiAvailable ? '正在生成 AI 推荐…' : '正在匹配曲库…'}
        </div>
      )}

      {status === 'ok' && message && (
        <p className="text-sm text-amber-400/90">{message}</p>
      )}

      {status === 'ok' && songs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {songs.map((song) => (
            <RecommendationCard key={song.id} song={song} />
          ))}
        </div>
      )}

      {(status === 'empty' || status === 'error') && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
          <p className="text-lg text-slate-300">暂无推荐</p>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
        </div>
      )}
    </div>
  );
}
