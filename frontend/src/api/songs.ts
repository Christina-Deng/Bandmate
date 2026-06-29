import { api } from './client';
import type { RecommendationResponse } from '../types/song';

export async function getRecommendations(bandId: string, useAi = false) {
  const { data } = await api.get<RecommendationResponse>('/songs/recommend', {
    params: { bandId, useAi: useAi ? 'true' : 'false' },
  });
  return data;
}
