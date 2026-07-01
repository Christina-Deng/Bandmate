export type AppLocale = 'zh' | 'en';

export function normalizeAppLocale(value: string | null | undefined): AppLocale {
  return value === 'en' ? 'en' : 'zh';
}
