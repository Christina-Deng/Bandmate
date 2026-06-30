import { APP_BACKGROUND } from '../../lib/appBackground';

function PosterBackgroundPrint() {
  return (
    <>
      <span className="poster-bg-halftone" />
      <span className="poster-bg-bleed poster-bg-bleed-tr" />
      <span className="poster-bg-bleed poster-bg-bleed-bl" />
      <span className="poster-bg-regmark" />
      <span className="poster-bg-watermark">
        <span className="poster-bg-watermark-main">LIVE</span>
        <span className="poster-bg-watermark-sub">ON TOUR</span>
      </span>
    </>
  );
}

function PosterBackgroundInk() {
  return (
    <>
      <span className="poster-bg-ink-wash" />
      <span className="poster-bg-ink-splash poster-bg-ink-splash-a" />
      <span className="poster-bg-ink-splash poster-bg-ink-splash-b" />
      <span className="poster-bg-ink-fleck poster-bg-ink-fleck-a" />
      <span className="poster-bg-ink-fleck poster-bg-ink-fleck-b" />
      <span className="poster-bg-ink-brush poster-bg-ink-brush-main" />
      <span className="poster-bg-ink-brush poster-bg-ink-brush-secondary" />
    </>
  );
}

interface Props {
  variant?: 'app' | 'auth';
}

export function PosterBackground({ variant = 'app' }: Props) {
  return (
    <div
      className={`poster-bg poster-bg--${APP_BACKGROUND} ${variant === 'auth' ? 'poster-bg--auth' : ''}`}
      aria-hidden="true"
    >
      {APP_BACKGROUND === 'print' ? <PosterBackgroundPrint /> : <PosterBackgroundInk />}
    </div>
  );
}
