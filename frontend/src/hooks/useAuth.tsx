import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import type { AuthUser } from '../api/auth';
import { normalizeThemeId } from '../lib/theme';
import { registerThemeAccountSync } from '../lib/themeAccountSync';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (input: { displayName?: string }) => Promise<AuthUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<AuthUser | null>(null);
  userRef.current = user;

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    registerThemeAccountSync(async (theme) => {
      if (!userRef.current) return;
      try {
        const updated = await authApi.updateMe({ themePreference: theme });
        setUser(updated);
      } catch {
        /* keep local theme even if sync fails */
      }
    });
    return () => registerThemeAccountSync(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await authApi.login({ email, password });
    setUser(loggedIn);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await authApi.register({ email, password, displayName });
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (input: { displayName?: string }) => {
    const updated = await authApi.updateMe(input);
    setUser(updated);
    return updated;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await authApi.changePassword({ currentPassword, newPassword });
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refresh,
      updateProfile,
      changePassword,
    }),
    [user, loading, login, register, logout, refresh, updateProfile, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useAuthThemePreference(user: AuthUser | null) {
  return normalizeThemeId(user?.themePreference ?? null);
}
