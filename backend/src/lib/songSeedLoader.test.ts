import { describe, it, expect, beforeEach } from 'vitest';
import { loadSongSeed, clearSongSeedCache } from './songSeedLoader.js';

describe('loadSongSeed', () => {
  beforeEach(() => clearSongSeedCache());

  it('loads v2 seed with songs', () => {
    const songs = loadSongSeed();
    expect(songs.length).toBeGreaterThanOrEqual(60);
    expect(songs[0]).toMatchObject({
      id: expect.stringMatching(/^song-/),
      title: expect.any(String),
      arrangement: expect.any(Object),
      parts: expect.any(Object),
      fallbacks: expect.any(Object),
    });
  });

  it('returns cached songs on second call', () => {
    const first = loadSongSeed();
    const second = loadSongSeed();
    expect(first).toBe(second);
  });
});
