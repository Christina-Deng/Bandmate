import { useState } from 'react';
import { CreateBandForm } from '../components/band/CreateBandForm';
import { JoinBandForm } from '../components/band/JoinBandForm';
import { BandSection } from '../components/band/BandSection';
import { useAuth } from '../hooks/useAuth';
import { useBand } from '../hooks/useBand';

export function BandHomePage() {
  const { user } = useAuth();
  const { bands, loading, error, refresh, leaveBand } = useBand();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState('');

  if (loading) return <p className="text-slate-400">加载中…</p>;

  async function handleLeave(bandId: string) {
    const result = await leaveBand(bandId);
    setLeaveMessage(result.message);
    return result;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">我的乐队</h1>
        <p className="mt-1 text-sm text-slate-400">
          {bands.length === 0
            ? '你还没有加入任何乐队，可以在下方创建或加入'
            : `共 ${bands.length} 个乐队`}
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-accent-600/40 bg-accent-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {leaveMessage && (
        <p className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-slate-200">
          {leaveMessage}
        </p>
      )}

      {bands.length === 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          <CreateBandForm onSuccess={() => void refresh()} />
          <JoinBandForm onSuccess={() => void refresh()} />
        </div>
      ) : (
        <div className="space-y-6">
          {bands.map((band) => (
            <BandSection
              key={band.id}
              band={band}
              currentUserId={user?.id}
              onRefresh={refresh}
              onLeave={handleLeave}
            />
          ))}
        </div>
      )}

      {bands.length > 0 && (
        <div className="space-y-4 border-t border-slate-800 pt-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setShowJoin(false);
                setShowCreate((v) => !v);
              }}
              className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500"
            >
              {showCreate ? '收起' : '成立乐队'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setShowJoin((v) => !v);
              }}
              className="rounded-lg border border-accent-500 px-4 py-2 text-sm hover:bg-accent-500/10"
            >
              {showJoin ? '收起' : '加入乐队'}
            </button>
          </div>
          {showCreate && <CreateBandForm onSuccess={() => { void refresh(); setShowCreate(false); }} />}
          {showJoin && <JoinBandForm onSuccess={() => { void refresh(); setShowJoin(false); }} />}
        </div>
      )}
    </div>
  );
}
