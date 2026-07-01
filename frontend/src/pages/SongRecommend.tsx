import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations } from '../api/songs';
import { BandPicker } from '../components/band/BandPicker';
import { PageHeader } from '../components/layout/PageHeader';
import { NoBandsEmptyState } from '../components/shared/NoBandsEmptyState';
import { RecommendationCard } from '../components/songs/RecommendationCard';
import { useBand } from '../hooks/useBand';
import { useLocale } from '../hooks/useLocale';
import { FEATURES } from '../config/features';
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
  const { t, locale } = useLocale();
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
    void getRecommendations(viewBandId, useAi, locale)
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
          setMessage(res.message ?? t('songs.noMatch'));
          setEmptyHints(res.hints ?? []);
        } else {
          setSongs([]);
          setStatus('error');
          setMessage(res.message ?? t('songs.loadFailed'));
          setEmptyHints([]);
        }
      })
      .catch(() => {
        setSongs([]);
        setStatus('error');
        setMessage(t('songs.loadFailedRetry'));
        setEmptyHints([]);
      });
  }, [viewBandId, useAi, retryKey, locale, t]);

  function handleUseAiChange(checked: boolean) {
    setUseAi(checked);
    try {
      localStorage.setItem(USE_AI_STORAGE_KEY, checked ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }

  if (loading) return <p className="text-slate-400">{t('common.loading')}</p>;

  if (!FEATURES.SONG_RECOMMENDATION) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('songs.title')} lead={t('songs.lead')} />
        <div className="empty-state-panel rounded-xl p-12 text-center">
          <p className="text-lg text-slate-300">{t('songs.noResults')}</p>
        </div>
      </div>
    );
  }

  if (bands.length === 0) {
    return <NoBandsEmptyState description={t('songs.emptyNoBandsHint')} />;
  }

  const styleExplain =
    viewBand?.stylePreferences && viewBand.stylePreferences.length > 0
      ? t('songs.explainBandStyles')
      : t('songs.explainMemberStyles');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t('songs.title')} lead={t('songs.lead')} />
      </div>

      {bands.length > 1 && (
        <BandPicker
          bands={bands}
          selectedIds={viewBandId ? [viewBandId] : []}
          onChange={(ids) => setViewBandId(ids[0] ?? '')}
          label={t('songs.selectBand')}
          hint={t('songs.selectBandHint')}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-400">
          {t('songs.explainPrefix', { name: viewBand?.name ?? '' })}
          {styleExplain}
          {t('songs.explainSuffix')}
        </p>
        <label
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            aiAvailable ? 'control-toggle cursor-pointer' : 'control-toggle-disabled'
          }`}
          title={aiAvailable ? t('songs.aiHintOn') : t('songs.aiHintOff')}
        >
          <input
            type="checkbox"
            className="rounded border-slate-500 bg-slate-800"
            checked={useAi && aiAvailable}
            disabled={!aiAvailable}
            onChange={(e) => handleUseAiChange(e.target.checked)}
          />
          {t('songs.useAi')}
        </label>
      </div>

      {status === 'loading' && (
        <div className="empty-state-panel rounded-xl p-12 text-center text-slate-400">
          {useAi && aiAvailable ? t('songs.loadingAi') : t('songs.loadingMatch')}
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
          <p className="text-lg text-slate-300">
            {status === 'error' ? t('songs.loadFailed') : t('songs.noResults')}
          </p>
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
                {t('songs.completeProfile')}
              </Link>
              <Link
                to="/practice"
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-emphasis"
              >
                {t('songs.viewPractice')}
              </Link>
            </div>
          )}
          {status === 'error' && (
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="mt-6 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              {t('common.retry')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
