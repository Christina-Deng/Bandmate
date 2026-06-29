import type { RecommendedSong } from '../../types/song';

export function RecommendationCard({ song }: { song: RecommendedSong }) {
  return (
    <article className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3">
      <header>
        <h3 className="text-lg font-semibold">{song.title}</h3>
        <p className="text-sm text-slate-400">{song.artist}</p>
      </header>
      <p className="text-sm leading-relaxed text-slate-300">{song.reason}</p>
      <dl className="grid gap-1 text-xs text-slate-400">
        <div>
          <dt className="inline text-slate-500">编制 · </dt>
          <dd className="inline">{song.arrangementSummary}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">难度 · </dt>
          <dd className="inline">
            {song.partsSummary}
            {song.bpm ? ` · ${song.bpm} BPM` : ''}
          </dd>
        </div>
      </dl>
      {song.arrangementHints.length > 0 && (
        <p className="recommend-hint-warn text-xs">
          编制提示：{song.arrangementHints.join('；')}
        </p>
      )}
      {song.programHints.length > 0 && (
        <p className="recommend-hint-program text-xs">Program 建议：{song.programHints.join('；')}</p>
      )}
      <a
        href={song.listenUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-sm text-accent-400 hover:underline"
      >
        去网易云搜索
      </a>
    </article>
  );
}
