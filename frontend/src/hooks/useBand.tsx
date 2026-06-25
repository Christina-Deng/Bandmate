import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as bandsApi from '../api/bands';
import type { Band } from '../types/band';
import { useAuth } from './useAuth';

interface BandContextValue {
  band: Band | null;
  loading: boolean;
  refresh: () => Promise<void>;
  createBand: (name: string, stylePreference?: string) => Promise<void>;
  joinBand: (inviteCode: string) => Promise<void>;
}

const BandContext = createContext<BandContextValue | null>(null);

export function BandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [band, setBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBand(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await bandsApi.getMyBand();
      setBand(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createBand = useCallback(async (name: string, stylePreference?: string) => {
    const created = await bandsApi.createBand({ name, stylePreference });
    setBand(created);
  }, []);

  const joinBand = useCallback(async (inviteCode: string) => {
    const joined = await bandsApi.joinBand(inviteCode);
    setBand(joined);
  }, []);

  const value = useMemo(
    () => ({ band, loading, refresh, createBand, joinBand }),
    [band, loading, refresh, createBand, joinBand],
  );

  return <BandContext.Provider value={value}>{children}</BandContext.Provider>;
}

export function useBand() {
  const ctx = useContext(BandContext);
  if (!ctx) throw new Error('useBand must be used within BandProvider');
  return ctx;
}
