import type { AppLocale } from '../lib/locale.js';
import {
  getLlmApiKey,
  isAiRecommendationAvailable,
  LLM_BASE_URL,
  LLM_MODEL,
} from '../config/ai.js';
import type { SeedSong } from '../types/seedSong.js';
import {
  formatArrangementSummary,
  formatPartsSummary,
} from './recommendationFormatter.js';
import type { RuleEngineInput, ScoredCandidate } from './recommendationRuleEngine.js';
import type { AppLocale } from '../lib/locale.js';
import type { AiReasonFailure, AiReasonFailureCode } from './aiFallbackMessage.js';

export type { AiReasonFailure, AiReasonFailureCode };

export interface GenerateReasonsResult {
  reasons: Map<string, string> | null;
  failure?: AiReasonFailure;
}

export interface AiReasonInput {
  bandName: string;
  stylePreferences: string[];
  members: RuleEngineInput['members'];
  songs: ScoredCandidate[];
  locale?: AppLocale;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string; code?: string };
}

type SongRef = Pick<SeedSong, 'title' | 'artist'>;

/** Reason must reference the right song and not name other candidates */
export function isReasonGroundedToSong(
  reason: string,
  song: SongRef,
  otherSongs: SongRef[],
): boolean {
  const text = reason.trim();
  if (!text) return false;

  const mentionsOwn = text.includes(song.title) || text.includes(song.artist);
  if (!mentionsOwn) return false;

  for (const other of otherSongs) {
    if (other.title !== song.title && other.title.length >= 2 && text.includes(other.title)) {
      return false;
    }
    if (other.artist !== song.artist && other.artist.length >= 2 && text.includes(other.artist)) {
      return false;
    }
  }

  return true;
}

function buildUserPayload(input: AiReasonInput): string {
  const locale = input.locale ?? 'zh';
  return JSON.stringify({
    bandName: input.bandName,
    stylePreferences: input.stylePreferences,
    members: input.members.map((m) => ({
      displayName: m.displayName,
      instrument: m.instrument,
      skillLevel: m.skillLevel,
    })),
    songs: input.songs.map(({ song, arrangementHints, programHints }) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      style: song.style,
      arrangementSummary: formatArrangementSummary(song, locale),
      partsSummary: formatPartsSummary(song, locale),
      arrangementHints,
      programHints,
    })),
  });
}

function parseReasonsJson(content: string): { songId: string; reason: string }[] | null {
  const trimmed = content.trim();
  const jsonText =
    trimmed.startsWith('```') ?
      trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    : trimmed;

  try {
    const parsed = JSON.parse(jsonText) as {
      reasons?: { songId: string; reason: string }[];
      picks?: { songId: string; reason: string }[];
    };
    const rows = parsed.reasons ?? parsed.picks;
    if (!Array.isArray(rows)) return null;
    return rows;
  } catch {
    return null;
  }
}

async function readProviderError(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message;
  } catch {
    return undefined;
  }
}

function failureFromHttpStatus(status: number, providerMessage?: string): AiReasonFailure {
  if (status === 429) {
    return { code: 'rate_limit', providerMessage };
  }
  if (status === 401 || status === 403) {
    return { code: 'auth', providerMessage };
  }
  return { code: 'provider_error', providerMessage };
}

const SYSTEM_PROMPT_ZH = `你是 BandMate 乐队排练顾问。曲目已由系统选定，你只需为每首歌写推荐理由。

硬性规则：
1. 每条 reason 必须写出该曲目自己的 title（建议用书名号《》）
2. 禁止提及其他曲目的 title 或 artist
3. 仅根据提供的编制、难度、hints 说明，不要编造歌曲背景或剧情
4. 输出纯 JSON：{"reasons":[{"songId":"song-001","reason":"..."}]}`;

const SYSTEM_PROMPT_EN = `You are BandMate, a band rehearsal advisor. Songs are pre-selected — write a recommendation reason for each only.

Rules:
1. Each reason must mention that song's title (quotes OK)
2. Do not mention any other song's title or artist
3. Use only the provided lineup, difficulty, and hints — no invented backstory
4. Write every reason in English
5. Output JSON only: {"reasons":[{"songId":"song-001","reason":"..."}]}`;

/**
 * Generate grounded reasons for pre-selected songs.
 * Returns songId → reason map; invalid rows are omitted (caller should fallback).
 */
export async function generateReasonsForSongs(
  input: AiReasonInput,
): Promise<GenerateReasonsResult> {
  if (!isAiRecommendationAvailable() || input.songs.length === 0) {
    return { reasons: null };
  }

  const apiKey = getLlmApiKey()!;
  const byId = new Map(input.songs.map((c) => [c.song.id, c.song]));
  const allRefs = input.songs.map((c) => c.song);
  const locale = input.locale ?? 'zh';
  const systemPrompt = locale === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH;

  let response: Response;
  try {
    response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: buildUserPayload(input) },
        ],
      }),
    });
  } catch {
    return { reasons: null, failure: { code: 'network' } };
  }

  if (!response.ok) {
    const providerMessage = await readProviderError(response);
    return {
      reasons: null,
      failure: failureFromHttpStatus(response.status, providerMessage),
    };
  }

  let data: ChatCompletionResponse;
  try {
    data = (await response.json()) as ChatCompletionResponse;
  } catch {
    return { reasons: null, failure: { code: 'bad_response' } };
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return { reasons: null, failure: { code: 'bad_response' } };
  }

  const rows = parseReasonsJson(content);
  if (!rows) {
    return { reasons: null, failure: { code: 'bad_response' } };
  }

  const result = new Map<string, string>();
  for (const row of rows) {
    if (typeof row.songId !== 'string' || typeof row.reason !== 'string') continue;
    const song = byId.get(row.songId);
    if (!song) continue;
    const reason = row.reason.trim();
    const others = allRefs.filter((s) => s.id !== song.id);
    if (isReasonGroundedToSong(reason, song, others)) {
      result.set(row.songId, reason);
    }
  }

  if (result.size === 0) {
    return { reasons: null, failure: { code: 'validation' } };
  }

  return { reasons: result };
}

/** @deprecated Use generateReasonsForSongs — kept for tests */
export async function pickRecommendationsWithAi(
  input: AiReasonInput & { candidates: ScoredCandidate[]; pickCount: number },
): Promise<{ picks: { songId: string; reason: string }[] } | null> {
  const songs = input.candidates.slice(0, input.pickCount);
  const { reasons } = await generateReasonsForSongs({ ...input, songs });
  if (!reasons) return null;
  return {
    picks: songs
      .filter((c) => reasons.has(c.song.id))
      .map((c) => ({ songId: c.song.id, reason: reasons.get(c.song.id)! })),
  };
}
