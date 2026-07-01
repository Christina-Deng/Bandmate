import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { CreateBandForm } from '../components/band/CreateBandForm';
import { JoinBandForm } from '../components/band/JoinBandForm';
import { BandSection } from '../components/band/BandSection';
import { useAuth } from '../hooks/useAuth';
import { useBand } from '../hooks/useBand';
import { useLocale } from '../hooks/useLocale';

export function BandHomePage() {
  const { user } = useAuth();
  const { bands, loading, error, refresh, leaveBand } = useBand();
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState('');
  const [joinMessage, setJoinMessage] = useState('');

  useEffect(() => {
    const message = (location.state as { joinMessage?: string } | null)?.joinMessage;
    if (!message) return;
    setJoinMessage(message);
    navigate('.', { replace: true, state: null });
    void refresh();
  }, [location.state, navigate, refresh]);

  if (loading) return <p className="text-slate-400">{t('common.loading')}</p>;

  async function handleLeave(bandId: string) {
    const result = await leaveBand(bandId);
    setLeaveMessage(result.message);
    return result;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('band.home.title')}
        lead={
          bands.length === 0
            ? t('band.home.leadEmpty')
            : t('band.home.leadCount', { count: bands.length })
        }
      />

      {error && (
        <p className="rounded-lg border border-accent-600/40 bg-accent-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {joinMessage && (
        <p className="rounded-lg border border-accent-500/40 bg-accent-500/10 px-4 py-3 text-sm text-slate-300">
          {joinMessage}
        </p>
      )}

      {leaveMessage && (
        <p className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-slate-300">
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
              {showCreate ? t('common.collapse') : t('band.home.create')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreate(false);
                setShowJoin((v) => !v);
              }}
              className="rounded-lg border border-accent-500 px-4 py-2 text-sm hover:bg-accent-500/10"
            >
              {showJoin ? t('common.collapse') : t('band.home.join')}
            </button>
          </div>
          {showCreate && <CreateBandForm onSuccess={() => { void refresh(); setShowCreate(false); }} />}
          {showJoin && <JoinBandForm onSuccess={() => { void refresh(); setShowJoin(false); }} />}
        </div>
      )}
    </div>
  );
}
