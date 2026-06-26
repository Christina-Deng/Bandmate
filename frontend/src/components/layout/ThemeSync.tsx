import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { getStoredTheme, normalizeThemeId } from '../../lib/theme';

export function ThemeSync() {
  const { user, loading } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (loading || !user) return;

    const accountTheme = normalizeThemeId(user.themePreference);

    if (accountTheme) {
      setTheme(accountTheme, { skipAccountSync: true });
      return;
    }

    setTheme(getStoredTheme());
  }, [loading, user?.id, user?.themePreference, setTheme]);

  return null;
}
