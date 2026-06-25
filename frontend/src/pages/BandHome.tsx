import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateMyProfile } from '../api/bands';
import { CreateBandForm } from '../components/band/CreateBandForm';
import { JoinBandForm } from '../components/band/JoinBandForm';
import { MemberCard } from '../components/band/MemberCard';
import { SkillQuestionnaire } from '../components/shared/SkillQuestionnaire';
import { useAuth } from '../hooks/useAuth';
import { useBand } from '../hooks/useBand';
import type { Instrument, QuestionnaireAnswers } from '../types/band';

export function BandHomePage() {
  const { user } = useAuth();
  const { band, loading, refresh } = useBand();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [copied, setCopied] = useState(false);

  if (loading) return <p className="text-slate-400">加载中…</p>;

  if (!band) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <CreateBandForm />
        <JoinBandForm />
      </div>
    );
  }

  const myMember = band.members.find((m) => m.user.id === user?.id);
  const profileIncomplete = myMember && !myMember.questionnaireAnswers;

  async function handleProfileSubmit(answers: QuestionnaireAnswers, instrument: Instrument) {
    await updateMyProfile(band!.id, { instrument, questionnaireAnswers: answers });
    await refresh();
  }

  async function copyInviteCode() {
    if (!band) return;
    await navigator.clipboard.writeText(band.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{band.name}</h1>
          {band.stylePreference && (
            <p className="text-sm text-slate-400">风格：{band.stylePreference}</p>
          )}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-slate-400">邀请码：</span>
            <code className="rounded bg-slate-800 px-2 py-1">{band.inviteCode}</code>
            <button
              type="button"
              onClick={() => void copyInviteCode()}
              className="text-indigo-300 hover:underline"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowQuestionnaire(true)}
            className="rounded-lg border border-indigo-500 px-4 py-2 text-sm hover:bg-indigo-500/10"
          >
            完善我的资料
          </button>
          <Link
            to="/practice"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
          >
            去打卡
          </Link>
        </div>
      </div>

      {profileIncomplete && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          请先完善资料，以便团队了解你的水平和练习情况。
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {band.members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>

      <SkillQuestionnaire
        open={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
        onSubmit={handleProfileSubmit}
      />
    </div>
  );
}
