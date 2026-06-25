import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateMyProfile } from '../../api/bands';
import { LeaveBandConfirmDialog } from './LeaveBandConfirmDialog';
import { MemberCard } from './MemberCard';
import { SkillQuestionnaire } from '../shared/SkillQuestionnaire';
import { formatStylePreferences } from '../../constants/music';
import type { Band, Instrument, QuestionnaireAnswers } from '../../types/band';

interface Props {
  band: Band;
  currentUserId?: string;
  onRefresh: () => Promise<void>;
  onLeave: (bandId: string) => Promise<{ disbanded: boolean; message: string }>;
}

export function BandSection({ band, currentUserId, onRefresh, onLeave }: Props) {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  const myMember = band.members.find((m) => m.user.id === currentUserId);
  const profileIncomplete = myMember && !myMember.questionnaireAnswers;

  async function handleProfileSubmit(answers: QuestionnaireAnswers, instrument: Instrument) {
    await updateMyProfile(band.id, { instrument, questionnaireAnswers: answers });
    await onRefresh();
  }

  async function copyInviteCode() {
    await navigator.clipboard.writeText(band.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeaveConfirm() {
    setLeaving(true);
    setLeaveError('');
    try {
      await onLeave(band.id);
      setShowLeaveConfirm(false);
    } catch {
      setLeaveError('退出失败，请稍后重试');
    } finally {
      setLeaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display-heavy text-2xl">{band.name}</h2>
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
              className="text-accent-500 hover:text-accent-400 hover:underline"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowQuestionnaire(true)}
            className="rounded-lg border border-accent-500 px-4 py-2 text-sm hover:bg-accent-500/10"
          >
            完善我的资料
          </button>
          <Link
            to="/practice"
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500"
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
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:border-accent-600 hover:text-accent-500 disabled:opacity-50"
          >
            退出乐队
          </button>
        </div>
      </div>

      {profileIncomplete && (
        <p className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-slate-300">
          请先完善资料，以便团队了解你的水平和练习情况。
        </p>
      )}

      {leaveError && !showLeaveConfirm && (
        <p className="rounded-lg border border-accent-600/40 bg-accent-600/10 px-4 py-3 text-sm text-red-400">
          {leaveError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {band.members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isSelf={member.user.id === currentUserId}
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
        onConfirm={() => void handleLeaveConfirm()}
      />
    </section>
  );
}
