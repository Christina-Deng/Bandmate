import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioContext } from '../../../hooks/useAudioContext';

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;

const TIME_SIGNATURES = [
  { beats: 2, label: '2/4' },
  { beats: 3, label: '3/4' },
  { beats: 4, label: '4/4' },
  { beats: 6, label: '6/8' },
] as const;

function playClick(ctx: AudioContext, time: number, accent: boolean) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.type = 'sine';
  oscillator.frequency.value = accent ? 1200 : 880;
  gain.gain.setValueAtTime(accent ? 0.22 : 0.12, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
  oscillator.start(time);
  oscillator.stop(time + 0.05);
}

export function Metronome() {
  const { getContext } = useAudioContext();
  const [bpm, setBpm] = useState(100);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [running, setRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const runningRef = useRef(false);

  const scheduleBeat = useCallback(
    (ctx: AudioContext, beatInBar: number, time: number) => {
      playClick(ctx, time, beatInBar === 0);
      const delayMs = Math.max(0, (time - ctx.currentTime) * 1000);
      window.setTimeout(() => setCurrentBeat(beatInBar), delayMs);
    },
    [],
  );

  const scheduler = useCallback(async () => {
    const ctx = await getContext();
    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_S) {
      scheduleBeat(ctx, beatIndexRef.current, nextNoteTimeRef.current);
      const secondsPerBeat = 60 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      beatIndexRef.current = (beatIndexRef.current + 1) % beatsPerBar;
    }
  }, [bpm, beatsPerBar, getContext, scheduleBeat]);

  const start = useCallback(async () => {
    const ctx = await getContext();
    beatIndexRef.current = 0;
    setCurrentBeat(0);
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    runningRef.current = true;
    setRunning(true);
  }, [getContext]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setCurrentBeat(0);
    beatIndexRef.current = 0;
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) return undefined;

    void scheduler();
    timerRef.current = window.setInterval(() => {
      if (runningRef.current) void scheduler();
    }, LOOKAHEAD_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running, scheduler]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  function adjustBpm(delta: number) {
    setBpm((prev) => Math.min(240, Math.max(40, prev + delta)));
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="rock-kicker">METRONOME</p>
        <h3 className="section-title mt-1">节拍器</h3>
        <p className="page-lead mt-1">设定速度，跟着节拍练习</p>
      </div>

      <div className="flex items-end justify-center gap-2 py-2">
        <button
          type="button"
          onClick={() => adjustBpm(-5)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-accent-600"
          aria-label="减慢 5 BPM"
        >
          −5
        </button>
        <div className="text-center">
          <p className="stat-number tabular-nums">{bpm}</p>
          <p className="stat-unit">BPM</p>
        </div>
        <button
          type="button"
          onClick={() => adjustBpm(5)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-accent-600"
          aria-label="加快 5 BPM"
        >
          +5
        </button>
      </div>

      <input
        type="range"
        min={40}
        max={240}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="w-full accent-accent-600"
        aria-label="BPM 滑块"
      />

      <div className="flex flex-wrap gap-2">
        {TIME_SIGNATURES.map((sig) => (
          <button
            key={sig.label}
            type="button"
            onClick={() => setBeatsPerBar(sig.beats)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              beatsPerBar === sig.beats
                ? 'border-accent-600 bg-accent-600/15 text-emphasis'
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {sig.label}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-2 py-1" aria-hidden="true">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full transition-all ${
              running && currentBeat === i
                ? 'scale-125 bg-accent-500 shadow-[0_0_12px_color-mix(in_srgb,var(--theme-accent-500)_60%,transparent)]'
                : i === 0
                  ? 'bg-slate-500'
                  : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => (running ? stop() : void start())}
        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
          running
            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            : 'bg-accent-600 text-white hover:bg-accent-700'
        }`}
      >
        {running ? '停止' : '开始'}
      </button>
    </div>
  );
}
