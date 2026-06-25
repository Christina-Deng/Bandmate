export interface Song {
  id: string;
  title: string;
  artist: string;
  style: string;
  minSkillLevel: Record<string, number>;
  bpm?: number;
}

export interface RecommendationResponse {
  status: 'coming_soon' | 'ok';
  songs: Song[];
  message?: string;
}
