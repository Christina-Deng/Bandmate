import { FEATURES } from '../config/features.js';
import { isAiRecommendationAvailable } from '../config/ai.js';
import { loadSongSeed } from '../lib/songSeedLoader.js';
import type { RecommendedSong, RecommendationResponse } from '../types/song.js';
import { pickRecommendationsWithAi } from './recommendationAiService.js';
import { getBand } from './bandService.js';
import { bandToRuleEngineInput } from './bandProfileForRecommend.js';
import {
  buildFallbackReason,
  buildNeteaseSearchUrl,
  formatArrangementSummary,
  formatPartsSummary,
} from './recommendationFormatter.js';
import {
  rankCandidates,
  scoreCandidates,
  type ScoredCandidate,
} from './recommendationRuleEngine.js';

export const RECOMMEND_CANDIDATE_POOL = 30;
export const RECOMMEND_PICK_COUNT = 6;

function mapCandidateToRecommendedSong(
  candidate: ScoredCandidate,
  bandName: string,
  reason?: string,
): RecommendedSong {
  const { song } = candidate;
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    style: song.style,
    bpm: song.bpm,
    arrangementSummary: formatArrangementSummary(song),
    partsSummary: formatPartsSummary(song),
    reason: reason ?? buildFallbackReason(candidate, bandName),
    arrangementHints: candidate.arrangementHints,
    programHints: candidate.programHints,
    listenUrl: buildNeteaseSearchUrl(song.title, song.artist),
  };
}

function pickTopRuleOnly(
  candidates: ScoredCandidate[],
  bandName: string,
  count: number,
): RecommendedSong[] {
  return candidates.slice(0, count).map((c) => mapCandidateToRecommendedSong(c, bandName));
}

async function pickWithOptionalAi(
  pool: ScoredCandidate[],
  bandName: string,
  ruleInput: Omit<ReturnType<typeof bandToRuleEngineInput>, 'bandName'>,
  useAi: boolean,
): Promise<{ songs: RecommendedSong[]; aiUsed: boolean }> {
  if (useAi && isAiRecommendationAvailable()) {
    const ai = await pickRecommendationsWithAi({
      bandName,
      stylePreferences: ruleInput.stylePreferences,
      members: ruleInput.members,
      candidates: pool,
      pickCount: RECOMMEND_PICK_COUNT,
    });

    if (ai) {
      const byId = new Map(pool.map((c) => [c.song.id, c]));
      const songs = ai.picks
        .map((p) => {
          const candidate = byId.get(p.songId);
          if (!candidate) return null;
          return mapCandidateToRecommendedSong(candidate, bandName, p.reason.trim());
        })
        .filter((s): s is RecommendedSong => s !== null);

      if (songs.length > 0) {
        return { songs, aiUsed: true };
      }
    }
  }

  return {
    songs: pickTopRuleOnly(pool, bandName, RECOMMEND_PICK_COUNT),
    aiUsed: false,
  };
}

export async function getRecommendationsForBand(
  bandId: string,
  userId: string,
  options: { useAi?: boolean } = {},
): Promise<RecommendationResponse> {
  const aiAvailable = isAiRecommendationAvailable();

  if (!FEATURES.SONG_RECOMMENDATION) {
    return {
      status: 'coming_soon',
      songs: [],
      message: '功能开发中，敬请期待',
      aiAvailable,
      aiUsed: false,
    };
  }

  const band = await getBand(bandId, userId);
  const { bandName, ...ruleInput } = bandToRuleEngineInput(band);

  const pool = rankCandidates(scoreCandidates(loadSongSeed(), ruleInput)).slice(
    0,
    RECOMMEND_CANDIDATE_POOL,
  );

  if (pool.length === 0) {
    return {
      status: 'empty',
      songs: [],
      message: '暂无匹配曲目，试试调整乐队风格或完善成员资料',
      aiAvailable,
      aiUsed: false,
    };
  }

  const useAi = options.useAi === true;
  const { songs, aiUsed } = await pickWithOptionalAi(pool, bandName, ruleInput, useAi);

  return {
    status: 'ok',
    songs,
    aiAvailable,
    aiUsed,
    message:
      useAi && aiAvailable && !aiUsed ?
        'AI 暂时不可用，已使用规则推荐'
      : undefined,
  };
}
