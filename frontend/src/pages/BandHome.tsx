import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateMyProfile } from '../api/bands';
import { CreateBandForm } from '../components/band/CreateBandForm';
import { JoinBandForm } from '../components/band/JoinBandForm';
import { LeaveBandConfirmDialog } from '../components/band/LeaveBandConfirmDialog';
import { MemberCard } from '../components/band/MemberCard';
import { SkillQuestionnaire } from '../components/shared/SkillQuestionnaire';
import { formatStylePreferences } from '../constants/music';
import { useAuth } from '../hooks/useAuth';
import { useBand } from '../hooks/useBand';
import type { Instrument, QuestionnaireAnswers } from '../types/band';

export function BandHomePage() {
  const { user } = useAuth();
  const { band, loading, refresh, leaveBand } = useBand();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState('');
  const [leaveError, setLeaveError] = useState('');

  if (loading) return <p className="text-slate-400">加载中…</p>;

  if (!band) {
    return (
      <div className="space-y-4">
        {leaveMessage && (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {leaveMessage}
          </p>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          <CreateBandForm />
          <JoinBandForm />
        </div>
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

  async function handleLeaveBandConfirm() {
    if (!band) return;

    setLeaving(true);
    setLeaveMessage('');
    setLeaveError('');
    try {
      const result = await leaveBand(band.id);
      setShowLeaveConfirm(false);
      setLeaveMessage(result.message);
    } catch {
      setLeaveError('退出失败，请稍后重试');
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{band.name}</h1>
          {band.stylePreferences && band.stylePreferences.length > 0 && (
            <p className="text-sm text-slate-400">
              风格：{formatStylePreferences(band.stylePreferences)}
            </p>
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
        <div className="flex flex-wrap gap-2">
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
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              setLeaveError('');
              setShowLeaveConfirm(true);
            }}
            disabled={leaving}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            退出乐队
          </button>
        </div>
      </div>

      {profileIncomplete && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          请先完善资料，以便团队了解你的水平和练习情况。
        </p>
      )}

      {leaveError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {leaveError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {band.members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isSelf={member.user.id === user?.id}
          />
        ))}
      </div>

      <SkillQuestionnaire
        open={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
        onSubmit={handleProfileSubmit}
      />

      <LeaveBandConfirmDialog
        open={showLeaveConfirm}
        bandName={band.name}
        isLastMember={band.members.length === 1}
        loading={leaving}
        error={showLeaveConfirm ? leaveError : undefined}
        onClose={() => {
          if (leaving) return;
          setShowLeaveConfirm(false);
          setLeaveError('');
        }}
        onConfirm={() => void handleLeaveBandConfirm()}
      />
    </div>
  );
}
