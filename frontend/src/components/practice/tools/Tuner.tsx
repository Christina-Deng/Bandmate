import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioContext } from '../../../hooks/useAudioContext';
import {
  detectPitch,
  frequencyToNote,
  GUITAR_STRINGS,
  type DetectedNote,
} from '../../../lib/audio/pitch';

type TunerState = 'idle' | 'listening' | 'error';

export function Tuner() {
  const { getContext } = useAudioContext();
  const [state, setState] = useState<TunerState>('idle');
  const [error, setError] = useState('');
  const [note, setNote] = useState<DetectedNote | null>(null);
  const [referenceHz, setReferenceHz] = useState<number | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    analyserRef.current = null;
    bufferRef.current = null;
    setNote(null);
    setState('idle');
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = bufferRef.current;
    if (!analyser || !buffer) return;

    analyser.getFloatTimeDomainData(buffer);
    const frequency = detectPitch(buffer, analyser.context.sampleRate);
    if (frequency > 0) {
      setNote(frequencyToNote(frequency));
    } else {
      setNote(null);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const ctx = await getContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      streamRef.current = stream;
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);
      setState('listening');
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError('无法访问麦克风，请检查浏览器权限');
      setState('error');
    }
  }, [getContext, tick]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const cents = note?.cents ?? 0;
  const clampedCents = Math.max(-50, Math.min(50, cents));
  const needlePercent = ((clampedCents + 50) / 100) * 100;
  const inTune = note !== null && Math.abs(cents) <= 5;

  return (
    <div className="space-y-5">
      <div>
        <p className="rock-kicker">TUNER</p>
        <h3 className="section-title mt-1">调音器</h3>
        <p className="page-lead mt-1">对着麦克风拨弦，对准绿色区域</p>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-6 text-center">
        <p
          className={`font-display text-5xl tracking-wide ${
            inTune ? 'text-accent-400' : 'text-emphasis'
          }`}
        >
          {note?.name ?? '—'}
        </p>
        <p className="mt-2 text-sm text-slate-400 tabular-nums">
          {note ? `${note.frequency.toFixed(1)} Hz` : '等待输入…'}
        </p>
      </div>

      <div className="space-y-2">
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800">
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-emerald-500/80" />
          <div
            className={`absolute top-0 bottom-0 w-1 rounded-full transition-[left] duration-75 ${
              inTune ? 'bg-emerald-400' : 'bg-accent-500'
            }`}
            style={{ left: `calc(${needlePercent}% - 2px)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 tabular-nums">
          <span>偏低</span>
          <span>{note ? `${cents > 0 ? '+' : ''}${cents} ¢` : '0 ¢'}</span>
          <span>偏高</span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          吉他参考音
        </p>
        <div className="flex flex-wrap gap-2">
          {GUITAR_STRINGS.map((string) => (
            <button
              key={string.label}
              type="button"
              onClick={() => setReferenceHz(string.frequency)}
              className={`rounded-lg border px-2.5 py-1 text-xs tabular-nums transition-colors ${
                referenceHz === string.frequency
                  ? 'border-accent-600 bg-accent-600/15 text-emphasis'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {string.label}
            </button>
          ))}
        </div>
        {referenceHz !== null && (
          <p className="mt-2 text-xs text-slate-500 tabular-nums">
            目标 {referenceHz.toFixed(2)} Hz
            {note
              ? ` · 偏差 ${(note.frequency - referenceHz).toFixed(1)} Hz`
              : ''}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-accent-400">{error}</p>}

      <button
        type="button"
        onClick={() => (state === 'listening' ? stop() : void start())}
        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
          state === 'listening'
            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            : 'bg-accent-600 text-white hover:bg-accent-700'
        }`}
      >
        {state === 'listening' ? '停止调音' : '开始调音'}
      </button>
    </div>
  );
}
