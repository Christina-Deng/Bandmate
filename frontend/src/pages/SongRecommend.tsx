import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [emptyHints, setEmptyHints] = useState<string[]>([]);
  const [retryKey, setRetryKey] = useState(0);

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
          setEmptyHints([]);
        } else if (res.status === 'empty' || res.status === 'coming_soon') {
          setSongs([]);
          setStatus('empty');
          setMessage(res.message ?? '暂无匹配曲目');
          setEmptyHints(res.hints ?? []);
        } else {
          setSongs([]);
          setStatus('error');
          setMessage(res.message ?? '加载推荐失败');
          setEmptyHints([]);
        }
      })
      .catch(() => {
        setSongs([]);
        setStatus('error');
        setMessage('加载推荐失败，请稍后重试');
        setEmptyHints([]);
      });
  }, [viewBandId, useAi, retryKey]);

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
      <div className="empty-state-panel rounded-xl p-8 text-center">
        <p className="text-lg text-slate-300">还没有加入乐队</p>
        <p className="mt-2 text-sm text-slate-500">创建或加入乐队后，才能根据成员水平推荐曲目。</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg border border-accent-600 bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500"
        >
          去首页创建 / 加入乐队
        </Link>
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
          根据 {viewBand?.name} 成员水平和
          {viewBand?.stylePreferences && viewBand.stylePreferences.length > 0 ?
            '乐队设置的风格偏好'
          : '成员问卷中的风格（乐队未设置统一风格时）'}
          ，推荐适合排练的歌曲。
        </p>
        <label
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            aiAvailable ? 'control-toggle cursor-pointer' : 'control-toggle-disabled'
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
        <div className="empty-state-panel rounded-xl p-12 text-center text-slate-400">
          {useAi && aiAvailable ? '正在生成 AI 推荐…' : '正在匹配曲库…'}
        </div>
      )}

      {status === 'ok' && message && <p className="info-notice text-sm">{message}</p>}

      {status === 'ok' && songs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {songs.map((song) => (
            <RecommendationCard key={song.id} song={song} />
          ))}
        </div>
      )}

      {(status === 'empty' || status === 'error') && (
        <div className="empty-state-panel rounded-xl p-12 text-center">
          <p className="text-lg text-slate-300">{status === 'error' ? '加载失败' : '暂无推荐'}</p>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
          {emptyHints.length > 0 && (
            <ul className="mx-auto mt-4 max-w-md space-y-2 text-left text-sm text-slate-400">
              {emptyHints.map((hint) => (
                <li key={hint} className="flex gap-2">
                  <span className="text-slate-500">·</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          )}
          {status === 'empty' && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                to="/"
                className="rounded-lg border border-accent-600 bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500"
              >
                去首页完善成员资料
              </Link>
              <Link
                to="/practice"
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-emphasis"
              >
                查看练习页
              </Link>
            </div>
          )}
          {status === 'error' && (
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="mt-6 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              重试
            </button>
          )}
        </div>
      )}
    </div>
  );
}
