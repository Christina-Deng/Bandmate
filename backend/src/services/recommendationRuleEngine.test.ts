import { describe, it, expect } from 'vitest';
import { loadSongSeed } from '../lib/songSeedLoader.js';
import { diagnoseEmptyRecommendations } from './recommendationDiagnosis.js';
import {
  assignCoverage,
  evaluateSong,
  rankCandidates,
  scoreCandidates,
  STYLE_MATCH_MIN,
} from './recommendationRuleEngine.js';

const newbieBand = {
  stylePreferences: ['rock', 'pop', 'folk'],
  members: [
    { displayName: '阿杰', instrument: 'GUITAR' as const, skillLevel: 2 },
    { displayName: '大伟', instrument: 'BASS' as const, skillLevel: 2 },
    { displayName: '小雨', instrument: 'DRUMS' as const, skillLevel: 2 },
    { displayName: '小美', instrument: 'VOCALS' as const, skillLevel: 2 },
  ],
};

describe('recommendationRuleEngine', () => {
  it('returns candidates for a newbie rock band', () => {
    const scored = rankCandidates(scoreCandidates(loadSongSeed(), newbieBand));
    expect(scored.length).toBeGreaterThan(10);
    expect(scored.some((c) => c.song.title === '平凡之路')).toBe(true);
  });

  it('excludes songs above skill level', () => {
    const scored = rankCandidates(
      scoreCandidates(loadSongSeed(), {
        stylePreferences: ['rock'],
        members: [
          { displayName: 'A', instrument: 'GUITAR', skillLevel: 1 },
          { displayName: 'B', instrument: 'BASS', skillLevel: 1 },
          { displayName: 'C', instrument: 'DRUMS', skillLevel: 1 },
          { displayName: 'D', instrument: 'VOCALS', skillLevel: 1 },
        ],
      }),
    );
    expect(scored.some((c) => c.song.title === 'Stairway to Heaven')).toBe(false);
  });

  it('includes stretch songs when skill is one level below', () => {
    const seed = loadSongSeed();
    const wonderwall = seed.find((s) => s.title === 'Wonderwall')!;
    const strict = evaluateSong(wonderwall, [
      { displayName: 'G', instrument: 'GUITAR', skillLevel: 1 },
      { displayName: 'V', instrument: 'VOCALS', skillLevel: 1 },
      { displayName: 'B', instrument: 'BASS', skillLevel: 1 },
      { displayName: 'D', instrument: 'DRUMS', skillLevel: 1 },
    ], 0);
    expect(strict).toBeNull();

    const ranked = rankCandidates(
      scoreCandidates(seed, {
        stylePreferences: ['rock', 'pop'],
        members: [
          { displayName: 'G', instrument: 'GUITAR', skillLevel: 1 },
          { displayName: 'V', instrument: 'VOCALS', skillLevel: 1 },
          { displayName: 'B', instrument: 'BASS', skillLevel: 1 },
          { displayName: 'D', instrument: 'DRUMS', skillLevel: 1 },
        ],
      }),
    );
    const stretch = ranked.find((c) => c.song.title === 'Wonderwall');
    expect(stretch).toBeDefined();
    expect(stretch!.isStretch).toBe(true);
    expect(stretch!.stretchHints.length).toBeGreaterThan(0);
  });

  it('ranks non-stretch candidates before stretch', () => {
    const ranked = rankCandidates(
      scoreCandidates(loadSongSeed(), {
        stylePreferences: ['pop'],
        members: [
          { displayName: 'G', instrument: 'GUITAR', skillLevel: 1 },
          { displayName: 'V', instrument: 'VOCALS', skillLevel: 1 },
        ],
      }),
    );
    const firstStretchIdx = ranked.findIndex((c) => c.isStretch);
    if (firstStretchIdx > 0) {
      expect(ranked.slice(0, firstStretchIdx).every((c) => !c.isStretch)).toBe(true);
    }
  });

  it('uses highest skill when multiple members share an instrument', () => {
    const seed = loadSongSeed();
    const wonderwall = seed.find((s) => s.title === 'Wonderwall')!;
    const scored = evaluateSong(
      wonderwall,
      [
        { displayName: '弱', instrument: 'VOCALS', skillLevel: 1 },
        { displayName: '强', instrument: 'VOCALS', skillLevel: 4 },
        { displayName: 'G', instrument: 'GUITAR', skillLevel: 4 },
        { displayName: 'B', instrument: 'BASS', skillLevel: 3 },
        { displayName: 'D', instrument: 'DRUMS', skillLevel: 3 },
      ],
      0,
    );
    expect(scored).not.toBeNull();

    const coverage = assignCoverage([
      { displayName: '弱', instrument: 'VOCALS', skillLevel: 1 },
      { displayName: '强', instrument: 'VOCALS', skillLevel: 4 },
      { displayName: 'G1', instrument: 'GUITAR', skillLevel: 5 },
      { displayName: 'G2', instrument: 'GUITAR', skillLevel: 2 },
    ]);
    expect(coverage.vocals?.displayName).toBe('强');
    expect(coverage.rhythmGuitar?.displayName).toBe('G1');
    expect(coverage.leadGuitar?.displayName).toBe('G2');
  });

  it('adds style-stretch candidates when style matches are scarce', () => {
    const seed = loadSongSeed();
    const scored = scoreCandidates(seed, {
      stylePreferences: ['mathrock'],
      members: [
        { displayName: 'G', instrument: 'GUITAR', skillLevel: 4 },
        { displayName: 'B', instrument: 'BASS', skillLevel: 4 },
        { displayName: 'D', instrument: 'DRUMS', skillLevel: 4 },
        { displayName: 'V', instrument: 'VOCALS', skillLevel: 4 },
      ],
    });
    const styleMatched = scored.filter((c) => !c.isStyleStretch);
    const styleStretch = scored.filter((c) => c.isStyleStretch);
    if (styleMatched.length < STYLE_MATCH_MIN) {
      expect(styleStretch.length).toBeGreaterThan(0);
    }
  });

  it('adds arrangement hints when band has one guitarist for dual-guitar songs', () => {
    const indie = {
      stylePreferences: ['indie', 'rock'],
      members: [
        { displayName: '老陈', instrument: 'GUITAR' as const, skillLevel: 4 },
        { displayName: '阿贝', instrument: 'BASS' as const, skillLevel: 3 },
        { displayName: '鼓王', instrument: 'DRUMS' as const, skillLevel: 4 },
        { displayName: '主唱', instrument: 'VOCALS' as const, skillLevel: 3 },
      ],
    };
    const hotel = rankCandidates(scoreCandidates(loadSongSeed(), indie)).find(
      (c) => c.song.title === 'Hotel California',
    );
    expect(hotel).toBeDefined();
    expect(hotel!.arrangementHints.length + hotel!.programHints.length).toBeGreaterThan(0);
  });
});

describe('recommendationDiagnosis', () => {
  it('suggests questionnaire when members are OTHER', () => {
    const result = diagnoseEmptyRecommendations(loadSongSeed(), {
      stylePreferences: ['rock'],
      members: [{ displayName: 'A', instrument: 'OTHER', skillLevel: 1 }],
    });
    expect(result.hints.some((h) => h.includes('问卷'))).toBe(true);
  });
});
