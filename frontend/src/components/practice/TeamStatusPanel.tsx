import type { TodayMemberStatus } from '../../types/practice';

export function TeamStatusPanel({
  members,
  currentUserId,
}: {
  members: TodayMemberStatus[];
  currentUserId?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="mb-3 font-semibold">今日团队练习</h3>
      <ul className="space-y-2">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          return (
            <li
              key={member.userId}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                isSelf ? 'self-member-highlight' : 'border-slate-800'
              }`}
            >
              <span>{member.displayName}</span>
              {member.checkedIn ? (
                <span className="text-sm text-accent-600">
                  ✅ 已练 {member.durationMinutes} 分钟
                </span>
              ) : (
                <span className="text-sm text-slate-500">⏳ 未练</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
