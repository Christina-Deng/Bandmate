import axios from 'axios';
import { getStoredLocale } from '../lib/i18n/locale';
import { translate } from '../lib/i18n/translate';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});

/** Turn backend-relative upload paths into absolute URLs for media playback. */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

/** Extract a human-readable message from axios / API errors. */
export function getApiErrorMessage(error: unknown, fallback?: string): string {
  const locale = getStoredLocale();
  const resolvedFallback = fallback ?? translate(locale, 'common.requestFailed');

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return translate(locale, 'common.cannotConnectBackend');
    }
    const data = error.response.data as { error?: { message?: string } } | undefined;
    if (data?.error?.message) return data.error.message;
    if (error.response.status === 409) {
      return translate(locale, 'common.emailAlreadyRegistered');
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return resolvedFallback;
}
