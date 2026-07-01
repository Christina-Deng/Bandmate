import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { joinBand } from '../api/bands';
import { getApiErrorMessage } from '../api/client';
import { AppearanceMenu } from '../components/layout/AppearanceMenu';
import { BrandWordmark } from '../components/layout/BrandWordmark';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { useAuth } from '../hooks/useAuth';
import { useLocale } from '../hooks/useLocale';
import {
  clearPendingInviteCode,
  getPendingInviteCode,
  normalizeInviteCode,
  setPendingInviteCode,
} from '../lib/invite';

export function JoinPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const joinStartedRef = useRef(false);

  const codeFromUrl = normalizeInviteCode(searchParams.get('code'));
  const inviteCode = codeFromUrl ?? getPendingInviteCode();

  useEffect(() => {
    if (codeFromUrl) setPendingInviteCode(codeFromUrl);
  }, [codeFromUrl]);

  async function attemptJoin(code: string) {
    setJoining(true);
    setError('');
    try {
      const band = await joinBand(code);
      clearPendingInviteCode();
      navigate('/', {
        replace: true,
        state: { joinMessage: t('auth.join.success', { name: band.name }) },
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        clearPendingInviteCode();
        navigate('/', {
          replace: true,
          state: { joinMessage: getApiErrorMessage(err, t('auth.join.alreadyJoined')) },
        });
        return;
      }
      setError(getApiErrorMessage(err, t('auth.join.checkCode')));
      setJoining(false);
      joinStartedRef.current = false;
    }
  }

  useEffect(() => {
    if (authLoading || !user || !inviteCode || joinStartedRef.current) return;
    joinStartedRef.current = true;
    void attemptJoin(inviteCode);
  }, [authLoading, user, inviteCode]);

  if (authLoading) {
    return (
      <JoinShell>
        <p className="text-slate-400">{t('common.loading')}</p>
      </JoinShell>
    );
  }

  if (!inviteCode) {
    return (
      <JoinShell>
        <h1 className="page-title text-2xl">{t('auth.join.invalidLink')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t('auth.join.invalidLink')}</p>
        {user ? (
          <Link to="/" className="mt-6 inline-block text-accent-500 hover:text-accent-400">
            {t('common.backToHome')}
          </Link>
        ) : (
          <Link to="/login" className="mt-6 inline-block text-accent-500 hover:text-accent-400">
            {t('auth.login.submit')}
          </Link>
        )}
      </JoinShell>
    );
  }

  if (!user) {
    return (
      <JoinShell>
        <h1 className="page-title text-2xl">{t('auth.join.title')}</h1>
        <p className="page-lead mt-2">
          {t('auth.join.inviteHint')}{' '}
          <code className="rounded bg-slate-800 px-2 py-0.5">{inviteCode}</code>
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/login"
            className="rounded-lg bg-accent-600 px-4 py-2 text-center text-sm font-medium hover:bg-accent-500"
          >
            {t('auth.login.submit')}
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-accent-500 px-4 py-2 text-center text-sm hover:bg-accent-500/10"
          >
            {t('auth.register.submit')}
          </Link>
        </div>
      </JoinShell>
    );
  }

  async function handleRetry() {
    if (!inviteCode) return;
    joinStartedRef.current = true;
    await attemptJoin(inviteCode);
  }

  if (joining && !error) {
    return (
      <JoinShell>
        <p className="text-slate-300">{t('auth.join.joining')}</p>
      </JoinShell>
    );
  }

  if (error) {
    return (
      <JoinShell>
        <h1 className="page-title text-2xl">{t('auth.join.failed')}</h1>
        <p className="mt-2 text-sm text-red-400">{error}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleRetry()}
            className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium hover:bg-accent-500"
          >
            {t('common.retry')}
          </button>
          <Link
            to="/"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            onClick={() => clearPendingInviteCode()}
          >
            {t('common.backToHome')}
          </Link>
        </div>
      </JoinShell>
    );
  }

  return <Navigate to="/" replace />;
}

function JoinShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell mx-auto max-w-md px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <BrandWordmark className="text-2xl" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AppearanceMenu />
        </div>
      </div>
      <div className="poster-card rounded-xl p-6">{children}</div>
    </div>
  );
}
