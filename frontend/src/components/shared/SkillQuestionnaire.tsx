import { useMemo, useState } from 'react';
import type { Instrument, QuestionnaireAnswers, WeeklyPracticeHours } from '../../types/band';

const instrumentQuestions: Record<Instrument, string[]> = {
  GUITAR: ['开放和弦', '横按', '简单 solo', '视谱或跟谱'],
  BASS: ['根音跟弹', '简单加花', '八度音阶', '视谱或跟谱'],
  DRUMS: ['基本节奏型', '军鼓滚奏', '复合节奏', '踩镲+底鼓协调'],
  VOCALS: ['跟调不跑音', '真假声切换', '气息控制', '简单和声'],
  OTHER: ['基础演奏', '节奏稳定', '简单曲目', '视谱或跟谱'],
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (answers: QuestionnaireAnswers, instrument: Instrument) => Promise<void>;
}

export function SkillQuestionnaire({ open, onClose, onSubmit }: Props) {
  const [instrument, setInstrument] = useState<Instrument>('GUITAR');
  const [weeklyPracticeHours, setWeeklyPracticeHours] = useState<WeeklyPracticeHours>('1-3');
  const [stylePreference, setStylePreference] = useState('any');
  const [skills, setSkills] = useState<boolean[]>([false, false, false, false]);
  const [loading, setLoading] = useState(false);

  const questions = useMemo(() => instrumentQuestions[instrument], [instrument]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(
        { weeklyPracticeHours, stylePreference, instrumentSkills: skills },
        instrument,
      );
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6"
      >
        <h2 className="text-lg font-semibold">完善我的资料</h2>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-indigo-300">乐器</h3>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={instrument}
            onChange={(e) => {
              setInstrument(e.target.value as Instrument);
              setSkills([false, false, false, false]);
            }}
          >
            <option value="GUITAR">吉他</option>
            <option value="BASS">贝斯</option>
            <option value="DRUMS">鼓</option>
            <option value="VOCALS">主唱</option>
            <option value="OTHER">其他</option>
          </select>
        </section>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-indigo-300">练习时长（计入等级）</h3>
          <p className="text-xs text-slate-400">请选择你平均每周的练习时间</p>
          {(
            [
              ['<1', '每周 < 1 小时'],
              ['1-3', '每周 1–3 小时'],
              ['3-5', '每周 3–5 小时'],
              ['5+', '每周 5 小时以上'],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hours"
                checked={weeklyPracticeHours === value}
                onChange={() => setWeeklyPracticeHours(value)}
              />
              {label}
            </label>
          ))}
        </section>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-slate-300">风格偏好</h3>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={stylePreference}
            onChange={(e) => setStylePreference(e.target.value)}
          >
            <option value="rock">摇滚</option>
            <option value="pop">流行</option>
            <option value="folk">民谣</option>
            <option value="metal">金属</option>
            <option value="any">不限</option>
          </select>
        </section>

        <section className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-indigo-300">乐器技术（计入等级）</h3>
          {questions.map((label, index) => (
            <label key={label} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skills[index]}
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
            className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
