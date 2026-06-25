import { api } from './client';
import type { RecommendationResponse } from '../types/song';

export async function getRecommendations(bandId: string) {
  const { data } = await api.get<RecommendationResponse>('/songs/recommend', {
    params: { bandId },
  });
  return data;
}
