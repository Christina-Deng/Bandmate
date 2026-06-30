import { FEATURES } from '../config/features.js';
import { isAiRecommendationAvailable } from '../config/ai.js';
import { loadSongSeed } from '../lib/songSeedLoader.js';
import type { RecommendedSong, RecommendationResponse } from '../types/song.js';
import { generateReasonsForSongs } from './recommendationAiService.js';
import { getBand } from './bandService.js';
import { bandToRuleEngineInput } from './bandProfileForRecommend.js';
import {
  buildFallbackReason,
  buildNeteaseSearchUrl,
  formatArrangementSummary,
  formatPartsSummary,
} from './recommendationFormatter.js';
import { diagnoseEmptyRecommendations } from './recommendationDiagnosis.js';
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
    stretchHints: candidate.stretchHints,
    isStretch: candidate.isStretch,
    isStyleStretch: candidate.isStyleStretch === true,
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
  const top = pool.slice(0, RECOMMEND_PICK_COUNT);

  if (useAi && isAiRecommendationAvailable()) {
    const reasons = await generateReasonsForSongs({
      bandName,
      stylePreferences: ruleInput.stylePreferences,
      members: ruleInput.members,
      songs: top,
    });

    if (reasons) {
      let aiReasonCount = 0;
      const songs = top.map((candidate) => {
        const aiReason = reasons.get(candidate.song.id);
        if (aiReason) aiReasonCount += 1;
        return mapCandidateToRecommendedSong(
          candidate,
          bandName,
          aiReason ?? buildFallbackReason(candidate, bandName),
        );
      });

      if (aiReasonCount > 0) {
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
  const profile = bandToRuleEngineInput(band);
  const { bandName, ...ruleInput } = profile;

  const pool = rankCandidates(scoreCandidates(loadSongSeed(), ruleInput)).slice(
    0,
    RECOMMEND_CANDIDATE_POOL,
  );

  if (pool.length === 0) {
    const diagnosis = diagnoseEmptyRecommendations(loadSongSeed(), ruleInput);
    return {
      status: 'empty',
      songs: [],
      message: diagnosis.message,
      hints: diagnosis.hints,
      aiAvailable,
      aiUsed: false,
    };
  }

  const useAi = options.useAi === true;
  const { songs, aiUsed } = await pickWithOptionalAi(pool, bandName, ruleInput, useAi);

  const styleSourceMessage =
    profile.stylePreferenceSource === 'members' ?
      '乐队未设置统一风格，已根据成员问卷中的偏好匹配'
    : undefined;

  const aiFallbackMessage =
    useAi && aiAvailable && !aiUsed ? 'AI 暂时不可用，已使用规则推荐' : undefined;

  const infoMessages = [aiFallbackMessage, styleSourceMessage].filter(Boolean);

  return {
    status: 'ok',
    songs,
    aiAvailable,
    aiUsed,
    message: infoMessages.length > 0 ? infoMessages.join('；') : undefined,
  };
}
