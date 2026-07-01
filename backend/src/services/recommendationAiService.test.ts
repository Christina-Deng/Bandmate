import { describe, it, expect } from 'vitest';
import {
  generateReasonsForSongs,
  isReasonGroundedToSong,
  pickRecommendationsWithAi,
} from './recommendationAiService.js';

describe('isReasonGroundedToSong', () => {
  const song = { title: '醉忘川', artist: '惘闻' };
  const others = [
    { title: 'Sleep', artist: 'God Is an Astronaut' },
    { title: '第一号交响曲', artist: '后海大鲨鱼' },
  ];

  it('rejects reason that names a different song', () => {
    const reason =
      'God Is an Astronaut的《Sleep》是一首充满情感的 postrock 作品，适合提升情感表达。';
    expect(isReasonGroundedToSong(reason, song, others)).toBe(false);
  });

  it('accepts reason that mentions the correct title', () => {
    const reason = '《醉忘川》编制友好，适合你们当前水平排练后摇段落。';
    expect(isReasonGroundedToSong(reason, song, others)).toBe(true);
  });

  it('rejects reason that mentions own title but also another song', () => {
    const reason = '《醉忘川》和《Sleep》都是好选择。';
    expect(isReasonGroundedToSong(reason, song, others)).toBe(false);
  });
});

describe('pickRecommendationsWithAi', () => {
  it('returns null when LLM_API_KEY is unset', async () => {
    const prevLlm = process.env.LLM_API_KEY;
    const prevDeepSeek = process.env.DEEPSEEK_API_KEY;
    delete process.env.LLM_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;

    const result = await pickRecommendationsWithAi({
      bandName: '测试乐队',
      stylePreferences: ['rock'],
      members: [{ displayName: 'A', instrument: 'GUITAR', skillLevel: 2 }],
      candidates: [],
      pickCount: 3,
    });

    expect(result).toBeNull();

    if (prevLlm !== undefined) process.env.LLM_API_KEY = prevLlm;
    if (prevDeepSeek !== undefined) process.env.DEEPSEEK_API_KEY = prevDeepSeek;
  });
});

describe('generateReasonsForSongs', () => {
  it('returns null when LLM_API_KEY is unset', async () => {
    const prevLlm = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;

    const result = await generateReasonsForSongs({
      bandName: '测试乐队',
      stylePreferences: ['postrock'],
      members: [],
      songs: [],
    });

    expect(result.reasons).toBeNull();

    if (prevLlm !== undefined) process.env.LLM_API_KEY = prevLlm;
  });
});
