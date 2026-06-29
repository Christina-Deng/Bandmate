/**
 * Phase 2 preview: v2 seed + rule engine + mock recommendation cards.
 *
 * Usage:
 *   npm run preview:recommendations
 *   npm run preview:recommendations -- band-newbie-rock
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSongSeed } from '../src/lib/songSeedLoader.js';
import {
  buildFallbackReason,
  buildNeteaseSearchUrl,
  formatArrangementSummary,
  formatPartsSummary,
} from '../src/services/recommendationFormatter.js';
import {
  rankCandidates,
  scoreCandidates,
  type RuleEngineMember,
} from '../src/services/recommendationRuleEngine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../data');

interface BandProfile {
  id: string;
  bandName: string;
  stylePreferences: string[];
  members: RuleEngineMember[];
  scenario?: string;
}

function loadJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(dataDir, filename), 'utf-8')) as T;
}

function printRecommendationCard(
  index: number,
  scored: ReturnType<typeof rankCandidates>[number],
  profile: BandProfile,
): void {
  const { song, arrangementHints, programHints } = scored;

  console.log(`  ┌─ 推荐 ${index + 1} ─────────────────────────────────`);
  console.log(`  │ ${song.title} — ${song.artist}`);
  console.log(`  │ 编制：${formatArrangementSummary(song)}`);
  console.log(`  │ 难度：${formatPartsSummary(song)} · ${song.bpm ?? '?'} BPM`);
  console.log(`  │ 💬 ${buildFallbackReason(scored, profile.bandName)}`);
  if (arrangementHints.length > 0) {
    console.log(`  │ ⚠️  编制提示：${arrangementHints.join('；')}`);
  }
  if (programHints.length > 0) {
    console.log(`  │ 🎹 Program 建议：${programHints.join('；')}`);
  }
  console.log(`  │ 🔗 ${buildNeteaseSearchUrl(song.title, song.artist)}`);
  console.log(`  └${'─'.repeat(42)}`);
  console.log();
}

function previewProfile(profile: BandProfile, songs: ReturnType<typeof loadSongSeed>): void {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`乐队：${profile.bandName} (${profile.id})`);
  if (profile.scenario) console.log(`场景：${profile.scenario}`);
  console.log(`风格偏好：${profile.stylePreferences.join(', ')}`);

  const ranked = rankCandidates(
    scoreCandidates(songs, {
      stylePreferences: profile.stylePreferences,
      members: profile.members,
    }),
  );

  console.log(`\n📊 规则引擎 — ${ranked.length} 首候选`);

  if (ranked.length === 0) {
    console.log('  ⚠️  无候选');
    return;
  }

  console.log('\n  📋 Top 8\n');
  for (const [i, scored] of ranked.slice(0, 8).entries()) {
    console.log(`  ${String(i + 1).padStart(2)}. ${scored.song.title} — ${scored.song.artist}`);
  }

  console.log('\n  🎴 推荐卡片预览\n');
  for (const [i, scored] of ranked.slice(0, 3).entries()) {
    printRecommendationCard(i, scored, profile);
  }
}

function main(): void {
  const songs = loadSongSeed();
  const { profiles } = loadJson<{ profiles: BandProfile[] }>('band-profiles.sample.json');
  const arg = process.argv[2];

  console.log(`BandMate Phase 2 — ${songs.length} 首曲库`);

  if (arg === '--all' || !arg) {
    for (const profile of profiles) previewProfile(profile, songs);
    return;
  }

  const profile = profiles.find((p) => p.id === arg);
  if (!profile) {
    console.error(`\n未知 id: ${arg}`);
    console.error('可选:', profiles.map((p) => p.id).join(', '));
    process.exit(1);
  }
  previewProfile(profile, songs);
}

main();
