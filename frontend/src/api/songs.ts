import { api } from './client';
import type { Locale } from '../lib/i18n/locale';
import type { RecommendationResponse } from '../types/song';

export async function getRecommendations(bandId: string, useAi = false, locale: Locale = 'zh') {
  const { data } = await api.get<RecommendationResponse>('/songs/recommend', {
    params: { bandId, useAi: useAi ? 'true' : 'false', locale },
  });
  return data;
}
