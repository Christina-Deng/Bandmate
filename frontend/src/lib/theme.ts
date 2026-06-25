export type ThemeId = 'indigo' | 'rock' | 'light';

export const THEME_STORAGE_KEY = 'bandmate-theme';

export const THEMES: {
  id: ThemeId;
  label: string;
  description: string;
  swatches: [string, string];
}[] = [
  {
    id: 'indigo',
    label: 'Indigo',
    description: '经典靛蓝深色',
    swatches: ['#0f172a', '#6366f1'],
  },
  {
    id: 'rock',
    label: 'Rock',
    description: '红 · 黑 · 白 · 灰',
    swatches: ['#121212', '#dc2626'],
  },
  {
    id: 'light',
    label: 'Light',
    description: '日间亮色',
    swatches: ['#f1f5f9', '#6366f1'],
  },
];

export function isThemeId(value: string | null): value is ThemeId {
  return value === 'indigo' || value === 'rock' || value === 'light';
}

export function getStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'rock';
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
