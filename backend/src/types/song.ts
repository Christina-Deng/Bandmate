export interface RecommendedSong {
  id: string;
  title: string;
  artist: string;
  style: string;
  bpm?: number;
  arrangementSummary: string;
  partsSummary: string;
  reason: string;
  arrangementHints: string[];
  programHints: string[];
  stretchHints: string[];
  isStretch: boolean;
  isStyleStretch?: boolean;
  listenUrl: string;
}

export interface RecommendationResponse {
  status: 'coming_soon' | 'ok' | 'empty';
  songs: RecommendedSong[];
  message?: string;
  hints?: string[];
  /** Server has DeepSeek API key configured */
  aiAvailable?: boolean;
  /** Whether this response used AI for copy (false = rule-only) */
  aiUsed?: boolean;
}

/** @deprecated Phase 1 placeholder shape */
export interface Song {
  id: string;
  title: string;
  artist: string;
  style: string;
  minSkillLevel: Record<string, number>;
  bpm?: number;
}
