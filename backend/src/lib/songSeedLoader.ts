import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SeedSong, SongSeedFile } from '../types/seedSong.js';

const seedPath = join(dirname(fileURLToPath(import.meta.url)), '../../data/songs.seed.json');

let cache: SeedSong[] | null = null;

export function clearSongSeedCache(): void {
  cache = null;
}

export function loadSongSeed(): SeedSong[] {
  if (cache) return cache;

  const raw = JSON.parse(readFileSync(seedPath, 'utf-8')) as SongSeedFile;
  if (raw.version !== 2) {
    throw new Error(`Unsupported songs.seed.json version: ${raw.version}`);
  }

  cache = raw.songs;
  return cache;
}
