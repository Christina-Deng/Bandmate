import { useMemo, useState } from 'react';
import {
  INSTRUMENT_LABELS,
  INSTRUMENT_SKILL_QUESTIONS,
  PLAYING_EXPERIENCE_OPTIONS,
} from '../../constants/music';
import type { Instrument, PlayingExperience, QuestionnaireAnswers } from '../../types/band';
import { StyleMultiSelect } from './StyleMultiSelect';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (answers: QuestionnaireAnswers, instrument: Instrument) => Promise<void>;
}

export function SkillQuestionnaire({ open, onClose, onSubmit }: Props) {
  const [instrument, setInstrument] = useState<Instrument>('GUITAR');
  const [playingExperience, setPlayingExperience] = useState<PlayingExperience>('1-3');
  const [stylePreferences, setStylePreferences] = useState<string[]>([]);
  const [skills, setSkills] = useState<boolean[]>([false, false, false, false, false]);
  const [loading, setLoading] = useState(false);

  const questions = useMemo(() => INSTRUMENT_SKILL_QUESTIONS[instrument], [instrument]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(
        { playingExperience, stylePreferences, instrumentSkills: skills },
        instrument,
      );
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6"
      >
        <h2 className="text-lg font-semibold">完善我的资料</h2>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-emphasis">乐器</h3>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={instrument}
            onChange={(e) => {
              setInstrument(e.target.value as Instrument);
              setSkills([false, false, false, false, false]);
            }}
          >
            {(Object.keys(INSTRUMENT_LABELS) as Instrument[]).map((value) => (
              <option key={value} value={value}>
                {INSTRUMENT_LABELS[value]}
              </option>
            ))}
          </select>
        </section>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-emphasis">学习年限（计入等级）</h3>
          <p className="text-xs text-slate-400">请选择你系统学习或持续演奏该乐器的时长</p>
          {PLAYING_EXPERIENCE_OPTIONS.map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="experience"
                checked={playingExperience === value}
                onChange={() => setPlayingExperience(value as PlayingExperience)}
              />
              {label}
            </label>
          ))}
        </section>

        <div className="mt-4">
          <StyleMultiSelect
            label="个人风格偏好"
            hint="可多选，便于队友了解你想练什么风格"
            selected={stylePreferences}
            onChange={setStylePreferences}
          />
        </div>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-emphasis">乐器技术（计入等级）</h3>
          <p className="text-xs text-slate-400">勾选你已稳定掌握的项目</p>
          {questions.map((label, index) => (
            <label key={label} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skills[index] ?? false}
                onChange={(e) => {
                  const next = [...skills];
                  next[index] = e.target.checked;
                  setSkills(next);
                }}
              />
              已掌握：{label}
            </label>
          ))}
        </section>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 hover:bg-slate-800">
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-accent-600 px-4 py-2 hover:bg-accent-500 disabled:opacity-50"
          >
            {loading ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
