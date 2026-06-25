import {
  formatPlayingExperience,
  formatStylePreferences,
  INSTRUMENT_LABELS,
  resolveStylePreferenceIds,
} from '../../constants/music';
import type { BandMember } from '../../types/band';

export function MemberCard({
  member,
  isSelf = false,
}: {
  member: BandMember;
  isSelf?: boolean;
}) {
  const answers = member.questionnaireAnswers;
  const complete = answers !== null;

  const playingExperience = formatPlayingExperience(
    answers?.playingExperience ?? answers?.weeklyPracticeHours,
  );
  const styleIds = answers ? resolveStylePreferenceIds(answers) : [];

  return (
    <div
      className={`rounded-xl border bg-slate-900 p-4 ${
        isSelf ? 'self-member-highlight' : 'border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{member.user.displayName}</h3>
          <p className="text-sm text-slate-400">{INSTRUMENT_LABELS[member.instrument]}</p>
        </div>
        {!complete && (
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
            资料未完善
          </span>
        )}
      </div>
      <div className="mt-3 text-amber-300">
        {'★'.repeat(member.skillLevel)}
        <span className="text-slate-600">{'★'.repeat(5 - member.skillLevel)}</span>
      </div>

      {complete && (
        <div className="mt-3 space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs">
          <p className="text-slate-400">
            <span className="text-slate-500">琴龄 · </span>
            {playingExperience ?? '未填写'}
          </p>
          <div>
            <p className="mb-1 text-slate-500">喜欢</p>
            {styleIds.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {styleIds.map((id) => (
                  <span
                    key={id}
                    className="rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-300"
                  >
                    {formatStylePreferences([id])}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">未填写</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
