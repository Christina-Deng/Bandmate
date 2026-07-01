import { useLocale } from '../../hooks/useLocale';
import type { RecommendedSong } from '../../types/song';

export function RecommendationCard({ song }: { song: RecommendedSong }) {
  const { t, locale } = useLocale();
  const hintSep = locale === 'en' ? '; ' : '；';
  const labelSep = locale === 'en' ? ': ' : '：';

  return (
    <article className="poster-card space-y-3 rounded-xl p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-emphasis">{song.title}</h3>
          <p className="text-sm text-slate-400">{song.artist}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {song.isStretch && (
            <span className="recommend-stretch-badge shrink-0 rounded-md px-2 py-0.5 text-xs font-medium">
              {t('songs.card.tooHard')}
            </span>
          )}
          {song.isStyleStretch && (
            <span className="shrink-0 rounded-md border border-slate-600 px-2 py-0.5 text-xs font-medium text-slate-300">
              {t('songs.card.styleMismatch')}
            </span>
          )}
        </div>
      </header>
      <p className="text-sm leading-relaxed text-slate-300">{song.reason}</p>
      <dl className="grid gap-1 text-xs text-slate-400">
        <div>
          <dt className="inline text-slate-500">{t('songs.card.lineup')} · </dt>
          <dd className="inline">{song.arrangementSummary}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">{t('songs.card.difficulty')} · </dt>
          <dd className="inline">
            {song.partsSummary}
            {song.bpm ? ` · ${song.bpm} BPM` : ''}
          </dd>
        </div>
      </dl>
      {song.stretchHints.length > 0 && (
        <p className="recommend-hint-stretch text-xs">
          {t('songs.card.stretchHints')}{labelSep}{song.stretchHints.join(hintSep)}
        </p>
      )}
      {song.arrangementHints.length > 0 && (
        <p className="recommend-hint-warn text-xs">
          {t('songs.card.arrangementHints')}{labelSep}{song.arrangementHints.join(hintSep)}
        </p>
      )}
      {song.programHints.length > 0 && (
        <p className="recommend-hint-program text-xs">
          {t('songs.card.programHints')}{labelSep}{song.programHints.join(hintSep)}
        </p>
      )}
      <a
        href={song.listenUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-sm text-accent-400 hover:underline"
      >
        {t('songs.card.searchNetease')}
      </a>
    </article>
  );
}
