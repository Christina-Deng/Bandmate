import type { BandMember, Instrument } from '../../types/band';

const instrumentLabels: Record<Instrument, string> = {
  GUITAR: '吉他',
  BASS: '贝斯',
  DRUMS: '鼓',
  VOCALS: '主唱',
  OTHER: '其他',
};

export function MemberCard({ member }: { member: BandMember }) {
  const complete = member.questionnaireAnswers !== null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{member.user.displayName}</h3>
          <p className="text-sm text-slate-400">{instrumentLabels[member.instrument]}</p>
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
    </div>
  );
}
